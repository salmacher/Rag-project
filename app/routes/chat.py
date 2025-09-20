from typing import List
from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.retrieval import RetrievalService
from app.services.llm_service import LLMService
from app.services.embeddings import EmbeddingService
from qdrant_client import QdrantClient
from config import settings
import time
from datetime import datetime
from app.db import models
from app.routes.auth import get_current_user

router = APIRouter()

qdrant_client = QdrantClient(
    host=settings.QDRANT_HOST,
    port=settings.QDRANT_PORT
)

embedding_service = EmbeddingService()
retrieval_service = RetrievalService(qdrant_client, embedding_service)
llm_service = LLMService()

@router.post("/chat/ask")
async def ask_question(
    question: str = Body(..., embed=True),
    max_results: int = Body(5),
    response_style: str = Body("concise"),
    include_sources: bool = Body(True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Ask a question and get an answer based on documents"""
    try:
        start_time = time.time()

        if not question or not question.strip():
            raise HTTPException(400, "Question cannot be empty")

        # 1. Retrieve context filtered by user
        context_data = await retrieval_service.retrieve_document_context(
            db=db,
            query=question,
            max_chunks=max_results,
            user_id=current_user.id
        )

        retrieval_time = time.time()

        if not context_data["contexts"]:
            return {
                "question": question,
                "answer": "I couldn't find relevant information in your documents to answer your question.",
                "sources": [],
                "confidence": 0,
                "context_available": False,
                "retrieval_time": f"{retrieval_time - start_time:.2f}s",
                "llm_time": "0s",
                "total_time": f"{time.time() - start_time:.2f}s",
                "timestamp": datetime.now().isoformat(),
                "success": True,
            }

        # 2. Format context for LLM
        formatted_context = retrieval_service.format_context_for_llm(
            context_data["contexts"]
        )

        # 3. Generate response with LLM
        llm_response = await llm_service.generate_answer(
            query=question,
            context=formatted_context,
            response_style=response_style,
        )

        llm_time = time.time()
        total_time = time.time() - start_time

        # Prepare sources with used chunks
        sources_with_context = []
        for chunk in context_data["contexts"]:
            doc = next((d for d in context_data["documents"] if d["id"] == chunk["document_id"]), None)
            if doc:
                sources_with_context.append({
                    "id": f"{chunk['document_id']}-{chunk['chunk_index']}",
                    "score": chunk["score"],
                    "text": chunk["text"],
                    "document_id": chunk["document_id"],
                    "title": doc["title"],
                    "chunk_index": chunk["chunk_index"]
                })

        # Prepare final response
        response_data = {
            "question": question,
            "answer": llm_response["answer"],
            "sources": sources_with_context if include_sources else [],
            "retrieved_chunks": len(context_data["contexts"]),
            "confidence": context_data["max_score"],
            "response_style": response_style,
            "context_available": True,
            "retrieval_time": f"{retrieval_time - start_time:.2f}s",
            "llm_time": f"{llm_time - retrieval_time:.2f}s",
            "total_time": f"{total_time:.2f}s",
            "timestamp": datetime.now().isoformat(),
            "success": llm_response["success"],
        }

        if include_sources and llm_response.get("sources"):
            response_data["llm_sources"] = llm_response["sources"]

        return response_data

    except Exception as e:
        raise HTTPException(500, f"Error during processing: {str(e)}")

@router.get("/chat/search")
async def search_chunks(
    query: str,
    limit: int = 10,
    score_threshold: float = 0.3,
    current_user: models.User = Depends(get_current_user)
):
    """Simple search for similar chunks"""
    try:
        results = await retrieval_service.search_similar_chunks(
            query=query,
            limit=limit,
            score_threshold=score_threshold,
            user_id=current_user.id
        )

        return {
            "query": query,
            "results": results,
            "total_results": len(results),
            "has_results": len(results) > 0,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        raise HTTPException(500, f"Search error: {str(e)}")

@router.get("/chat/test-openai")
async def test_openai_connection(
    current_user: models.User = Depends(get_current_user)
):
    """Test OpenAI connection"""
    try:
        result = await llm_service.test_openai_connection()
        return {
            "openai_status": result,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(500, f"OpenAI test error: {str(e)}")