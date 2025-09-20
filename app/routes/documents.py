from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models
from app.services.ingestion import DocumentProcessor
from app.services.embeddings import embedding_service
from app.routes.auth import get_current_user
import shutil
import os
from typing import List
import traceback
import uuid
from datetime import datetime

router = APIRouter()
document_processor = DocumentProcessor()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _split_into_chunks(text: str, chunk_size: int = 1000) -> List[str]:
    """Split text into fixed-size chunks"""
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload and process a document
    - Text extraction
    - Chunk splitting
    - Embedding generation
    - Storage in Qdrant
    """
    try:
        # Check file type
        if not file.filename:
            raise HTTPException(400, "File must have a name")
        
        # Generate unique filename to avoid collisions
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_location = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file temporarily
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text from document
        text = await document_processor.extract_text(file_location, file.content_type)
        if not text:
            # Clean up temporary file
            os.remove(file_location)
            raise HTTPException(400, "Could not extract text from document")

        # Split text into chunks
        chunks = _split_into_chunks(text)

        # Save metadata in database with user_id
        db_document = models.Document(
            title=file.filename,
            source=file_location,
            content=text,
            file_type=file.content_type,
            file_size=os.path.getsize(file_location),
            processed=False,
            user_id=current_user.id
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        # Generate and store embeddings
        success = await embedding_service.store_embeddings(
            document_id=db_document.id,
            chunks=chunks,
            metadata={
                "filename": file.filename,
                "content_type": file.content_type,
                "original_filename": file.filename,
                "user_id": current_user.id
            }
        )

        # Update document status
        db_document.processed = success
        db.commit()

        # Consistent logs with result
        if not success:
            message = "Document processed but no chunks stored"
        else:
            message = "Document processed and stored successfully"

        # Prepare response
        response_data = {
            "id": db_document.id,
            "title": file.filename,
            "chunks_created": len(chunks),
            "message": message,
            "processed": success,
            "timestamp": datetime.now().isoformat()
        }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Internal server error: {str(e)}")

@router.get("/documents/{document_id}/status")
async def get_document_status(
    document_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get status of an uploaded document
    """
    try:
        # Check that document belongs to user
        document = db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(404, "Document not found")
        
        # Count chunks in Qdrant for this document
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            chunks_count = embedding_service.qdrant_client.count(
                collection_name="documents",
                count_filter=Filter(
                    must=[
                        FieldCondition(key="document_id", match=MatchValue(value=document_id)),
                        FieldCondition(key="user_id", match=MatchValue(value=current_user.id))
                    ]
                )
            )
            chunks_stored = chunks_count.count
        except Exception:
            chunks_stored = 0
        
        return {
            "id": document.id,
            "title": document.title,
            "processed": document.processed,
            "file_size": document.file_size,
            "file_type": document.file_type,
            "chunks_stored": chunks_stored,
            "uploaded_at": document.uploaded_at.isoformat() if document.uploaded_at else None,
            "message": "Status retrieved successfully",
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Internal server error: {str(e)}")

@router.get("/documents")
async def list_documents(
    db: Session = Depends(get_db), 
    skip: int = 0, 
    limit: int = 10,
    current_user: models.User = Depends(get_current_user)
):
    """
    List all uploaded documents with pagination
    """
    try:
        # Filter only user's documents
        documents = db.query(models.Document).filter(
            models.Document.user_id == current_user.id
        ).order_by(models.Document.uploaded_at.desc()).offset(skip).limit(limit).all()
        
        total_count = db.query(models.Document).filter(
            models.Document.user_id == current_user.id
        ).count()
        
        documents_list = []
        for doc in documents:
            documents_list.append({
                "id": doc.id,
                "title": doc.title,
                "file_size": doc.file_size,
                "file_type": doc.file_type,
                "processed": doc.processed,
                "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None
            })
        
        return {
            "documents": documents_list,
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "message": "Document list retrieved successfully",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(500, f"Error retrieving list: {str(e)}")

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Delete a document and its associated chunks
    """
    try:
        # Check that document belongs to user
        document = db.query(models.Document).filter(
            models.Document.id == document_id,
            models.Document.user_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(404, "Document not found or access not authorized")
        
        # Delete chunks from Qdrant
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            embedding_service.qdrant_client.delete(
                collection_name="documents",
                points_selector=Filter(
                    must=[
                        FieldCondition(key="document_id", match=MatchValue(value=document_id)),
                        FieldCondition(key="user_id", match=MatchValue(value=current_user.id))
                    ]
                )
            )
        except Exception:
            pass
        
        # Delete physical file
        if os.path.exists(document.source):
            os.remove(document.source)
        
        # Delete database entry
        db.delete(document)
        db.commit()
        
        return {
            "message": f"Document {document_id} deleted successfully",
            "deleted_id": document_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error during deletion: {str(e)}")