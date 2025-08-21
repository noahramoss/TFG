// src/components/Navbar.jsx
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { clearToken, isAuthenticated } from '../services/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!isAuthenticated() || pathname === '/login' || pathname === '/registro') return null;

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar position="static" elevation={0} color="inherit" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          TFG Finanzas
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            component={RouterLink}
            to="/categorias"
            color="primary"
            variant={pathname.startsWith('/categorias') ? 'contained' : 'text'}
          >
            Categorías
          </Button>
          <Button
            component={RouterLink}
            to="/movimientos"
            color="primary"
            variant={pathname.startsWith('/movimientos') ? 'contained' : 'text'}
          >
            Movimientos
          </Button>
          <Button
            component={RouterLink}
            to="/estadisticas"
            color="primary"
            variant={pathname.startsWith('/dashboard' || pathname.startsWith('/estadisticas')) ? 'contained' : 'text'}
          >
            Estadísticas
          </Button>
        </Stack>

        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={handleLogout} color="error" variant="outlined">
          Cerrar sesión
        </Button>
      </Toolbar>
    </AppBar>
  );
}
