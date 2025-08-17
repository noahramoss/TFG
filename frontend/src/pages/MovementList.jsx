// src/pages/MovementList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Paper, Typography, Alert, Grid, Stack, TextField, Select, MenuItem,
  IconButton, Button, List, ListItem, ListItemText, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

export default function MovementList() {
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);

  // creación
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // filtro
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // edición
  const [editId, setEditId] = useState(null);
  const [editCategoria, setEditCategoria] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editCantidad, setEditCantidad] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (!error) return; const t=setTimeout(()=>setError(''),4000); return ()=>clearTimeout(t); }, [error]);

  const fetchData = () => {
    axios.get('/api/categorias/').then(r => setCategories(r.data)).catch(() => setError('Error al cargar categorías'));
    axios.get('/api/movimientos/').then(r => setMovements(r.data)).catch(() => setError('Error al cargar movimientos'));
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este movimiento?')) return;
    axios.delete(`/api/movimientos/${id}/`).then(() => fetchData()).catch(() => setError('Error al eliminar movimiento'));
  };

  const handleCreate = e => {
    e.preventDefault();
    axios.post('/api/movimientos/', { categoria: Number(categoria), fecha, cantidad, descripcion })
      .then(() => { setCategoria(''); setFecha(''); setCantidad(''); setDescripcion(''); fetchData(); })
      .catch(() => setError('Error al crear movimiento'));
  };

  const startEdit = (m) => {
    setEditId(m.id);
    setEditCategoria(String(m.categoria ?? ''));
    setEditFecha(m.fecha);
    setEditCantidad(String(m.cantidad));
    setEditDescripcion(m.descripcion || '');
  };
  const cancelEdit = () => { setEditId(null); setEditCategoria(''); setEditFecha(''); setEditCantidad(''); setEditDescripcion(''); };
  const saveEdit = (id) => {
    axios.patch(`/api/movimientos/${id}/`, {
      categoria: Number(editCategoria), fecha: editFecha, cantidad: editCantidad, descripcion: editDescripcion
    }).then(() => { cancelEdit(); fetchData(); }).catch(() => setError('Error al editar movimiento'));
  };

  // KPIs
  const totals = movements.reduce((acc, m) => {
    const cat = categories.find(c => c.id === m.categoria);
    const val = Number(m.cantidad) || 0;
    if (cat?.tipo === 'gasto') acc.gastos += val; else acc.ingresos += val;
    return acc;
  }, { ingresos: 0, gastos: 0 });
  const balance = totals.ingresos - totals.gastos;
  const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  const visibles = movements.filter(m => !filtroCategoria || m.categoria === Number(filtroCategoria));

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Movimientos</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Ingresos</Typography>
            <Typography variant="h6" color="success.main">+{eur.format(totals.ingresos)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Gastos</Typography>
            <Typography variant="h6" color="error.main">-{eur.format(totals.gastos)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Balance</Typography>
            <Typography variant="h6">{eur.format(balance)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtro */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="center">
          <Typography variant="body2">Filtrar por categoría</Typography>
          <Select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {categories.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</MenuItem>
            ))}
          </Select>
          {filtroCategoria && (
            <Button variant="outlined" onClick={() => setFiltroCategoria('')}>Quitar filtro</Button>
          )}
        </Stack>
      </Paper>

      {/* Listado */}
      <Paper sx={{ p: 1, mb: 2 }}>
        <List dense>
          {visibles.map(mov => {
            const cat = categories.find(c => c.id === mov.categoria);
            const sign = cat?.tipo === 'gasto' ? '-' : '+';
            const amountNum = Number(mov.cantidad);
            const amount = Number.isNaN(amountNum) ? mov.cantidad : eur.format(amountNum);

            return (
              <ListItem
                key={mov.id}
                secondaryAction={
                  editId === mov.id ? (
                    <Stack direction="row" spacing={1}>
                      <IconButton edge="end" aria-label="save" onClick={() => saveEdit(mov.id)}><SaveIcon /></IconButton>
                      <IconButton edge="end" aria-label="cancel" onClick={cancelEdit}><CloseIcon /></IconButton>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <IconButton edge="end" aria-label="edit" onClick={() => startEdit(mov)}><EditIcon /></IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(mov.id)}><DeleteIcon /></IconButton>
                    </Stack>
                  )
                }
              >
                {editId === mov.id ? (
                  <Stack direction={{ xs:'column', sm:'row' }} spacing={2} sx={{ width: '100%' }}>
                    <Select
                      value={editCategoria}
                      onChange={(e) => setEditCategoria(e.target.value)}
                      sx={{ minWidth: 220 }}
                      required
                    >
                      <MenuItem value="">— Categoría —</MenuItem>
                      {categories.map(c => (
                        <MenuItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</MenuItem>
                      ))}
                    </Select>
                    <TextField type="date" value={editFecha} onChange={e=>setEditFecha(e.target.value)} required />
                    <TextField type="number" inputProps={{ step: '0.01' }} value={editCantidad} onChange={e=>setEditCantidad(e.target.value)} required />
                    <TextField label="Descripción" value={editDescripcion} onChange={e=>setEditDescripcion(e.target.value)} sx={{ flex: 1 }} />
                  </Stack>
                ) : (
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <strong>{mov.fecha}</strong>
                        <span>— {descripcion || mov.descripcion || 'Sin descripción'}</span>
                        <Chip size="small" label={`${sign}${amount}`} color={cat?.tipo === 'gasto' ? 'error' : 'success'} />
                      </Stack>
                    }
                    secondary={`Categoría: ${cat?.nombre || '—'}`}
                  />
                )}
              </ListItem>
            );
          })}
          {visibles.length === 0 && <ListItem><ListItemText primary="No hay movimientos para mostrar." /></ListItem>}
        </List>
      </Paper>

      {/* Creación */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Nuevo Movimiento</Typography>
        <Stack component="form" direction={{ xs:'column', sm:'row' }} spacing={2} onSubmit={handleCreate}>
          <Select value={categoria} onChange={(e)=>setCategoria(e.target.value)} sx={{ minWidth: 220 }} required>
            <MenuItem value="">— Selecciona —</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</MenuItem>)}
          </Select>
          <TextField type="date" value={fecha} onChange={e=>setFecha(e.target.value)} required />
          <TextField type="number" inputProps={{ step:'0.01' }} value={cantidad} onChange={e=>setCantidad(e.target.value)} required />
          <TextField label="Descripción" value={descripcion} onChange={e=>setDescripcion(e.target.value)} sx={{ flex: 1 }} />
          <Button type="submit" variant="contained">Añadir</Button>
        </Stack>
      </Paper>
    </Container>
  );
}
