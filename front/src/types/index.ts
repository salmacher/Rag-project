export interface User {
  id: number;
  email: string;
  full_name: string | null;  
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  
}
export interface Document {
  id: number;
  title: string;  
  source: string;
  content: string | null;
  file_type: string | null;
  file_size: number | null;
  processed: boolean;
  uploaded_at: string;
  user_id: number;  
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  document_id: number;
  title: string;
  chunk_index: number;
}

export interface ChatMessage {
  question: string;
  answer: string;
  sources: SearchResult[];
  confidence: number;
  timestamp: string;
   total_time?: string;
  retrieval_time?: string;
  llm_time?: string;
  context_available?: boolean;
  success?: boolean;
}

export interface UploadResponse {
  id: number;
  filename: string;
  chunks_created: number;
  message: string;
  processed: boolean;
  timestamp: string;
}