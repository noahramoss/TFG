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

  // Edición inline
  const [editId, setEditId] = useState(null);
  const [editCategoria, setEditCategoria] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editCantidad, setEditCantidad] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-ocultar mensajes de error a los 4s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

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

  const handleCreate = e => {
    e.preventDefault();
    axios.post('/api/movimientos/', {
      categoria: categoria ? Number(categoria) : null,
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

  const startEdit = (mov) => {
    setEditId(mov.id);
    setEditCategoria(String(mov.categoria ?? ''));
    setEditFecha(mov.fecha);
    setEditCantidad(String(mov.cantidad));
    setEditDescripcion(mov.descripcion || '');
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditCategoria('');
    setEditFecha('');
    setEditCantidad('');
    setEditDescripcion('');
  };

  const saveEdit = (id) => {
    axios.patch(`/api/movimientos/${id}/`, {
      categoria: editCategoria ? Number(editCategoria) : null,
      fecha: editFecha,
      cantidad: editCantidad,
      descripcion: editDescripcion
    })
      .then(() => {
        cancelEdit();
        fetchData();
      })
      .catch(() => setError('Error al editar movimiento'));
  };

  // Filtrar por categoría (cliente)
  const visibles = movements.filter(m =>
    !filtroCategoria || m.categoria === Number(filtroCategoria)
  );

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl mb-4">Movimientos</h1>
      {error && <p className="text-red-600 mb-2" role="alert">{error}</p>}

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
              {editId === mov.id ? (
                <>
                  <select
                    value={editCategoria}
                    onChange={e => setEditCategoria(e.target.value)}
                    className="border p-1 rounded"
                    required
                  >
                    <option value="">— Categoría —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.tipo})
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={editFecha}
                    onChange={e => setEditFecha(e.target.value)}
                    className="border p-1 rounded"
                    required
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={editCantidad}
                    onChange={e => setEditCantidad(e.target.value)}
                    className="border p-1 rounded"
                    required
                  />

                  <input
                    type="text"
                    value={editDescripcion}
                    onChange={e => setEditDescripcion(e.target.value)}
                    className="border p-1 rounded"
                    placeholder="Descripción"
                    style={{ flex: 1 }}
                  />

                  <button type="button" onClick={() => saveEdit(mov.id)}>Guardar</button>
                  <button type="button" onClick={cancelEdit}>Cancelar</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>
                    <span className="font-semibold">{mov.fecha}</span>:{' '}
                    {mov.descripcion || <em>Sin descripción</em>} —{' '}
                    <strong>{sign}{amount} €</strong> (
                    {cat?.nombre || '—'}
                    )
                  </span>
                  <button type="button" onClick={() => startEdit(mov)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(mov.id)}>Eliminar</button>
                </>
              )}
            </li>
          );
        })}
        {visibles.length === 0 && <li>No hay movimientos para mostrar.</li>}
      </ul>

      {/* Formulario de creación */}
      <form onSubmit={handleCreate} className="mb-4 p-4 border rounded">
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

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Añadir
        </button>
      </form>
    </div>
  );
}
