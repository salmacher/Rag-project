import React from 'react';
import { Container, Typography, Card, CardContent, Button, Box } from '@mui/material';
import { Upload, Chat, List } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Upload fontSize="large" />,
      title: 'Document Upload',
      description: 'Upload your PDF, TXT, DOCX files to add them to the knowledge base.',
      action: 'Upload',
      path: '/documents',
    },
    {
      icon: <List fontSize="large" />,
      title: 'Document Management',
      description: 'View, manage, and delete your uploaded documents.',
      action: 'View Documents',
      path: '/documents',
    },
    {
      icon: <Chat fontSize="large" />,
      title: 'Intelligent Chat',
      description: 'Ask questions and get answers based on your documents’ content.',
      action: 'Start',
      path: '/chat',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          RAG System
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Retrieval-Augmented Generation for your documents
        </Typography>
        <Typography variant="body1">
          Upload your documents, query them, and get precise answers with cited sources.
        </Typography>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          flexWrap: 'wrap',
          gap: 4,
          justifyContent: 'center'
        }}
      >
        {features.map((feature, index) => (
          <Box 
            key={index}
            sx={{ 
              width: { xs: '100%', md: 'calc(33.333% - 32px)' },
              minWidth: { md: '300px' },
              flex: { md: '1 1 0' }
            }}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box color="primary.main" mb={2}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {feature.description}
                </Typography>
              </CardContent>
              <Box p={2} textAlign="center">
                <Button
                  variant="contained"
                  onClick={() => navigate(feature.path)}
                  fullWidth
                >
                  {feature.action}
                </Button>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default Home;
