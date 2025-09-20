import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Home from './pages/Home';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Register from './pages/Register';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Composant de protection de route
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div>Chargement...</div>
      </Box>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Composant pour les routes publiques (login/register) quand on est déjà connecté
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div>Chargement...</div>
      </Box>
    );
  }
  
  return user ? <Navigate to="/" /> : <>{children}</>;
};

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {user && <Header onMenuClick={() => setSidebarOpen(true)} />}
      {user && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      
      <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Routes protégées */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;