import React, { useState, useEffect } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto, getCategorias } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import defaultProductImage from '../assets/default-product.jpg';

const ProductForm = ({ product, onSave, onCancel }) => {
  const initialForm = {
    name: '', price: '', description: '', stock: '', 
    developer: '', publisher: '', releaseDate: '', languages: '',
    multiplayer: '', classification: '', edition: 'Edición Estándar',
    minRequirements: { cpu: '', ram: '', storage: '', gpu: '', so: '' },
    recRequirements: { cpu: '', ram: '', storage: '', gpu: '', so: '' },
    techSpecs: { weight: '', dimensions: '', color: '', connectivity: '', battery: '' }
  };

  const [formData, setFormData] = useState(product ? {
    ...initialForm,
    ...product,
    minRequirements: product.minRequirements || initialForm.minRequirements,
    recRequirements: product.recRequirements || initialForm.recRequirements,
    techSpecs: product.techSpecs || initialForm.techSpecs
  } : initialForm);

  const [imageFiles, setImageFiles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategorias, setSelectedCategorias] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      const data = await getCategorias();
      setCategorias(data);
      if (product) {
        const ids = product.Categorias?.map(c => c.id.toString()) || 
                    (product.CategoriaId ? [product.CategoriaId.toString()] : []);
        setSelectedCategorias(ids);
      }
    };
    fetchCategorias();
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const previews = files.map(file => {
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(previews).then(setPreviewImages);
  };

  const handleCategoriaToggle = (id) => {
    setSelectedCategorias(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const productType = (() => {
    const selectedObj = categorias.filter(c => selectedCategorias.includes(c.id.toString()));
    if (selectedObj.some(c => c.name.toLowerCase().includes('videojuego') || c.name.toLowerCase().includes('juego') || c.name.toLowerCase().includes('pc'))) return 'GAME';
    if (selectedObj.some(c => c.name.toLowerCase().includes('consola') || c.name.toLowerCase().includes('hardware') || c.name.toLowerCase().includes('accesorio'))) return 'HARDWARE';
    return 'GENERAL';
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      ...formData, 
      categoriaIds: selectedCategorias,
      minRequirements: JSON.stringify(formData.minRequirements),
      recRequirements: JSON.stringify(formData.recRequirements),
      techSpecs: JSON.stringify(formData.techSpecs)
    }, imageFiles);
  };

  return (
    <form onSubmit={handleSubmit} className="product-form-modern">
      <div className="form-section">
        <h4>Información Básica</h4>
        <div className="form-row">
          <div className="form-group flex-2">
            <label>Nombre del Producto</label>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Elden Ring" required />
          </div>
          <div className="form-group flex-1">
            <label>Precio ($)</label>
            <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} placeholder="59.99" required />
          </div>
          <div className="form-group flex-1">
            <label>Stock</label>
            <input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="10" required />
          </div>
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Describe el producto..."></textarea>
        </div>
      </div>

      <div className="form-section">
        <h4>Media y Categorías</h4>
        <div className="form-row">
          <div className="form-group flex-1">
            <label>Imágenes {product ? '(Reemplazará actuales)' : ''}</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} />
            <div className="previews-inline">
              {previewImages.map((src, i) => <img key={i} src={src} alt="preview" className="mini-thumb" />)}
            </div>
          </div>
          <div className="form-group flex-1">
            <label>Seleccionar Tags/Categorías</label>
            <div className="tags-picker-dashboard">
              {categorias.map(c => (
                <span 
                  key={c.id} 
                  className={`tag-chip ${selectedCategorias.includes(c.id.toString()) ? 'active' : ''}`}
                  onClick={() => handleCategoriaToggle(c.id.toString())}
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Detalles de Publicación</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Desarrollador</label>
            <input name="developer" value={formData.developer} onChange={handleChange} placeholder="Ej: FromSoftware" />
          </div>
          <div className="form-group">
            <label>Editor (Publisher)</label>
            <input name="publisher" value={formData.publisher} onChange={handleChange} placeholder="Bandai Namco" />
          </div>
          <div className="form-group">
            <label>Lanzamiento</label>
            <input name="releaseDate" type="date" value={formData.releaseDate} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Idiomas</label>
            <input name="languages" value={formData.languages} onChange={handleChange} placeholder="Español, Inglés..." />
          </div>
          <div className="form-group">
            <label>Multijugador</label>
            <input name="multiplayer" value={formData.multiplayer} onChange={handleChange} placeholder="Online (2-4), No" />
          </div>
          <div className="form-group">
            <label>Clasificación</label>
            <input name="classification" value={formData.classification} onChange={handleChange} placeholder="PEGI 16 / ESRB T" />
          </div>
          <div className="form-group">
            <label>Edición</label>
            <input name="edition" value={formData.edition} onChange={handleChange} placeholder="Estándar / Deluxe" />
          </div>
        </div>
      </div>

      {productType === 'GAME' && (
        <div className="form-section special-section">
          <h4>Requisitos del Sistema (PC / Juegos)</h4>
          <div className="req-grid-form">
            <div className="req-col">
              <h5>Mínimos</h5>
              <input name="minRequirements.cpu" value={formData.minRequirements.cpu} onChange={handleChange} placeholder="Procesador" />
              <input name="minRequirements.ram" value={formData.minRequirements.ram} onChange={handleChange} placeholder="RAM" />
              <input name="minRequirements.gpu" value={formData.minRequirements.gpu} onChange={handleChange} placeholder="GPU" />
              <input name="minRequirements.storage" value={formData.minRequirements.storage} onChange={handleChange} placeholder="Almacenamiento" />
              <input name="minRequirements.so" value={formData.minRequirements.so} onChange={handleChange} placeholder="SO" />
            </div>
            <div className="req-col">
              <h5>Recomendados</h5>
              <input name="recRequirements.cpu" value={formData.recRequirements.cpu} onChange={handleChange} placeholder="Procesador" />
              <input name="recRequirements.ram" value={formData.recRequirements.ram} onChange={handleChange} placeholder="RAM" />
              <input name="recRequirements.gpu" value={formData.recRequirements.gpu} onChange={handleChange} placeholder="GPU" />
              <input name="recRequirements.storage" value={formData.recRequirements.storage} onChange={handleChange} placeholder="Almacenamiento" />
              <input name="recRequirements.so" value={formData.recRequirements.so} onChange={handleChange} placeholder="SO" />
            </div>
          </div>
        </div>
      )}

      {productType === 'HARDWARE' && (
        <div className="form-section special-section">
          <h4>Especificaciones Técnicas (Consolas / Hardware)</h4>
          <div className="form-row">
            <input name="techSpecs.weight" value={formData.techSpecs.weight} onChange={handleChange} placeholder="Peso (ej: 4.5kg)" />
            <input name="techSpecs.dimensions" value={formData.techSpecs.dimensions} onChange={handleChange} placeholder="Dimensiones" />
            <input name="techSpecs.color" value={formData.techSpecs.color} onChange={handleChange} placeholder="Color" />
            <input name="techSpecs.connectivity" value={formData.techSpecs.connectivity} onChange={handleChange} placeholder="Conectividad" />
          </div>
        </div>
      )}

      <div className="form-actions-modern">
        <button type="submit" className="confirm-btn">Guardar Producto</button>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
};


const DashboardProductos = () => {
  const [productos, setProductos] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const fetchProductos = async () => {
    const data = await getProductos();
    setProductos(data);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteProducto(id);
        fetchProductos();
        toast.success('Producto eliminado');
      } catch (error) {
        toast.error('Error al eliminar el producto');
      }
    }
  };

  const handleSave = async (productData, imageFiles) => {
    console.log('=== handleSave called ===');
    console.log('productData:', productData);
    console.log('imageFiles:', imageFiles);
    console.log('user.id:', user.id);

    const formData = new FormData();

    // Agregar campos básicos (excepto categoriaIds)
    Object.keys(productData).forEach(key => {
      if (key !== 'categoriaIds') {
        console.log(`Appending ${key}:`, productData[key]);
        formData.append(key, productData[key]);
      }
    });

    // Agregar categoriaIds como string separado por comas
    if (productData.categoriaIds && Array.isArray(productData.categoriaIds)) {
      const idsString = productData.categoriaIds.join(',');
      console.log('Appending categoriaIds as:', idsString);
      formData.append('categoriaIds', idsString);
    }

    // Agregar múltiples archivos de imagen
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file, index) => {
        console.log(`Appending image file ${index}:`, file.name, file.type, file.size);
        formData.append('images', file);
      });
    }

    // Log FormData contents
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      if (editingProduct) {
        console.log('Updating product with ID:', editingProduct.id);
        await updateProducto(editingProduct.id, formData);
        toast.success('Producto actualizado');
      } else {
        console.log('Creating new product');
        await createProducto(formData);
        toast.success('Producto creado');
      }
      fetchProductos();
      setEditingProduct(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast.error('Error al guardar el producto');
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setIsCreating(false);
  }

  // Cálculos de métricas
  const totalStock = productos.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const outOfStock = productos.filter(p => p.stock <= 0).length;

  // Distribución por categorías
  const categoryCounts = {};
  productos.forEach(p => {
    const cats = p.Categorias && p.Categorias.length > 0 
      ? p.Categorias 
      : (p.Categoria ? [p.Categoria] : []);
    
    cats.forEach(c => {
      categoryCounts[c.name] = (categoryCounts[c.name] || 0) + 1;
    });
  });

  const sortedCategories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ 
      name, 
      count, 
      percentage: productos.length > 0 ? Math.round((count / productos.length) * 100) : 0 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  // Pie Chart Logic (conic-gradient)
  const outOfStockPercent = productos.length > 0 ? (outOfStock / productos.length) * 360 : 0;
  const pieStyle = {
    background: `conic-gradient(
      #ff4500 ${360 - outOfStockPercent}deg, 
      #3a3a5e ${360 - outOfStockPercent}deg
    )`
  };

  return (
    <div className="dashboard-productos-container">
      <div className="catalog-header" style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h2>Dashboard de Productos</h2>
      </div>

      <div className="dashboard-metrics-container">
        {/* Resumen de Stock */}
        <div className="metrics-section-box">
          <h4>
            Resumen de Stock
            <span style={{ color: '#ff4500', fontSize: '1.2rem' }}>📦</span>
          </h4>
          <div className="chart-container">
            <div className="pie-chart" style={pieStyle}></div>
          </div>
          <div className="metrics-grid">
            <div className="metric-card-modern">
                <span className="label">En stock</span>
                <span className="value">{totalStock}</span>
                <span className="change positive">Total unidades</span>
            </div>
            <div className="metric-card-modern">
                <span className="label">Agotados</span>
                <span className="value" style={{ color: outOfStock > 0 ? '#ff6b6b' : 'inherit' }}>{outOfStock}</span>
                <span className="change" style={{ color: outOfStock > 0 ? '#ff6b6b' : '#4caf50' }}>
                  {outOfStock > 0 ? `⚠️ Necesita reponer` : '✅ Todo al día'}
                </span>
            </div>
          </div>
        </div>

        {/* Categorías Populares */}
        <div className="metrics-section-box">
          <h4>
            Popularidad por Categoría
            <span style={{ color: '#ff4500', fontSize: '1.2rem' }}>🏷️</span>
          </h4>
          <div className="bar-chart">
            {sortedCategories.map((cat, index) => (
              <div key={cat.name} className="bar-row">
                <div className="bar-label-group">
                  <span className="bar-name">
                    <span className={`bar-dot dot-${index + 1}`}></span>
                    {cat.name}
                  </span>
                  <span className="bar-value">{cat.percentage}%</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${cat.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {sortedCategories.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>No hay datos suficientes</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ borderBottom: '2px solid #ff4500', paddingBottom: '0.5rem', color: 'white' }}>Listado de Productos</h3>

        {(isCreating || editingProduct) ? (
          <ProductForm product={editingProduct} onSave={handleSave} onCancel={handleCancel} />
        ) : (
          <button className="save-btn" onClick={() => setIsCreating(true)}>+ Crear Nuevo Producto</button>
        )}
      </div>

      <div className="product-table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>IMAGEN</th>
              <th>NOMBRE</th>
              <th>PRECIO</th>
              <th>STOCK</th>
              <th>CATEGORÍA</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id}>
                <td className="product-image">
                  {p.image && <img src={`http://localhost:5000${p.image}`} alt={p.name} />}
                  {!p.image && <img src={defaultProductImage} alt={p.name} />}
                </td>
                <td>{p.name}</td>
                <td style={{ fontWeight: '700' }}>${p.price}</td>
                <td style={{ 
                  color: p.stock <= 5 ? '#ff4500' : 'inherit',
                  fontWeight: p.stock <= 5 ? '800' : 'inherit'
                }}>
                  {p.stock}
                  {p.stock <= 0 && <span style={{ fontSize: '0.7rem', display: 'block', color: '#ff6b6b' }}>AGOTADO</span>}
                </td>
                <td>
                  {p.Categorias && p.Categorias.length > 0
                    ? p.Categorias.map(c => c.name).join(', ')
                    : (p.Categoria ? p.Categoria.name : 'Sin categoría')
                  }
                </td>
                <td className="product-actions">
                  <button className="edit-btn" onClick={() => setEditingProduct(p)}>Editar</button>
                  <button className="delete-btn" onClick={() => handleDelete(p.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardProductos;
