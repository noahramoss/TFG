// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Paper, Typography, TextField, Button, Stack, Alert,
  InputAdornment, IconButton, Box, Link
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { setToken, isAuthenticated } from '../services/auth';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya estás autenticado, manda a /categorias
  useEffect(() => {
    if (isAuthenticated()) navigate('/categorias', { replace: true });
  }, [navigate]);

  // Auto-oculta los errores a los 4s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/registro/', {
        username, email, password, password2
      });
      const token = res.data?.token;
      if (!token) throw new Error('No se recibió token');
      setToken(token);
      navigate('/categorias', { replace: true });
    } catch (err) {
      const data = err.response?.data;
        let msg = 'No se pudo registrar. Revisa los datos.';

        if (Array.isArray(data?.password)) {
            // Une todos los mensajes de contraseña
            msg = data.password.join(' ');
        } else if (data?.password2) {
            msg = data.password2;
        } else if (Array.isArray(data?.username)) {
            msg = data.username[0];
        } else if (Array.isArray(data?.email)) {
            msg = data.email[0];
        } else if (data?.detail) {
            msg = data.detail;
        }

        setError(msg);
        } finally {
        setLoading(false);
        }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={1} sx={{ p: 4, width: '100%' }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, textAlign: 'center' }}>
          Crear cuenta
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Regístrate para empezar a gestionar tus finanzas
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} role="alert">{error}</Alert>}

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
              label="Email (opcional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <TextField
              label="Contraseña"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              helperText="Mínimo 8 caracteres, no solo números, que no sea demasiado similar a tu usuario y evita contraseñas comunes."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(v=>!v)} edge="end">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Repite la contraseña"
              type={showPw2 ? 'text' : 'password'}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw2(v=>!v)} edge="end">
                      {showPw2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              startIcon={<PersonAddIcon />}
              disabled={loading}
              size="large"
            >
              {loading ? 'Creando…' : 'Crear cuenta'}
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              ¿Ya tienes cuenta?{' '}
              <Link component={RouterLink} to="/login">Inicia sesión</Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
