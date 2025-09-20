import React from 'react';
import { Container, Paper, Typography, Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import RegisterForm from '../components/Auth/RegisterForm';
const Register: React.FC = () => {
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
             Create an account
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
              Join our RAG system
          </Typography>
          
          <RegisterForm />
          
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Se connecter
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;