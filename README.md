
# RAG System - Document Intelligence Platform

A complete Retrieval-Augmented Generation system that allows users to upload documents and ask AI-powered questions with source citations.

## Features

- **Document Processing**: Extract text from PDF, DOCX, and text files
- **Vector Search**: Semantic search using Qdrant vector database
- **AI-Powered Q&A**: Generate answers with proper source citations using OpenAI
- **Modern Interface**: React frontend with Material-UI design
- **Authentication**: JWT-based secure user authentication
- **Caching**: Redis caching for improved performance
- **Multi-Tenant**: Data isolation between users

## Tech Stack

**Backend**: FastAPI, PostgreSQL, Qdrant, Redis, OpenAI API  
**Frontend**: React, TypeScript, Material-UI, Axios  
**Infrastructure**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js (for frontend development)
- OpenAI API key (optional - mock mode available)

### Installation

1. **Clone and setup**
   ```bash
   git clone https://github.com/salmacher/Rag-project.git
   cd Rag-project
   ```

2. **Environment Variables**
   
   Create a `.env` file (Check the attachments in the email)

### Start Backend Services

```bash
docker-compose up -d
```

### Start Frontend

```bash
cd frontend
npm install
npm start
```

### Access Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Backend API**: http://localhost:8000

## Usage

1. **Register/Login** - Create an account and login 
2. **Upload Documents** - Upload PDF, DOCX, or text files through the web interface
3. **Wait for Processing** - Documents are automatically processed and indexed
4. **Ask Questions** - Use the chat interface to ask questions about your documents
5. **View Sources** - Answers include citations to the original documents

## API Endpoints

### Authentication

- `POST /auth/token` - User login to obtain JWT token
- `POST /auth/register` - Create new user account

### Documents Management

- `POST /upload` - Upload and process a document
- `GET /documents` - List all user documents
- `GET /documents/{id}/status` - Get document processing status
- `DELETE /documents/{id}` - Delete a document

### Chat & Query

- `POST /chat/ask` - Ask a question about your documents
- `GET /chat/search` - Search for similar chunks
- `GET /chat/test-openai` - Test OpenAI connection

## Key Features

- **Fallback Mode**: Works without OpenAI API using mock embeddings and responses
- **Multiple File Type Support**: PDF, DOCX, TXT document processing
- **Intelligent Chunking**: Text splitting with overlap for better context retention
- **Source Citation**: Clear attribution of information sources with confidence scores
- **Responsive Design**: Mobile-friendly interface with Material-UI components
- **Redis Caching**: Performance optimization for frequent queries
- **JWT Authentication**: Secure user authentication and authorization

## Next Steps for Production

While this RAG system works well for development, there are several areas I would focus on for production deployment. First, I'd add proper monitoring to track system performance and catch issues early - something like Prometheus for metrics and basic logging. Security is another priority, so I'd implement HTTPS, add rate limiting to prevent abuse, and strengthen input validation. For scalability, I'd set up load balancing and consider using a cloud database service instead of local Docker containers. I'd also create automated tests and a CI/CD pipeline to ensure code quality and easier deployments. Finally, I'd add proper error handling and user feedback mechanisms to make the system more robust when things go wrong. These improvements would help transform this from a working prototype into a production-ready application that can handle real users reliably.
