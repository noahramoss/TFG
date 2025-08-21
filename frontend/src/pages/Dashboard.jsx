// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Container, Paper, Typography, Stack, TextField, Button, Alert, Grid
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function Dashboard() {
  const hoy = new Date();
  const inicioAnio = `${hoy.getFullYear()}-01-01`;
  const finAnio = `${hoy.getFullYear()}-12-31`;

  const [desde, setDesde] = useState(inicioAnio);
  const [hasta, setHasta] = useState(finAnio);

  const [seriesMensual, setSeriesMensual] = useState([]);   // [{month, ingresos, gastos, balance}]
  const [catsResumen, setCatsResumen]   = useState([]);      // [{categoria__nombre, categoria__tipo, total}, ...]

  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    const params = {};
    if (desde) params.date_from = desde;
    if (hasta) params.date_to = hasta;

    Promise.all([
      axios.get('/api/movimientos/resumen-mensual/', { params }),
      axios.get('/api/movimientos/resumen/',        { params }),
    ]).then(([m, r]) => {
      setSeriesMensual(m.data?.series || []);
      setCatsResumen(r.data?.por_categoria || []);
    }).catch(() => setError('Error al cargar datos del dashboard'));
  }, [desde, hasta]);

  // Carga inicial/automática
  useEffect(() => { cargar(); }, [cargar]);

  // Auto-ocultar error
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  // KPI del periodo (basado en serie mensual)
  const totalIngresos = seriesMensual.reduce((a, m) => a + (m.ingresos || 0), 0);
  const totalGastos   = seriesMensual.reduce((a, m) => a + (m.gastos   || 0), 0);
  const balance       = totalIngresos - totalGastos;

  // Atajos de rango
  const setEsteMes = () => {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last  = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setDesde(ymd(first)); setHasta(ymd(last));
  };
  const setMesAnterior = () => {
    const d = new Date();
    const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const last  = new Date(d.getFullYear(), d.getMonth(), 0);
    setDesde(ymd(first)); setHasta(ymd(last));
  };
  const setYTD = () => {
    const d = new Date();
    const first = new Date(d.getFullYear(), 0, 1);
    setDesde(ymd(first)); setHasta(ymd(new Date()));
  };

  // Datos para pie charts por categoría
  const dataIng = catsResumen
    .filter(c => c['categoria__tipo'] === 'ingreso')
    .map(c => ({ name: c['categoria__nombre'], value: Number(c.total) }));

  const dataGas = catsResumen
    .filter(c => c['categoria__tipo'] === 'gasto')
    .map(c => ({ name: c['categoria__nombre'], value: Number(c.total) }));

  const sum = arr => arr.reduce((a, x) => a + x.value, 0);
  const totalIngCats = sum(dataIng);
  const totalGasCats = sum(dataGas);

  // Paletas (MUI-ish)
  const colorsIng = ['#1b5e20', '#2e7d32', '#43a047', '#66bb6a', '#81c784', '#a5d6a7'];
  const colorsGas = ['#b71c1c', '#c62828', '#e53935', '#ef5350', '#ef9a9a', '#ffcdd2'];

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Estadísticas</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="center">
          <TextField
            label="Desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={cargar}>Actualizar</Button>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={setEsteMes}>Este mes</Button>
            <Button variant="outlined" onClick={setMesAnterior}>Mes anterior</Button>
            <Button variant="outlined" onClick={setYTD}>Año en curso</Button>
          </Stack>
        </Stack>
      </Paper>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Ingresos (periodo)</Typography>
            <Typography variant="h6">
              {totalIngresos.toLocaleString('es-ES', { style:'currency', currency:'EUR' })}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Gastos (periodo)</Typography>
            <Typography variant="h6">
              {totalGastos.toLocaleString('es-ES', { style:'currency', currency:'EUR' })}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Balance (periodo)</Typography>
            <Typography variant="h6">
              {balance.toLocaleString('es-ES', { style:'currency', currency:'EUR' })}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráfico mensual */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Ingresos vs Gastos por mes</Typography>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={seriesMensual}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ingresos" stackId="a" name="Ingresos" fill="#2e7d32" />
              <Bar dataKey="gastos"   stackId="a" name="Gastos"   fill="#c62828" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Paper>

      {/* Quesitos por categoría */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Ingresos por categoría</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Total: {totalIngCats.toLocaleString('es-ES', { style:'currency', currency:'EUR' })}
            </Typography>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip formatter={(v) => v.toLocaleString('es-ES', { style:'currency', currency:'EUR' })} />
                  <Legend />
                  <Pie
                    data={dataIng}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}
                  >
                    {dataIng.map((_, i) => <Cell key={i} fill={colorsIng[i % colorsIng.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Gastos por categoría</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Total: {totalGasCats.toLocaleString('es-ES', { style:'currency', currency:'EUR' })}
            </Typography>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip formatter={(v) => v.toLocaleString('es-ES', { style:'currency', currency:'EUR' })} />
                  <Legend />
                  <Pie
                    data={dataGas}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}
                  >
                    {dataGas.map((_, i) => <Cell key={i} fill={colorsGas[i % colorsGas.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
