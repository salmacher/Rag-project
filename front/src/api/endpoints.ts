import apiClient from './apiClient';
import { Document, SearchResult, UploadResponse, ChatMessage, User } from '../types';

export const documentsAPI = {

  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },


  listDocuments: async (skip: number = 0, limit: number = 10): Promise<{documents: Document[], total_count: number}> => {
    const response = await apiClient.get(`/documents?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  
  getDocumentStatus: async (documentId: number): Promise<Document> => {
    const response = await apiClient.get(`/documents/${documentId}/status`);
    return response.data;
  },

 
  deleteDocument: async (documentId: number): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`);
  },


  searchChunks: async (query: string, limit: number = 5): Promise<{results: SearchResult[]}> => {
    const response = await apiClient.get(`/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },
};
export const authAPI = {
  
  login: async (email: string, password: string): Promise<{ access_token: string; token_type: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await apiClient.post('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  
  register: async (email: string, password: string, fullName: string): Promise<void> => {
    await apiClient.post('/register', {
      email,
      password,
      full_name: fullName,
    });
  },


  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/me');
    return response.data;
  },
};


apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const chatAPI = {

  askQuestion: async (question: string, maxResults: number = 5, responseStyle: string = "concise"): Promise<ChatMessage> => {
    const response = await apiClient.post('/chat/ask', {
      question,
      max_results: maxResults,
      response_style: responseStyle,
      include_sources: true,
    });
    return response.data;
  },

  
  searchSimilar: async (query: string, limit: number = 10): Promise<{results: SearchResult[]}> => {
    const response = await apiClient.get(`/chat/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

 
  testOpenAI: async (): Promise<{openai_status: string}> => {
    const response = await apiClient.get('/chat/test-openai');
    return response.data;
  },
  
};