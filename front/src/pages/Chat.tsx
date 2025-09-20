// Chat.tsx
import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import ChatBox from '../components/ChatBox';

const Chat: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Chat with your documents
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '360px 1fr' },
          alignItems: 'start',
        }}
      >
      
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ask questions
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} paragraph>
            This assistant helps you explore your documents and provides answers
            with cited sources.
          </Typography>
        </Paper>

     
        <ChatBox />
      </Box>
    </Container>
  );
};

export default Chat;
