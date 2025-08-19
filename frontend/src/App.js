import React from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import CategoryList from './pages/CategoryList';
import MovementList from './pages/MovementList';
import Navbar from './components/Navbar';


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* Rutas protegidas */}
        <Route
          path="/categorias"
          element={
            <ProtectedRoute>
              <CategoryList /> 
            </ProtectedRoute>
          }
        />
        <Route
          path="/movimientos"
          element={
            <ProtectedRoute>
              <MovementList />  
            </ProtectedRoute>
          }
        />

        {/* Redirigir cualquier otra ruta a login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
