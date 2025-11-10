// src/pages/CategoryList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container, Paper, Typography, Alert, Stack, TextField, Button,
  List, ListItem, ListItemText, IconButton, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function getServerMessage(err, fallback = 'Ocurrió un error') {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;              
  if (typeof data.detail === 'string') return data.detail; 
  if (Array.isArray(data.detail) && data.detail[0]) return data.detail[0]; 

  const first = Object.values(data)
    .flat()
    .find((v) => typeof v === 'string');
  return first || fallback;
}

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('ingreso'); 
  const [filtroTipo, setFiltroTipo] = useState(''); 
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => { fetchCategories(); }, []);

  // auto-ocultar mensajes
  useEffect(() => {
    if (!error && !info) return;
    const t = setTimeout(() => { setError(''); setInfo(''); }, 4000);
    return () => clearTimeout(t);
  }, [error, info]);

  const fetchCategories = () => {
    axios.get('/api/categorias/', { params: { ordering: 'nombre', page_size: 1000 } })
      .then(r => setCategories(Array.isArray(r.data) ? r.data : (r.data.results || [])))
      .catch(() => setError('Error al cargar categorías'));
  };


  const handleCreate = (e) => {
    e.preventDefault();
    axios.post('/api/categorias/', { nombre: nombre.trim(), tipo })
      .then(() => {
        setNombre('');
        setTipo('ingreso');
        setInfo('Categoría creada correctamente');
        fetchCategories();
      })
      .catch(err => {
        setError(getServerMessage(err, 'No se pudo crear la categoría'));
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta categoría?')) return;
    axios.delete(`/api/categorias/${id}/`)
      .then(() => { setInfo('Categoría eliminada'); fetchCategories(); })
      .catch(err => {
        setError(getServerMessage(err, 'No se pudo eliminar la categoría'));
      });
  };

  // Filtrado: '__all__' equivale a "sin filtro"
  const filtered = categories.filter(c =>
    !filtroTipo || filtroTipo === '__all__' || c.tipo === filtroTipo
  );

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Categorías</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

      {/* Filtro por tipo */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="filtro-tipo-label">Filtrar por tipo</InputLabel>
            <Select
              labelId="filtro-tipo-label"
              label="Filtrar por tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              {/* Valor centinela: muestra "Todas" y no aplica filtro */}
              <MenuItem value="__all__">Todas</MenuItem>
              <MenuItem value="ingreso">Ingresos</MenuItem>
              <MenuItem value="gasto">Gastos</MenuItem>
            </Select>
          </FormControl>
          {(filtroTipo && filtroTipo !== '') && (
            <Button variant="outlined" onClick={() => setFiltroTipo('')}>
              Limpiar
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Listado */}
      <Paper sx={{ p: 1, mb: 2 }}>
        <List dense>
          {filtered.map(cat => (
            <ListItem
              key={cat.id}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(cat.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{cat.nombre}</span>
                    <Chip size="small" label={cat.tipo} color={cat.tipo === 'gasto' ? 'error' : 'success'} />
                  </Stack>
                }
              />
            </ListItem>
          ))}
          {filtered.length === 0 && <ListItem><ListItemText primary="No hay categorías para mostrar." /></ListItem>}
        </List>
      </Paper>

      {/* Crear nueva categoría */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Nueva Categoría</Typography>
        <Stack component="form" direction={{ xs:'column', sm:'row' }} spacing={2} onSubmit={handleCreate}>
          <TextField label="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} required sx={{ flex: 1 }} />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel id="tipo-create-label">Tipo</InputLabel>
            <Select
              labelId="tipo-create-label"
              label="Tipo"
              value={tipo}
              onChange={(e)=>setTipo(e.target.value)}
              required
            >
              <MenuItem value="ingreso">Ingreso</MenuItem>
              <MenuItem value="gasto">Gasto</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained">Crear</Button>
        </Stack>
      </Paper>
    </Container>
  );
}
