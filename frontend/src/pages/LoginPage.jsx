// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  InputAdornment,
  IconButton,
  Box,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { setToken, isAuthenticated } from '../services/auth';

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Si ya hay token, redirige a /categorias
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/categorias', { replace: true });
    }
  }, [navigate]);

  // Auto-ocultar error a los 4s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api-token-auth/', { username, password });
      const token = res.data?.token;
      if (!token) throw new Error('No se recibió token');
      setToken(token);
      navigate('/categorias', { replace: true });
    } catch (err) {
      const serverMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.[0] ||
        'Usuario o contraseña incorrectos';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={1} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, textAlign: 'center' }}>
          BalanC
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Inicia sesión para continuar
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}

        {/* Formulario de login */}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              fullWidth
              required
            />

            <TextField
              label="Contraseña"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPw((v) => !v)}
                      edge="end"
                    >
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              startIcon={<LoginIcon />}
              disabled={loading}
              size="large"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </Stack>
        </Box>

        {/* Enlace a registro como botón programático */}
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
          ¿No tienes cuenta?{' '}
          <Button variant="text" onClick={() => navigate('/registro')}>
            Crear cuenta
          </Button>
        </Typography>
      </Paper>
    </Container>
  );
}
