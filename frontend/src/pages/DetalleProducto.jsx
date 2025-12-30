import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductoById, addToCarrito } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import defaultProductImage from '../assets/default-product.jpg';

const DetalleProducto = () => {
  const [producto, setProducto] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedEdition, setSelectedEdition] = useState("Estándar");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const { id } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const data = await getProductoById(id);
        setProducto(data);
        if (data && data.edition) setSelectedEdition(data.edition);
      } catch (error) {
        console.error("Error al cargar el producto:", error);
      }
    };
    fetchProducto();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.warn("Por favor, inicia sesión para añadir productos al carrito.");
      return;
    }
    try {
      await addToCarrito(user.id, producto.id, quantity);
      toast.success("¡Producto añadido al carrito!");
    } catch (error) {
      toast.error("Error al añadir producto al carrito");
    }
  };

  if (!producto) return <div className="loading-state">Cargando la mejor experiencia...</div>;

  const productImages = producto.imagenes?.length > 0 
    ? producto.imagenes.sort((a, b) => a.orden - b.orden).map(img => img.url)
    : producto.image ? [producto.image] : [];

  const parseOrObj = (val) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch (e) { return null; }
  };

  const minReq = parseOrObj(producto.minRequirements);
  const recReq = parseOrObj(producto.recRequirements);
  const techSpecs = parseOrObj(producto.techSpecs);

  return (
    <div className="product-detail-layout">
      {/* Columna Izquierda: Galería, Descripción, Specs */}
      <div className="detail-main-col">
        
        <div className="modern-gallery">
          <div className="gallery-main-frame">
            {productImages.length > 0 ? (
              <img src={`http://localhost:5000${productImages[currentImageIndex]}`} alt={producto.name} />
            ) : (
              <img src={defaultProductImage} alt="No image" />
            )}
          </div>
          {productImages.length > 1 && (
            <div className="gallery-thumbs">
              {productImages.map((img, i) => (
                <div 
                  key={i} 
                  className={`thumb-item ${i === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(i)}
                >
                  <img src={`http://localhost:5000${img}`} alt="thumb" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">Descripción</h3>
          <div className="modern-description">
            {producto.description || "Sin descripción disponible para este producto."}
          </div>
        </div>

        {(minReq || recReq) && (
          <div className="detail-section">
            <h3 className="detail-section-title">Especificaciones de PC</h3>
            <div className="requirements-container">
              {minReq && (
                <div className="req-box">
                  <h5>Requisitos Mínimos</h5>
                  <div className="req-list">
                    {Object.entries(minReq).map(([key, val]) => val && (
                      <div key={key} className="req-item">
                        <span className="req-label">{key.toUpperCase()}</span>
                        <span className="req-value">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recReq && (
                <div className="req-box">
                  <h5>Requisitos Recomendados</h5>
                  <div className="req-list">
                    {Object.entries(recReq).map(([key, val]) => val && (
                      <div key={key} className="req-item">
                        <span className="req-label">{key.toUpperCase()}</span>
                        <span className="req-value">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {techSpecs && (
          <div className="detail-section">
            <h3 className="detail-section-title">Ficha Técnica</h3>
            <div className="info-grid-modern">
               {Object.entries(techSpecs).map(([key, val]) => val && (
                 <div key={key} className="info-item-box">
                   <span className="info-item-label">{key}</span>
                   <span className="info-item-value">{val}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h3 className="detail-section-title">Información Adicional</h3>
          <div className="info-grid-modern">
            <div className="info-item-box">
              <span className="info-item-label">Desarrollador</span>
              <span className="info-item-value">{producto.developer || 'No especificado'}</span>
            </div>
            <div className="info-item-box">
              <span className="info-item-label">Editor</span>
              <span className="info-item-value">{producto.publisher || 'N/A'}</span>
            </div>
            <div className="info-item-box">
              <span className="info-item-label">Fecha Lanzamiento</span>
              <span className="info-item-value">{producto.releaseDate || 'Próximamente'}</span>
            </div>
            <div className="info-item-box">
              <span className="info-item-label">Idiomas</span>
              <span className="info-item-value">{producto.languages || 'Español, Inglés'}</span>
            </div>
            <div className="info-item-box">
              <span className="info-item-label">Multijugador</span>
              <span className="info-item-value">{producto.multiplayer || 'Solo un jugador'}</span>
            </div>
            <div className="info-item-box">
              <span className="info-item-label">Clasificación</span>
              <span className="info-item-value">{producto.classification || 'PEGI 12'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Buy Box */}
      <div className="detail-sidebar">
        <h1 className="sidebar-product-name">{producto.name}</h1>
        <span className="sidebar-meta">
          {producto.Categorias?.map(c => c.name).join(' • ') || 'General'}
        </span>

        <div className="sidebar-price-row">
          <span className="current-price-lg">${producto.price}</span>
          <span className="stock-badge">
            {producto.stock > 0 ? `En Stock (${producto.stock})` : 'Agotado'}
          </span>
        </div>

        <div className="picker-section">
          <span className="picker-label">Seleccionar Edición</span>
          <div className="picker-grid">
            <div 
              className={`picker-option ${selectedEdition === producto.edition ? 'active' : ''}`}
              onClick={() => setSelectedEdition(producto.edition)}
            >
              <div className="opt-info">
                <span className="opt-name">{producto.edition}</span>
                <span className="opt-sub">Incluye juego base</span>
              </div>
              <span className="opt-price">${producto.price}</span>
            </div>
          </div>
        </div>

        <div className="picker-section">
          <span className="picker-label">Plataforma</span>
          <div className="platform-chips">
            {['PC', 'PS5', 'Xbox'].map(plat => (
              <button 
                key={plat}
                className={`platform-chip-btn ${selectedPlatform === plat ? 'active' : ''}`}
                onClick={() => setSelectedPlatform(plat)}
              >
                {plat}
              </button>
            ))}
          </div>
        </div>

        <div className="qty-selector-modern">
           <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
           <span className="qty-value">{quantity}</span>
           <button className="qty-btn" onClick={() => setQuantity(Math.min(producto.stock, quantity + 1))}>+</button>
        </div>

        <button 
          className="checkout-btn-premium" 
          onClick={handleAddToCart}
          disabled={producto.stock <= 0}
        >
          {producto.stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
        </button>

        <div className="summary-divider" style={{ margin: '1rem 0' }}></div>
        
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          🔒 Pago 100% seguro y descarga instantánea
        </p>
      </div>
    </div>
  );
};

export default DetalleProducto;
