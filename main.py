
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from config import settings
from app.routes import documents, chat,auth  


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RAG API",
    description="API pour le système RAG (Retrieval-Augmented Generation) avec Qdrant",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(documents.router, prefix="/api", tags=["documents"])
app.include_router(chat.router, prefix="/api", tags=["chat"])  

@app.get("/")
async def root():
    return {"message": "RAG API is running with PostgreSQL and Qdrant"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "database": "PostgreSQL",
        "vector_db": "Qdrant",
        "services": ["fastapi", "postgresql", "qdrant", "openai"]
    }