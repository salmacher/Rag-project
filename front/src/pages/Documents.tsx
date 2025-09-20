import React, { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import FileUpload from '../components/FileUpload';
import DocumentList from '../components/DocumentList';

const Documents: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Document Management
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FileUpload onUploadSuccess={handleUploadSuccess} />
      </Box>
      
      <DocumentList refreshTrigger={refreshTrigger} />
    </Container>
  );
};

export default Documents;