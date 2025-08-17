// src/pages/CategoryList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Paper, Typography, Alert, Stack, TextField, Select, MenuItem,
  IconButton, Button, List, ListItem, ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('ingreso');
  const [error, setError] = useState('');

  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('ingreso');

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (!error) return; const t=setTimeout(()=>setError(''),4000); return ()=>clearTimeout(t); }, [error]);

  const fetchCategories = () => {
    axios.get('/api/categorias/')
      .then(res => setCategories(res.data))
      .catch(() => setError('Error al cargar categorías'));
  };

  const handleCreate = e => {
    e.preventDefault();
    axios.post('/api/categorias/', { nombre, tipo })
      .then(() => { setNombre(''); setTipo('ingreso'); fetchCategories(); })
      .catch(() => setError('Error al crear categoría'));
  };

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditNombre(cat.nombre);
    setEditTipo(cat.tipo);
  };
  const cancelEdit = () => { setEditId(null); setEditNombre(''); setEditTipo('ingreso'); };

  const saveEdit = (id) => {
    axios.patch(`/api/categorias/${id}/`, { nombre: editNombre, tipo: editTipo })
      .then(() => { cancelEdit(); fetchCategories(); })
      .catch(err => setError(err.response?.data?.detail || 'Error al editar categoría'));
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta categoría?')) return;
    axios.delete(`/api/categorias/${id}/`)
      .then(() => fetchCategories())
      .catch(err => {
        const msg = err.response?.data?.detail
          || err.response?.data?.non_field_errors?.[0]
          || err.response?.data?.[0]
          || 'No se pudo eliminar (puede tener movimientos).';
        setError(msg);
      });
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Categorías</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <List dense>
          {categories.map(cat => (
            <ListItem
              key={cat.id}
              secondaryAction={
                editId === cat.id ? (
                  <Stack direction="row" spacing={1}>
                    <IconButton edge="end" aria-label="save" onClick={() => saveEdit(cat.id)}><SaveIcon /></IconButton>
                    <IconButton edge="end" aria-label="cancel" onClick={cancelEdit}><CloseIcon /></IconButton>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <IconButton edge="end" aria-label="edit" onClick={() => startEdit(cat)}><EditIcon /></IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(cat.id)}><DeleteIcon /></IconButton>
                  </Stack>
                )
              }
            >
              {editId === cat.id ? (
                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                  <TextField
                    size="small"
                    label="Nombre"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Select
                    size="small"
                    value={editTipo}
                    onChange={(e) => setEditTipo(e.target.value)}
                  >
                    <MenuItem value="ingreso">Ingreso</MenuItem>
                    <MenuItem value="gasto">Gasto</MenuItem>
                  </Select>
                </Stack>
              ) : (
                <ListItemText
                  primary={`${cat.nombre}`}
                  secondary={`Tipo: ${cat.tipo}`}
                />
              )}
            </ListItem>
          ))}
          {categories.length === 0 && (
            <ListItem><ListItemText primary="No hay categorías aún." /></ListItem>
          )}
        </List>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Nueva Categoría</Typography>
        <Stack component="form" direction={{ xs:'column', sm:'row' }} spacing={2} onSubmit={handleCreate}>
          <TextField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            sx={{ flex: 1 }}
          />
          <Select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="ingreso">Ingreso</MenuItem>
            <MenuItem value="gasto">Gasto</MenuItem>
          </Select>
          <Button type="submit" variant="contained">Crear</Button>
        </Stack>
      </Paper>
    </Container>
  );
}
