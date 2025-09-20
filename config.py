
import os
from typing import List

class Settings:
    def __init__(self):
        # Environment detection
        self.IN_DOCKER = os.getenv("IN_DOCKER", "false").lower() == "true"
        
        # Database 
        if self.IN_DOCKER:
            self.DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:salma@123@postgres:5432/rag")
            self.QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
            self.REDIS_HOST = os.getenv("REDIS_HOST", "redis")
        else:
            self.DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:salma@123@localhost:5433/rag")
            self.QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
            self.REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
        
        # Qdrant
        self.QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
        
        # Redis
        self.REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
        self.REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
        self.REDIS_DB = int(os.getenv("REDIS_DB", 0))
        self.REDIS_CACHE_TTL = int(os.getenv("REDIS_CACHE_TTL", 3600))
        
        # OpenAI 
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  
        if not self.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # LLM
        self.LLM_MODEL = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
        self.LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "1000"))
        self.LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.1"))
        
        # Security
        self.SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
        self.ALGORITHM = os.getenv("ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
        
        # CORS
        self.CORS_ORIGINS = ["http://localhost:3000", "http://localhost:8000"]

# Instance globale
settings = Settings()