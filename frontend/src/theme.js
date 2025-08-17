// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#10b981' },
    error: { main: '#ef4444' },
    background: { default: '#f7f7f8' },
  },
  shape: { borderRadius: 12 },
});

export default theme;
