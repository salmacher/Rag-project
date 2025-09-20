import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Stack,
  IconButton,
} from '@mui/material';
import { Send, Psychology, Source } from '@mui/icons-material';
import { chatAPI } from '../api/endpoints';
import { ChatMessage } from '../types';

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const question = inputMessage.trim();
    setInputMessage('');
    setLoading(true);
    setError(null);

    const tempMessage: ChatMessage = {
      question,
      answer: '...',
      sources: [],
      confidence: 0,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await chatAPI.askQuestion(question);
      setMessages((prev) => [...prev.slice(0, -1), response]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error while generating the response');
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { ...tempMessage, answer: 'Sorry, something went wrong.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">RAG Assistant</Typography>
        <IconButton sx={{ color: 'white' }} title="Test OpenAI connection">
          <Psychology />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {messages.length === 0 ? (
          <Typography
            variant="body2"
            color="textSecondary"
            textAlign="center"
            sx={{ mt: 8 }}
          >
             Ask a question to start the conversation
          </Typography>
        ) : (
          <Stack spacing={2}>
            {messages.map((message, index) => (
              <Box key={index}>
                {/* User message */}
                <Box display="flex" justifyContent="flex-end" mb={1}>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: 'primary.light',
                      color: 'white',
                      maxWidth: '70%',
                      borderRadius: 3,
                    }}
                  >
                    <Typography variant="body1">{message.question}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Paper>
                  <Avatar sx={{ ml: 1, bgcolor: 'primary.main' }}>👤</Avatar>
                </Box>

                {/* Assistant message */}
                <Box display="flex" alignItems="flex-start" mb={1}>
                  <Avatar sx={{ mr: 1, bgcolor: 'secondary.main' }}></Avatar>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'white',
                      maxWidth: '75%',
                      borderRadius: 3,
                    }}
                  >
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {loading && index === messages.length - 1
                        ? '...'
                        : message.answer}
                    </Typography>

                    {message.confidence > 0 && (
                      <Chip
                        label={`Confidence: ${Math.round(message.confidence * 100)}%`}
                        size="small"
                        color={message.confidence > 0.7 ? 'success' : 'warning'}
                        sx={{ mb: 1 }}
                      />
                    )}

                    {/* Sources as cards */}
                    {message.sources && message.sources.length > 0 && (
                      <Stack spacing={1} mt={1}>
                        {message.sources.map((source, idx) => (
                          <Card key={idx} variant="outlined">
                            <CardContent sx={{ p: 1.5 }}>
                              <Typography variant="subtitle2">
                                <Source fontSize="small" sx={{ mr: 0.5 }} />
                                {source.title}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {source.text?.slice(0, 120) || 'No text available'}...
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, display: 'flex', gap: 1, bgcolor: 'grey.100' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask something about your documents..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          multiline
          maxRows={3}
          sx={{ borderRadius: 2, bgcolor: 'white' }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={loading || !inputMessage.trim()}
          startIcon={<Send />}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatBox;
