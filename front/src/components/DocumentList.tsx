import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  LinearProgress,
  Avatar,
} from '@mui/material';
import { 
  Delete, 
  Refresh,
  Description,
  CheckCircle,
  Pending,
  CloudDownload,
} from '@mui/icons-material';
import { documentsAPI } from '../api/endpoints';
import { Document } from '../types';

interface DocumentListProps {
  refreshTrigger: number;
}

const DocumentList: React.FC<DocumentListProps> = ({ refreshTrigger }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 10;

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * itemsPerPage;
      const response = await documentsAPI.listDocuments(skip, itemsPerPage);
      setDocuments(response.documents);
      setTotalCount(response.total_count);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error loading documents');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const handleDelete = async () => {
    if (!selectedDocument) return;

    setDeleting(true);
    try {
      await documentsAPI.deleteDocument(selectedDocument.id);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
      fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting document');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshTrigger]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <Description />;
    if (fileType.includes('pdf')) return <Description color="error" />;
    if (fileType.includes('word') || fileType.includes('document')) return <Description color="primary" />;
    if (fileType.includes('text')) return <Description color="success" />;
    return <Description />;
  };

  if (loading && documents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Documents ({totalCount})
        </Typography>
        <Tooltip title="Refresh documents">
          <IconButton onClick={fetchDocuments} color="primary" disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && documents.length > 0 && <LinearProgress />}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ bgcolor: 'grey.100', width: 32, height: 32 }}>
                      {getFileIcon(doc.file_type)}
                    </Avatar>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {doc.title}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                <TableCell>{doc.file_type?.split('/')[1]?.toUpperCase() || 'UNKNOWN'}</TableCell>
                <TableCell>
                  <Chip
                    icon={doc.processed ? <CheckCircle /> : <Pending />}
                    label={doc.processed ? 'Processed' : 'Pending'}
                    color={doc.processed ? 'success' : 'warning'}
                    size="small"
                    variant={doc.processed ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Delete document">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedDocument(doc);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {documents.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <CloudDownload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="body2" color="textSecondary">
            No documents uploaded yet
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Upload your first document to get started
          </Typography>
        </Box>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            disabled={loading}
          />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the document "{selectedDocument?.title}"?
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This action cannot be undone. All associated chunks will be removed from the vector database.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DocumentList;