import os
import uuid
import random
import numpy as np
import openai
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List, Dict, Optional

class EmbeddingService:
    def __init__(self):
        # OpenAI configuration
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.openai_client = openai.OpenAI(api_key=self.openai_api_key) if self.openai_api_key and self.openai_api_key.startswith("sk-") else None

        # Qdrant configuration
        self.qdrant_client = QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"),
            port=int(os.getenv("QDRANT_PORT", "6333")),
            timeout=30.0,
        )

        self.collection_name = "documents"
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimension = 1536

        # Determine mode
        self.use_mock_embeddings = self.openai_client is None
        self._ensure_collection()

    def _ensure_collection(self):
        """Create collection according to Qdrant documentation"""
        try:
            # Check if collection already exists
            collections = self.qdrant_client.get_collections()
            if any(col.name == self.collection_name for col in collections.collections):
                return

            # Create collection
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dimension,
                    distance=Distance.COSINE,
                ),
            )

        except Exception as e:
            raise Exception(f"Error creating collection: {e}")

    def _generate_mock_embedding(self, text: str = None) -> List[float]:
        """Generate normalized mock embedding"""
        if text:
            # Create embedding based on text content (reproducible)
            import hashlib
            seed = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
            random.seed(seed)
        else:
            random.seed(random.randint(0, 2**32))
        
        # Generate random embedding
        embedding = [random.uniform(-1.0, 1.0) for _ in range(self.embedding_dimension)]
        
        # Normalize embedding (CRUCIAL for cosine similarity)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = [x / norm for x in embedding]
        
        return embedding

    async def generate_embeddings(
        self, texts: List[str]
    ) -> Optional[List[List[float]]]:
        """Generate embeddings with guaranteed fallback"""
        if not texts:
            return None

        try:
            # Use OpenAI if available
            if not self.use_mock_embeddings and self.openai_client:
                response = self.openai_client.embeddings.create(
                    input=texts,
                    model=self.embedding_model,
                )
                embeddings = [data.embedding for data in response.data]
                return embeddings

            # Fallback to mock embeddings
            embeddings = [self._generate_mock_embedding(text) for text in texts]
            return embeddings

        except Exception:
            # Fallback to mock embeddings in case of error
            embeddings = [self._generate_mock_embedding(text) for text in texts]
            return embeddings

    async def store_embeddings(
        self, document_id: int, chunks: List[str], metadata: Dict
    ) -> bool:
        """Store embeddings with user_id"""
        try:
            if not chunks:
                return False

            embeddings = await self.generate_embeddings(chunks)
            if not embeddings:
                return False

            points = []
            for idx, (embedding, chunk) in enumerate(zip(embeddings, chunks)):
                point_id = document_id * 1000 + idx

                points.append(
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={
                            "document_id": document_id,
                            "chunk_index": idx,
                            "text": chunk[:1000],
                            "chunk_length": len(chunk),
                            "title": metadata.get("filename", "unknown"),
                            "file_type": metadata.get("content_type", "unknown"),
                            "user_id": metadata.get("user_id"),
                            "is_mock_embedding": self.use_mock_embeddings,
                        },
                    )
                )

            self.qdrant_client.upsert(
                collection_name=self.collection_name, 
                points=points, 
                wait=True,
            )

            return True

        except Exception:
            return False

    async def search_similar_chunks(
        self, 
        query: str, 
        limit: int = 5, 
        score_threshold: float = 0.3,
        user_id: Optional[int] = None
    ) -> List[Dict]:
        """Search with user filtering"""
        try:
            if not query.strip():
                return []

            # Generate query embedding
            query_embeddings = await self.generate_embeddings([query])
            if not query_embeddings:
                return []

            # Build filter if user_id is specified
            from qdrant_client.models import Filter, FieldCondition, MatchValue
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

            formatted_results = [
                {
                    "score": result.score,
                    "text": result.payload.get("text", ""),
                    "document_id": result.payload.get("document_id"),
                    "chunk_index": result.payload.get("chunk_index"),
                    "title": result.payload.get("title", "unknown"),
                    "is_mock": result.payload.get("is_mock_embedding", False)
                }
                for result in results
            ]

            return formatted_results

        except Exception:
            return []


# Global instance
embedding_service = EmbeddingService()