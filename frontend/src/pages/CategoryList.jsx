// src/pages/CategoryList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('ingreso');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    axios.get('/api/categorias/')
      .then(res => setCategories(res.data))
      .catch(() => setError('Error al cargar categorías'));
  };

  const handleSubmit = e => {
    e.preventDefault();
    axios.post('/api/categorias/', { nombre, tipo })
      .then(() => {
        setNombre('');
        setTipo('ingreso');
        fetchCategories();
      })
      .catch(() => setError('Error al crear categoría'));
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta categoría?')) return;
    axios.delete(`/api/categorias/${id}/`)
     .then(() => fetchCategories())
     .catch((err) => {
       const serverMsg =
         err.response?.data?.detail ||
         err.response?.data?.non_field_errors?.[0] ||
         err.response?.data?.[0] ||
         'Error al eliminar categoría';
       setError(serverMsg);
       setTimeout(() => setError(''), 4000);
     });
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl mb-4">Categorías</h1>
      {error && <p className="text-red-600">{error}</p>}

      {/* ÚNICO listado (con botón eliminar) */}
      <ul className="mb-6" style={{ listStyle: 'none', padding: 0 }}>
        {categories.map(cat => (
          <li
            key={cat.id}
            className="p-2 border-b"
            style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
          >
            <span style={{ flex: 1 }}>
              {cat.nombre} ({cat.tipo})
            </span>
            <button type="button" onClick={() => handleDelete(cat.id)}>
              Eliminar
            </button>
          </li>
        ))}
        {categories.length === 0 && <li>No hay categorías aún.</li>}
      </ul>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded">
        <h2 className="text-xl mb-2">Nueva Categoría</h2>

        <div className="mb-2">
          <label className="mr-2">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="border p-1 rounded"
            required
          />
        </div>

        <div className="mb-2">
          <label className="mr-2">Tipo</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Crear
        </button>
      </form>
    </div>
  );
}
