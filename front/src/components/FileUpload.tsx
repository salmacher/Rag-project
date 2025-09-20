import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Close,
  InsertDriveFile,
} from '@mui/icons-material';
import { documentsAPI } from '../api/endpoints';
import { UploadResponse } from '../types';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setUploadResult(null);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const result = await documentsAPI.uploadDocument(selectedFile);
      setUploadResult(result);
      onUploadSuccess();
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    handleFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <InsertDriveFile color="error" />;
      case 'docx':
      case 'doc':
        return <InsertDriveFile color="primary" />;
      case 'txt':
        return <InsertDriveFile color="success" />;
      default:
        return <InsertDriveFile />;
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ p: 3, mb: 3 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Typography variant="h6" gutterBottom>
        Upload Document
      </Typography>

      <Box
        sx={{
          border: dragOver ? '2px dashed' : '2px dashed transparent',
          borderColor: dragOver ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          bgcolor: dragOver ? 'primary.50' : 'grey.50',
          transition: 'all 0.2s ease',
          mb: 2,
        }}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Drag & drop your file here or
        </Typography>
        
        <Button
          variant="outlined"
          component="label"
          disabled={uploading}
          sx={{ mb: 2 }}
        >
          Browse Files
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            accept=".pdf,.txt,.docx,.md,.text"
          />
        </Button>
        
        <Typography variant="caption" color="textSecondary" display="block">
          Supported formats: PDF, TXT, DOCX, MD (Max: 50MB)
        </Typography>
      </Box>

      {selectedFile && (
        <Fade in>
          <Box 
            sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'grey.300', 
              borderRadius: 2, 
              mb: 2,
              bgcolor: 'grey.50'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'grey.100' }}>
                  {getFileIcon(selectedFile.name)}
                </Avatar>
                <Box>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Remove file">
                <IconButton size="small" onClick={clearSelection} disabled={uploading}>
                  <Close />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Fade>
      )}

      <Box display="flex" gap={2} alignItems="center">
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          startIcon={uploading ? <></> : <CloudUpload />}
          sx={{ minWidth: 120 }}
        >
          {uploading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </Button>

        {selectedFile && (
          <Button
            variant="outlined"
            onClick={clearSelection}
            disabled={uploading}
          >
            Cancel
          </Button>
        )}
      </Box>

      {uploading && <LinearProgress sx={{ mt: 2 }} />}

      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }} 
          onClose={() => setError(null)}
          action={
            <IconButton size="small" onClick={() => setError(null)}>
              <Close />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {uploadResult && (
        <Fade in>
          <Alert
            severity={uploadResult.processed ? 'success' : 'warning'}
            icon={uploadResult.processed ? <CheckCircle /> : <Error />}
            sx={{ mt: 2 }}
            onClose={() => setUploadResult(null)}
          >
            {uploadResult.message}
            {uploadResult.processed && (
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`${uploadResult.chunks_created} chunks created`}
                  size="small"
                  variant="outlined"
                />
              
              </Box>
            )}
          </Alert>
        </Fade>
      )}
    </Paper>
  );
};

export default FileUpload;