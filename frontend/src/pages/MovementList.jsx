// src/pages/MovementList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MovementList() {
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);

  // Formulario de creación
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Filtro
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get('/api/categorias/')
      .then(res => setCategories(res.data))
      .catch(() => setError('Error al cargar categorías'));

    axios.get('/api/movimientos/')
      .then(res => setMovements(res.data))
      .catch(() => setError('Error al cargar movimientos'));
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este movimiento?')) return;
    axios.delete(`/api/movimientos/${id}/`)
      .then(() => fetchData())
      .catch(() => setError('Error al eliminar movimiento'));
  };

  const handleSubmit = e => {
    e.preventDefault();
    axios.post('/api/movimientos/', {
      categoria,           // puede ir como string; DRF lo castea a int
      fecha,
      cantidad,
      descripcion
    })
      .then(() => {
        setCategoria('');
        setFecha('');
        setCantidad('');
        setDescripcion('');
        fetchData();
      })
      .catch(() => setError('Error al crear movimiento'));
  };

  // Filtrar movimientos por categoría seleccionada (si hay filtro)
  const visibles = movements.filter(m =>
    !filtroCategoria || m.categoria === Number(filtroCategoria)
  );

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl mb-4">Movimientos</h1>
      {error && <p className="text-red-600">{error}</p>}

      {/* Filtro por categoría */}
      <div className="mb-4 p-3 border rounded">
        <label className="mr-2">Filtrar por categoría</label>
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">Todas</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre} ({c.tipo})
            </option>
          ))}
        </select>
        {filtroCategoria && (
          <button
            type="button"
            className="ml-3 px-2 py-1 border rounded"
            onClick={() => setFiltroCategoria('')}
          >
            Quitar filtro
          </button>
        )}
      </div>

      {/* Listado */}
      <ul className="mb-6">
        {visibles.map(mov => {
          const cat = categories.find(c => c.id === mov.categoria);
          const sign = cat?.tipo === 'gasto' ? '-' : '+';
          const amountNum = Number(mov.cantidad);
          const amount = Number.isNaN(amountNum) ? mov.cantidad : amountNum.toFixed(2);

          return (
            <li
              key={mov.id}
              className="p-2 border-b"
              style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
            >
              <span style={{ flex: 1 }}>
                <span className="font-semibold">{mov.fecha}</span>: {' '}
                {mov.descripcion || <em>Sin descripción</em>} —{' '}
                <strong>{sign}{amount} €</strong> (
                {cat?.nombre || '—'}
                )
              </span>
              <button type="button" onClick={() => handleDelete(mov.id)}>
                Eliminar
              </button>
            </li>
          );
        })}
        {visibles.length === 0 && <li>No hay movimientos para mostrar.</li>}
      </ul>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded">
        <h2 className="text-xl mb-2">Nuevo Movimiento</h2>

        <div className="mb-2">
          <label className="mr-2">Categoría</label>
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            className="border p-1 rounded"
            required
          >
            <option value="">— Selecciona —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="mr-2">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="border p-1 rounded"
            required
          />
        </div>

        <div className="mb-2">
          <label className="mr-2">Cantidad</label>
          <input
            type="number"
            step="0.01"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            className="border p-1 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="mr-2">Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="border p-1 rounded w-full"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Añadir
        </button>
      </form>
    </div>
  );
}
