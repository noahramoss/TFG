import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearToken, isAuthenticated } from '../services/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    clearToken();
    navigate('/login', { replace: true });
  };

  if (!isAuthenticated() || pathname === '/login') return null; // no mostrar en /login

  return (
    <nav style={{
      display: 'flex', gap: '1rem', padding: '0.75rem 1rem',
      borderBottom: '1px solid #ddd', alignItems: 'center'
    }}>
      <Link to="/categorias">Categorías</Link>
      <Link to="/movimientos">Movimientos</Link>
      <div style={{ marginLeft: 'auto' }}>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </nav>
  );
}
