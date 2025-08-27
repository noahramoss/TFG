// src/pages/MovementList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Container, Paper, Typography, Alert, Grid, Stack, TextField, Select, MenuItem,
  IconButton, Button, List, ListItem, ListItemText, Chip, FormControl, InputLabel,
  Box
} from '@mui/material';
import Pagination from '@mui/material/Pagination';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const ORDERING_OPTIONS = [
  { value: '-fecha', label: 'Fecha (más recientes)' },
  { value: 'fecha',  label: 'Fecha (más antiguas)' },
  { value: '-cantidad', label: 'Cantidad (mayor primero)' },
  { value: 'cantidad',  label: 'Cantidad (menor primero)' },
  { value: 'descripcion',  label: 'Descripción (A–Z)' },
  { value: '-descripcion', label: 'Descripción (Z–A)' },
];

const PAGESIZES = [5, 10, 20, 50];

const getToday = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function MovementList() {
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);

  // creación
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState(getToday());
  const [cantidad, setCantidad] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // filtros
  const [filtroTipo, setFiltroTipo] = useState('');       // '', 'ingreso', 'gasto'
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [desde, setDesde] = useState('');  // YYYY-MM-DD
  const [hasta, setHasta] = useState('');  // YYYY-MM-DD
  const [search, setSearch] = useState(''); // búsqueda por descripción

  // ordenación + paginación
  const [ordering, setOrdering]   = useState('-fecha');
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(10);
  const [count, setCount]         = useState(0);

  // edición
  const [editId, setEditId] = useState(null);
  const [editCategoria, setEditCategoria] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editCantidad, setEditCantidad] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  const [error, setError] = useState('');

  // KPIs desde el backend (no dependen de la página)
  const [kpis, setKpis] = useState({ total_ingresos: 0, total_gastos: 0, balance: 0 });

  useEffect(() => { fetchCategories(); }, []);

  // Auto-ocultar error
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const fetchCategories = () => {
    axios.get('/api/categorias/', { params: { ordering: 'nombre', page_size: 1000 } })
      .then(r => {
        const data = r.data;
        const list = Array.isArray(data) ? data : (data.results || []);
        setCategories(list);
      })
      .catch(() => setError('Error al cargar categorías'));
  };


  // Cuando cambie el filtro de tipo, si la categoría seleccionada ya no encaja, la limpiamos
  useEffect(() => {
    if (!filtroTipo || filtroTipo === '__all__' || !filtroCategoria) return;
    const cat = categories.find(c => c.id === Number(filtroCategoria));
    if (cat && cat.tipo !== filtroTipo) setFiltroCategoria('');
  }, [filtroTipo, filtroCategoria, categories]);

  // Categorías visibles en selects según tipo seleccionado (si hay)
  const categoriesForSelect = categories.filter(
    c => !filtroTipo || filtroTipo === '__all__' || c.tipo === filtroTipo
  );

  // KPIs (totales) del backend con los mismos filtros (sin paginar)
  const fetchResumen = useCallback(() => {
    const params = {};
    if (filtroCategoria && filtroCategoria !== '__all__') params.categoria = filtroCategoria;
    if (filtroTipo && filtroTipo !== '__all__') params.tipo = filtroTipo;
    if (desde) params.date_from = desde;
    if (hasta) params.date_to = hasta;
    if (search) params.search = search;

    axios.get('/api/movimientos/resumen', { params })
      .then(r => setKpis({
        total_ingresos: r.data?.total_ingresos || 0,
        total_gastos:   r.data?.total_gastos   || 0,
        balance:        r.data?.balance        || 0,
      }))
      .catch(() => setError('Error al calcular totales'));
  }, [filtroCategoria, filtroTipo, desde, hasta, search]);

  // Lista paginada
  const fetchMovements = useCallback(() => {
    const params = {
      page,
      page_size: pageSize,
      ordering,
    };
    if (filtroCategoria && filtroCategoria !== '__all__') params.categoria = filtroCategoria;
    if (filtroTipo && filtroTipo !== '__all__') params.tipo = filtroTipo;
    if (desde) params.date_from = desde;
    if (hasta) params.date_to = hasta;
    if (search) params.search = search;

    axios.get('/api/movimientos/', { params })
      .then(r => {
        if (Array.isArray(r.data)) {
          // por si la paginación global no estuviera activa
          setMovements(r.data);
          setCount(r.data.length);
        } else {
          setMovements(r.data.results || []);
          setCount(r.data.count || 0);
        }
      })
      .catch(() => setError('Error al cargar movimientos'));
  }, [page, pageSize, ordering, filtroCategoria, filtroTipo, desde, hasta, search]);

  // Carga cuando cambian filtros, paginación u ordenación
  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  useEffect(() => { fetchResumen(); }, [fetchResumen]);

  // Si cambia cualquier filtro “de criterio”, resetea a página 1
  useEffect(() => { setPage(1); }, [filtroCategoria, filtroTipo, desde, hasta, search, pageSize, ordering]);

  const handleDelete = (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este movimiento?')) return;
    axios.delete(`/api/movimientos/${id}/`)
      .then(() => fetchMovements())
      .catch(() => setError('Error al eliminar movimiento'));
  };

  const handleCreate = e => {
    e.preventDefault();

    // Validación cliente: cantidad > 0
    const val = parseFloat(cantidad);
    if (isNaN(val) || val <= 0) {
      setError('La cantidad debe ser positiva (mayor que 0).');
      return;
    }

    axios.post('/api/movimientos/', {
      categoria: Number(categoria),
      fecha,
      cantidad: val.toFixed(2),
      descripcion
    })
      .then(() => {
        setCategoria('');
        setFecha(getToday());      
        setCantidad('');
        setDescripcion('');
        fetchMovements();
        fetchResumen();
      })
      .catch((err) => {
        const msg = err.response?.data?.cantidad?.[0]
          || err.response?.data?.detail
          || 'Error al crear movimiento';
        setError(msg);
      });
  };

  const startEdit = (m) => {
    setEditId(m.id);
    setEditCategoria(String(m.categoria ?? ''));
    setEditFecha(m.fecha);
    setEditCantidad(String(m.cantidad));
    setEditDescripcion(m.descripcion || '');
  };
  const cancelEdit = () => {
    setEditId(null); setEditCategoria(''); setEditFecha(''); setEditCantidad(''); setEditDescripcion('');
  };

  const saveEdit = (id) => {
    // Validación cliente: cantidad > 0 (edición)
    const val = parseFloat(editCantidad);
    if (isNaN(val) || val <= 0) {
      setError('La cantidad debe ser positiva (mayor que 0).');
      return;
    }

    axios.patch(`/api/movimientos/${id}/`, {
      categoria: Number(editCategoria),
      fecha: editFecha,
      cantidad: val.toFixed(2),
      descripcion: editDescripcion
    }).then(() => { cancelEdit(); fetchMovements(); fetchResumen(); })
     .catch((err) => {
       const msg = err.response?.data?.cantidad?.[0]
         || err.response?.data?.detail
         || 'Error al editar movimiento';
       setError(msg);
     });
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Movimientos</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* KPIs (backend) */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Ingresos</Typography>
            <Typography variant="h6" color="success.main">+{eur.format(kpis.total_ingresos || 0)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Gastos</Typography>
            <Typography variant="h6" color="error.main">-{eur.format(kpis.total_gastos || 0)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Balance</Typography>
            <Typography variant="h6" color={(Number(kpis.balance) || 0) >= 0 ? 'success.main' : 'error.main'}>{eur.format(kpis.balance || 0)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filtros + búsqueda + ordenación + tamaño página */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}>
          <TextField
            label="Desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ flex: '1 1 180px' }}
          />
          <TextField
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ flex: '1 1 180px' }}
          />

          <FormControl fullWidth sx={{ flex: '1 1 200px' }}>
            <InputLabel id="tipo-label">Tipo</InputLabel>
            <Select
              labelId="tipo-label"
              label="Tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <MenuItem value="__all__">Todos</MenuItem>
              <MenuItem value="ingreso">Ingresos</MenuItem>
              <MenuItem value="gasto">Gastos</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ flex: '2 1 280px' }}>
            <InputLabel id="cat-label">Categoría</InputLabel>
            <Select
              labelId="cat-label"
              label="Categoría"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <MenuItem value="__all__">Todas las categorías</MenuItem>
              {categoriesForSelect.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre} ({c.tipo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Buscar descripción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: alquiler, nómina..."
            fullWidth
            sx={{ flex: '2 1 260px' }}
          />

          <FormControl fullWidth sx={{ flex: '1 1 220px' }}>
            <InputLabel id="ordering-label">Ordenar por</InputLabel>
            <Select
              labelId="ordering-label"
              label="Ordenar por"
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
            >
              {ORDERING_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ flex: '0 1 140px' }}>
            <InputLabel id="pagesize-label">Tamaño</InputLabel>
            <Select
              labelId="pagesize-label"
              label="Tamaño"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGESIZES.map(ps => <MenuItem key={ps} value={ps}>{ps}/página</MenuItem>)}
            </Select>
          </FormControl>

          {(desde || hasta || filtroCategoria || filtroTipo || search) && (
            <Button
              variant="outlined"
              onClick={() => { setDesde(''); setHasta(''); setFiltroCategoria(''); setFiltroTipo(''); setSearch(''); }}
              sx={{ flex: { xs: '1 1 200px', sm: '0 0 auto' }, width: { xs: '100%', sm: 'auto' } }}
            >
              Limpiar filtros
            </Button>
          )}
        </Box>
      </Paper>

      {/* Listado */}
      <Paper sx={{ p: 1, mb: 2 }}>
        <List dense>
          {movements.map(mov => {
            const cat = categories.find(c => c.id === mov.categoria);
            const sign = cat?.tipo === 'gasto' ? '-' : '+';
            const amountNum = Number(mov.cantidad);
            const amount = Number.isNaN(amountNum) ? mov.cantidad : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amountNum);

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
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%', alignItems: 'center' }}>
                    <FormControl fullWidth sx={{ flex: '2 1 260px' }}>
                      <InputLabel id="edit-cat-label">Categoría</InputLabel>
                      <Select
                        labelId="edit-cat-label"
                        label="Categoría"
                        value={editCategoria}
                        onChange={(e) => setEditCategoria(e.target.value)}
                        required
                      >
                        {categories.map(c => (
                          <MenuItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Fecha"
                      type="date"
                      value={editFecha}
                      onChange={e=>setEditFecha(e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      sx={{ flex: '1 1 180px' }}
                    />
                    <TextField
                      label="Cantidad (€)"
                      type="number"
                      value={editCantidad}
                      onChange={e=>setEditCantidad(e.target.value)}
                      required
                      inputProps={{ step: '0.01', min: '0.01' }}
                      placeholder="Ej: 1200.00"
                      helperText="Introduce un importe positivo"
                      fullWidth
                      sx={{ flex: '1 1 180px' }}
                    />
                    <TextField
                      label="Descripción"
                      value={editDescripcion}
                      onChange={e=>setEditDescripcion(e.target.value)}
                      fullWidth
                      sx={{ flex: '3 1 300px' }}
                    />
                  </Box>
                ) : (
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                        <strong>{mov.fecha}</strong>
                        <span>— {mov.descripcion || 'Sin descripción'}</span>
                        <Chip size="small" label={`${sign}${amount}`} color={cat?.tipo === 'gasto' ? 'error' : 'success'} />
                      </Stack>
                    }
                    secondary={`Categoría: ${cat?.nombre || '—'}`}
                  />
                )}
              </ListItem>
            );
          })}
          {movements.length === 0 && <ListItem><ListItemText primary="No hay movimientos para mostrar." /></ListItem>}
        </List>

        {/* Controles de paginación */}
        <Stack direction="row" justifyContent="center" sx={{ py: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            showFirstButton
            showLastButton
          />
        </Stack>
      </Paper>

      {/* Creación */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Nuevo Movimiento</Typography>
        <Box
          component="form"
          onSubmit={handleCreate}
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'stretch' }}
        >
          <FormControl fullWidth sx={{ flex: '2 1 280px' }}>
            <InputLabel id="new-cat-label">Categoría</InputLabel>
            <Select
              labelId="new-cat-label"
              label="Categoría"
              value={categoria}
              onChange={(e)=>setCategoria(e.target.value)}
              required
            >
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre} ({c.tipo})</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Fecha"
            type="date"
            value={fecha}
            onChange={e=>setFecha(e.target.value)}
            required
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ flex: '1 1 180px' }}
          />
          <TextField
            label="Cantidad (€)"
            type="number"
            value={cantidad}
            onChange={e=>setCantidad(e.target.value)}
            required
            inputProps={{ step:'0.01', min:'0.01' }}
            placeholder="Ej: 1200.00"
            helperText="Introduce un importe positivo"
            fullWidth
            sx={{ flex: '1 1 180px' }}
          />
          <TextField
            label="Descripción"
            value={descripcion}
            onChange={e=>setDescripcion(e.target.value)}
            fullWidth
            sx={{ flex: '3 1 300px' }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ flex: { xs: '1 1 200px', sm: '0 0 auto' }, width: { xs: '100%', sm: 'auto' } }}
          >
            Añadir
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
