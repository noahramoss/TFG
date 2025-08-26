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
const eur = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export default function Dashboard() {
  const hoy = new Date();
  const inicioAnio = `${hoy.getFullYear()}-01-01`;
  const finAnio    = `${hoy.getFullYear()}-12-31`;

  const [desde, setDesde] = useState(inicioAnio);
  const [hasta, setHasta] = useState(finAnio);

  const [seriesMensual, setSeriesMensual] = useState([]);   // [{month:'YYYY-MM', ingresos, gastos, balance}]
  const [catsResumen, setCatsResumen]     = useState([]);    // [{categoria__nombre, categoria__tipo, total}]
  const [error, setError] = useState('');

  // ===== Responsive helper para los pies =====
  const [isSmall, setIsSmall] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 900 : true
  );
  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const pieHeight   = isSmall ? 360 : 480;       // altura del contenedor del pie
  const pieRadius   = isSmall ? 140 : 200;       // radio del pie
  const pieLegend   = isSmall
    ? { layout: 'horizontal', verticalAlign: 'bottom', align: 'center' }
    : { layout: 'vertical',   verticalAlign: 'middle', align: 'right'   };

  const cargar = useCallback(() => {
    const params = {};
    if (desde) params.date_from = desde;
    if (hasta) params.date_to   = hasta;

    Promise.all([
      axios.get('/api/movimientos/resumen-mensual/', { params }),
      axios.get('/api/movimientos/resumen/',        { params }),
    ]).then(([m, r]) => {
      setSeriesMensual(m.data?.series || []);
      setCatsResumen(r.data?.por_categoria || []);
    }).catch(() => setError('Error al cargar datos del dashboard'));
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

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

  // ====== Gráfico de barras: datos y formato español en eje X ======
  const fmtMonthES = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' });
  const barData = seriesMensual.map((row) => {
    const [y, m] = row.month.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return { ...row, monthLabel: fmtMonthES.format(d) };
  });

  // ====== Quesitos por categoría ======
  const dataIng = catsResumen
    .filter(c => c['categoria__tipo'] === 'ingreso')
    .map(c => ({ name: c['categoria__nombre'], value: Number(c.total) }));

  const dataGas = catsResumen
    .filter(c => c['categoria__tipo'] === 'gasto')
    .map(c => ({ name: c['categoria__nombre'], value: Number(c.total) }));

  const sum = arr => arr.reduce((a, x) => a + x.value, 0);
  const totalIngCats = sum(dataIng);
  const totalGasCats = sum(dataGas);

  // Colores (reutilizados por barras y leyenda)
  const colorIng = '#2e7d32';
  const colorGas = '#c62828';

  // Paletas contrastadas para los quesitos
  const colorsIng = ['#2E7D32','#43A047','#1B5E20','#66BB6A','#81C784','#00A152','#009688','#4CAF50','#7CB342','#9CCC65','#26A69A'];
  const colorsGas = ['#C62828','#E53935','#B71C1C','#EF5350','#8E24AA','#D81B60','#F06292','#AD1457','#F44336','#E57373','#BA68C8'];

  // Leyenda personalizada (Ingresos — Gastos) para el BarChart
  const LegendInline = () => (
    <div style={{ display:'flex', gap:16, justifyContent:'center', alignItems:'center' }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
        <span style={{ width:12, height:12, background:colorIng, display:'inline-block' }} />
        Ingresos
      </span>
      <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
        <span style={{ width:12, height:12, background:colorGas, display:'inline-block' }} />
        Gastos
      </span>
    </div>
  );

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
            <Typography variant="h6" color="success.main">+{eur(totalIngresos)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Gastos (periodo)</Typography>
            <Typography variant="h6" color="error.main">-{eur(totalGastos)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Balance (periodo)</Typography>
            <Typography variant="h6" color={balance >= 0 ? 'success.main' : 'error.main'}>{eur(balance)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Barras lado a lado con leyenda Ingresos — Gastos (ancho completo) */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Ingresos vs Gastos por mes</Typography>
        <div style={{ width: '100%', height: 380 }}>
          <ResponsiveContainer>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              barCategoryGap="20%"
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis />
              <Tooltip formatter={(val, name) => [eur(Number(val)), name]} />
              <Legend content={<LegendInline />} />
              <Bar dataKey="ingresos" name="Ingresos" fill={colorIng} />
              <Bar dataKey="gastos"   name="Gastos"   fill={colorGas} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Paper>

      {/* Pie Ingresos — ANCHO COMPLETO y circular (no donut) */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Ingresos por categoría</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Total: {eur(totalIngCats)}
        </Typography>
        <div style={{ width: '100%', height: pieHeight }}>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={(v) => eur(Number(v))} />
              <Legend {...pieLegend} />
              <Pie
                data={dataIng}
                dataKey="value"
                nameKey="name"
                cx={isSmall ? '50%' : '45%'}   // deja espacio a la leyenda a la derecha en desktop
                cy="50%"
                outerRadius={pieRadius}
                label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}
                labelLine
              >
                {dataIng.map((_, i) => <Cell key={i} fill={colorsIng[i % colorsIng.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Paper>

      {/* Pie Gastos — ANCHO COMPLETO y circular */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Gastos por categoría</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Total: {eur(totalGasCats)}
        </Typography>
        <div style={{ width: '100%', height: pieHeight }}>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={(v) => eur(Number(v))} />
              <Legend {...pieLegend} />
              <Pie
                data={dataGas}
                dataKey="value"
                nameKey="name"
                cx={isSmall ? '50%' : '45%'}
                cy="50%"
                outerRadius={pieRadius}
                label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}
                labelLine
              >
                {dataGas.map((_, i) => <Cell key={i} fill={colorsGas[i % colorsGas.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Paper>
    </Container>
  );
}
