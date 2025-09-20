
from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sqlalchemy.orm import Session
from app.db import models
from app.services.embeddings import EmbeddingService

class RetrievalService:
    def __init__(self, qdrant_client: QdrantClient, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        self.qdrant_client = qdrant_client
        self.collection_name = "documents"

    async def search_similar_chunks(
        self, 
        query: str, 
        limit: int = 10,
        score_threshold: float = 0.3,
        user_id: Optional[int] = None
    ) -> List[Dict]:
        try:
            if not query.strip():
                return []

            query_embeddings = await self.embedding_service.generate_embeddings([query])
            if not query_embeddings:
                return []

            query_filter = None
            if user_id is not None:
                query_filter = Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                )

            results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embeddings[0],
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
                query_filter=query_filter
            )

            formatted_results = []
            for result in results:
                formatted_results.append({
                    "score": result.score,
                    "text": result.payload.get("text", ""),
                    "document_id": result.payload.get("document_id"),
                    "chunk_index": result.payload.get("chunk_index"),
                    "title": result.payload.get("title", "unknown"),
                    "is_mock": result.payload.get("is_mock_embedding", False)
                })

            return formatted_results

        except Exception:
            return []

    async def retrieve_document_context(
        self, 
        db: Session, 
        query: str, 
        max_chunks: int = 5,
        user_id: Optional[int] = None
    ) -> Dict:
        try:
            similar_chunks = await self.search_similar_chunks(
                query=query,
                limit=max_chunks * 3,
                score_threshold=0.1,
                user_id=user_id
            )

            if not similar_chunks:
                return {"query": query, "contexts": [], "documents": []}

            similar_chunks.sort(key=lambda x: x["score"], reverse=True)
            best_chunks = similar_chunks[:max_chunks]
            best_chunks = [chunk for chunk in best_chunks if chunk["score"] > 0.25]
            
            if not best_chunks:
                return {"query": query, "contexts": [], "documents": []}

            used_doc_ids = list(set(chunk["document_id"] for chunk in best_chunks))
            documents_metadata = []
            
            for doc_id in used_doc_ids:
                document = db.query(models.Document).filter(models.Document.id == doc_id).first()
                if document:
                    documents_metadata.append({
                        "id": document.id,
                        "title": document.title,
                        "file_type": document.file_type,
                        "uploaded_at": document.uploaded_at.isoformat() if document.uploaded_at else None,
                        "source": document.source
                    })

            return {
                "query": query,
                "contexts": best_chunks,
                "documents": documents_metadata,
                "total_chunks": len(best_chunks),
                "max_score": max([chunk["score"] for chunk in best_chunks]) if best_chunks else 0,
                "min_score": min([chunk["score"] for chunk in best_chunks]) if best_chunks else 0
            }

        except Exception:
            return {"query": query, "contexts": [], "documents": []}

    def format_context_for_llm(self, contexts: List[Dict]) -> str:
        if not contexts:
            return "No relevant context found in documents."

        formatted_context = "## DOCUMENT CONTEXT:\n\n"
        
        for i, context in enumerate(contexts, 1):
            formatted_context += f"### Document {i}: {context['title']} (Relevance score: {context['score']:.3f})\n"
            formatted_context += f"{context['text']}\n\n"
            formatted_context += "---\n\n"

        formatted_context += "## INSTRUCTIONS:\n"
        formatted_context += "Answer the question using exclusively the context above.\n"
        formatted_context += "Cite your sources with format: [Filename]\n"
        formatted_context += "If information is not in context, say so clearly."

        return formatted_context

    async def search_in_document(
        self, 
        document_id: int, 
        query: str, 
        limit: int = 10,
        user_id: Optional[int] = None
    ) -> List[Dict]:
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            
            query_embeddings = await self.embedding_service.generate_embeddings([query])
            if not query_embeddings:
                return []

            filters = [FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            if user_id is not None:
                filters.append(FieldCondition(key="user_id", match=MatchValue(value=user_id)))
            
            query_filter = Filter(must=filters)

            results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embeddings[0],
                query_filter=query_filter,
                limit=limit,
                with_payload=True,
            )

            return [
                {
                    "score": result.score,
                    "text": result.payload.get("text", ""),
                    "chunk_index": result.payload.get("chunk_index"),
                    "title": result.payload.get("title", "unknown"),
                }
                for result in results
            ]

        except Exception:
            return []

    async def get_document_chunks(
        self, 
        document_id: int, 
        limit: int = 50,
        user_id: Optional[int] = None
    ) -> List[Dict]:
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            
            filters = [FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            if user_id is not None:
                filters.append(FieldCondition(key="user_id", match=MatchValue(value=user_id)))
            
            query_filter = Filter(must=filters)

            scroll_response = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=query_filter,
                with_payload=True,
                limit=limit
            )

            chunks = scroll_response[0]
            
            return [
                {
                    "chunk_index": chunk.payload.get("chunk_index"),
                    "text_preview": chunk.payload.get("text", "")[:100] + "...",
                    "text_length": len(chunk.payload.get("text", "")),
                    "score": None
                }
                for chunk in chunks
            ]

        except Exception:
            return []
