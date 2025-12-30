import React, { useState, useEffect } from 'react';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CategoryForm = ({ category, onSave, onCancel }) => {
  const [name, setName] = useState(category ? category.name : '');
  const [type, setType] = useState(category ? category.type : 'General');
  const [color, setColor] = useState(category ? category.color : '#ff4500');
  const [icon, setIcon] = useState(category ? category.icon : '🏷️');
  const [description, setDescription] = useState(category ? category.description : '');

  const colors = ['#ff4500', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
  const icons = ['🏷️', '📅', '🎮', '📱', '🕹️', '📦', '⭐', '🔥', '⚙️'];

  useEffect(() => {
    setName(category ? category.name : '');
    setType(category ? category.type : 'General');
    setColor(category ? category.color : '#ff4500');
    setIcon(category ? category.icon : '🏷️');
    setDescription(category ? category.description : '');
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSave({ ...category, name, type, color, icon, description });
    if (success && !category) {
      setName('');
      setType('General');
      setColor('#ff4500');
      setIcon('🏷️');
      setDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form" style={{ background: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }}>
      <div className="form-group">
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Nombre del Tag</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Mundo Abierto"
          className="form-control"
          required
        />
      </div>
      <div className="form-group">
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Categoría</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="form-control"
        >
          <option value="General">General</option>
          <option value="Genero">Género</option>
          <option value="Plataforma">Plataforma</option>
          <option value="Clasificacion">Clasificación de edad</option>
          <option value="Serie">Serie/Familia</option>
        </select>
      </div>

      <div className="form-group">
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Color (Opcional)</label>
        <div className="color-picker">
          {colors.map(c => (
            <div 
              key={c} 
              className={`color-option ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c, color: c }}
              onClick={() => setColor(c)}
            ></div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Icono (Opcional)</label>
        <div className="icon-picker">
          {icons.map(i => (
            <div 
              key={i} 
              className={`icon-option ${icon === i ? 'active' : ''}`}
              onClick={() => setIcon(i)}
            >
              {i}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Descripción (Opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descripción del tag..."
          className="form-control"
          rows="3"
        ></textarea>
      </div>

      <div className="form-actions" style={{ marginTop: '1.5rem' }}>
        <button type="submit" className="save-btn" style={{ width: '100%' }}>
          {category ? 'Actualizar Tag' : 'Crear Tag'}
        </button>
        {category && (
          <button type="button" className="cancel-btn" onClick={onCancel} style={{ width: '100%', marginTop: '0.5rem' }}>
            Cancelar Edición
          </button>
        )}
      </div>
    </form>
  );
};

const DashboardCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const { user } = useAuth();

  const fetchCategorias = async () => {
    const data = await getCategorias();
    setCategorias(data);
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSave = async (categoryData) => {
    try {
      if (editingCategory) {
        await updateCategoria(editingCategory.id, categoryData);
        toast.success('Categoría actualizada');
      } else {
        await createCategoria(categoryData);
        toast.success('Categoría creada');
      }
      fetchCategorias();
      setEditingCategory(null);
      return true;
    } catch (e) {
      toast.error('Error al guardar la categoría');
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await deleteCategoria(id);
        fetchCategorias();
        toast.success('Categoría eliminada');
      } catch (e) {
        toast.error('Error al eliminar la categoría');
      }
    }
  };

  // Cálculos de métricas
  const totalTags = categorias.length;
  const mostUsedTag = [...categorias].sort((a,b) => (b.Productos?.length || 0) - (a.Productos?.length || 0))[0];
  const uniqueTypes = new Set(categorias.map(c => c.type)).size;

  // Pie Chart Logic (Distribución por Tipo)
  const typesCount = {};
  categorias.forEach(c => typesCount[c.type] = (typesCount[c.type] || 0) + 1);
  const sortedTypes = Object.entries(typesCount).sort((a,b) => b[1] - a[1]);
  
  let currentDegree = 0;
  const pieStyles = sortedTypes.map(([_, count], index) => {
    const degree = (count / totalTags) * 360;
    const colors = ['#ff4500', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const style = `${colors[index % colors.length]} ${currentDegree}deg ${currentDegree + degree}deg`;
    currentDegree += degree;
    return style;
  }).join(', ');

  const pieChartStyle = {
    background: totalTags > 0 ? `conic-gradient(${pieStyles})` : 'rgba(255,255,255,0.05)'
  };

  return (
    <div className="dashboard-usuarios-container">
      <div className="catalog-header" style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h2>Dashboard de Tags</h2>
      </div>

      <div className="category-dashboard-layout">
        {/* Lado Izquierdo: Métricas y Gráficos */}
        <div className="left-column">
          <div className="dashboard-metrics-container" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div className="metrics-section-box" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Total de Tags</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{totalTags}</span>
                <span style={{ color: '#ff4500' }}>🏷️</span>
              </div>
            </div>
            <div className="metrics-section-box" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Tag más usado</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>{mostUsedTag?.name || '---'}</span>
                <span style={{ color: '#ff4500' }}>📈</span>
              </div>
            </div>
            <div className="metrics-section-box" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Tipos de Tags</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{uniqueTypes}</span>
                <span style={{ color: '#ff4500' }}>📁</span>
              </div>
            </div>
          </div>

          <div className="metrics-section-box" style={{ marginBottom: '2rem' }}>
            <h4>Distribución de Tags por Categoría</h4>
            <div className="chart-container">
              <div className="pie-chart" style={pieChartStyle}></div>
            </div>
          </div>

          <div className="metrics-section-box">
            <h4>Tags más populares</h4>
            <div className="bar-chart">
              {categorias.sort((a,b) => (b.Productos?.length || 0) - (a.Productos?.length || 0)).slice(0, 5).map((c, index) => (
                <div key={c.id} className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-name">
                      <span className={`bar-dot dot-${index + 1}`} style={{ backgroundColor: c.color }}></span>
                      {c.name}
                    </span>
                    <span className="bar-value">{c.Productos?.length || 0} juegos</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ 
                      width: `${(c.Productos?.length / (mostUsedTag?.Productos?.length || 1)) * 100}%`,
                      backgroundColor: c.color 
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario y Actividad */}
        <div className="right-column">
          <div className="metrics-section-box" style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1.2rem' }}>{editingCategory ? 'Editar Tag' : 'Crear Nuevo Tag'}</h4>
            <CategoryForm 
              key={editingCategory?.id || 'new'}
              category={editingCategory} 
              onSave={handleSave} 
              onCancel={() => setEditingCategory(null)} 
            />
          </div>

          <div className="metrics-section-box">
            <h4>Actividad Reciente</h4>
            <div className="activity-list">
              {[...categorias].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(c => (
                <div key={c.id} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <span className="activity-time">Hoy, {new Date(c.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="activity-text">Se gestionó el tag <b>{c.name}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ borderBottom: '2px solid #ff4500', paddingBottom: '0.5rem', color: 'white', marginBottom: '1.5rem' }}>Listado Detallado</h3>
        <div className="product-table-container">
          <table className="product-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NOMBRE</th>
                <th>TIPO</th>
                <th>PRODUCTOS</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map(c => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td style={{ fontWeight: '600' }}>
                    <span className="tag-badge" style={{ backgroundColor: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>
                      {c.icon} {c.name}
                    </span>
                  </td>
                  <td>{c.type || 'General'}</td>
                  <td>{c.Productos ? c.Productos.length : 0}</td>
                  <td className="product-actions">
                    <button className="edit-btn" onClick={() => setEditingCategory(c)}>Editar</button>
                    <button className="delete-btn" onClick={() => handleDelete(c.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardCategorias;
