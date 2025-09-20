import React from 'react';
import { Container, Paper, Typography, Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LoginForm from '../components/Auth/LoginForm';

const Login: React.FC = () => {
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
             Login
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
               Sign in to your RAG account
          </Typography>
          
          <LoginForm />
          
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2">
               Don't have an account?{' '}
              <Link component={RouterLink} to="/register" variant="body2">
                 Create account
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;