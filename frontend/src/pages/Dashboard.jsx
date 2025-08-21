// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Container, Paper, Typography, Stack, TextField, Button, Alert, Grid
} from '@mui/material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
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
  const [data, setData] = useState([]); // [{month, ingresos, gastos, balance}]
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    const params = {};
    if (desde) params.date_from = desde;
    if (hasta) params.date_to = hasta;

    axios.get('/api/movimientos/resumen-mensual/', { params })
      .then(res => setData(res.data?.series || []))
      .catch(() => setError('Error al cargar resumen mensual'));
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const totalIngresos = data.reduce((a, m) => a + (m.ingresos || 0), 0);
  const totalGastos   = data.reduce((a, m) => a + (m.gastos   || 0), 0);
  const balance       = totalIngresos - totalGastos;

  // atajos de rango
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

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard</Typography>
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
          <Button variant="contained" onClick={cargar}>Cargar</Button>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={setEsteMes}>Este mes</Button>
            <Button variant="outlined" onClick={setMesAnterior}>Mes anterior</Button>
            <Button variant="outlined" onClick={setYTD}>YTD</Button>
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
              {(-totalGastos).toLocaleString('es-ES', { style:'currency', currency:'EUR' }).replace('-', '')}
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
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Ingresos vs Gastos por mes</Typography>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ingresos" stackId="a" name="Ingresos" />
              <Bar dataKey="gastos" stackId="a" name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Paper>
    </Container>
  );
}
