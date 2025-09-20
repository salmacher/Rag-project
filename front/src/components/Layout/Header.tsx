import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Logout, 
  AccountCircle 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const navigation = [
    { label: 'Home', path: '/' },
    { label: 'Documents', path: '/documents' },
    { label: 'Chat', path: '/chat' },
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
   
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          RAG System
        </Typography>
        
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          {navigation.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              variant={location.pathname === item.path ? 'outlined' : 'text'}
              sx={{ mx: 0.5 }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* User section and logout */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 2, 
                display: { xs: 'none', md: 'block' } 
              }}
            >
              Hello, {user.full_name || user.email}
            </Typography>
            
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              aria-label="user menu"
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'secondary.main',
                  fontSize: '0.875rem'
                }}
              >
                {user.email.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                }
              }}
            >
              <MenuItem onClick={handleProfile}>
                <AccountCircle sx={{ mr: 2 }} />
                My Account
              </MenuItem>
              
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 2 }} />
                Logout
              </MenuItem>
            </Menu>

            {/* Logout button visible only on mobile */}
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
              title="Logout"
            >
              <Logout />
            </IconButton>
          </Box>
        )}

        {/* Login/Register buttons if not authenticated */}
        {!user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              variant="outlined"
              size="small"
            >
              Login
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/register')}
              variant="contained"
              size="small"
              sx={{ 
                bgcolor: 'secondary.main',
                '&:hover': { bgcolor: 'secondary.dark' }
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
