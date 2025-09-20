import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur de connexion');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        required
      />
      
      <TextField
        fullWidth
        label="Mot de passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        required
      />
      
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
       Login
      </Button>
    </Box>
  );
};

export default LoginForm;