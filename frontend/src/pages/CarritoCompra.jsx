import React, { useState, useEffect } from 'react';
import { getCarrito, removeFromCarrito, clearCarrito, updateCarrito } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import SmartRecommendations from '../components/SmartRecommendations';

const CarritoCompra = () => {
  const [carrito, setCarrito] = useState({ Productos: [] });
  const { user } = useAuth();

  const fetchCarrito = async () => {
    if (user) {
      try {
        const data = await getCarrito(user.id);
        setCarrito(data || { Productos: [] });
      } catch (error) {
        console.error("Error al cargar el carrito:", error);
      }
    }
  };

  useEffect(() => {
    fetchCarrito();
  }, [user]);

  const handleRemove = async (productoId) => {
    try {
      await removeFromCarrito(user.id, productoId);
      fetchCarrito();
      toast.success("Producto eliminado");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleClear = async () => {
    if (window.confirm("¿Vaciar todo el carrito?")) {
      try {
        await clearCarrito(user.id);
        fetchCarrito();
        toast.success("Carrito vaciado");
      } catch (error) {
        toast.error("Error al vaciar");
      }
    }
  };

  const handleQuantityChange = async (productoId, quantity) => {
    if (quantity < 1) return;
    try {
      await updateCarrito(user.id, productoId, quantity);
      fetchCarrito();
    } catch (error) {
      toast.error("Error al actualizar cantidad");
    }
  };

  const getSubtotal = () => {
    if (!carrito.Productos) return 0;
    return carrito.Productos.reduce((total, item) => total + item.price * item.CarritoProducto.quantity, 0);
  };

  const subtotal = getSubtotal();
  const discount = subtotal > 100 ? subtotal * 0.1 : 0; // Ejemplo: 10% dto > $100
  const tax = subtotal * 0.21; // IVA 21%
  const shipping = subtotal > 50 ? 0 : 4.99; // Gratis > $50
  const total = subtotal - discount + tax + shipping;

  if (!user) {
    return (
      <div className="cart-page-container" style={{ textAlign: 'center', padding: '5rem' }}>
        <h2 style={{ color: 'white' }}>Por favor, inicia sesión para ver tu carrito.</h2>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <div className="catalog-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>Carrito de Compras</h2>
        <span style={{ color: '#ff4500', fontWeight: 700, cursor: 'pointer' }} onClick={() => window.history.back()}>
          ← Continuar comprando
        </span>
      </div>

      {carrito.Productos && carrito.Productos.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '8rem 2rem', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '40px', 
          border: '1px dashed rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          backdropFilter: 'blur(10px)',
          margin: '2rem 0 5rem 0'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>🛒</div>
          <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Tu carrito está actualmente vacío</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2.5rem' }}>¡Explora nuestro catálogo y encuentra tu próximo juego favorito!</p>
          <button className="checkout-btn-premium" style={{ width: 'auto', padding: '1.2rem 4rem' }} onClick={() => window.location.href='/catalogo'}>Ir al Catálogo</button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* ... existing layout ... */}
          <div className="cart-products-column">
            {/* ... products ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ color: 'white' }}>Productos ({carrito.Productos.length})</h4>
              <span className="cart-action-link" onClick={handleClear}>Vaciar carrito</span>
            </div>

            {carrito.Productos.map(item => (
              <div key={item.id} className="cart-item-premium">
                <div className="cart-item-image">
                  <img src={item.image ? `http://localhost:5000${item.image}` : 'https://via.placeholder.com/150'} alt={item.name} />
                </div>
                
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-meta">{item.Categorias?.[0]?.name || 'Videojuego'} | {item.platform || 'Multiplataforma'}</span>
                  <div className="cart-item-rating">
                    ⭐⭐⭐⭐ {item.rating || '4.5'} <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>(120 reseñas)</span>
                  </div>
                  
                  <div className="cart-quantity-controls" style={{ marginTop: '1rem', width: 'fit-content' }}>
                    <button className="qty-btn" onClick={() => handleQuantityChange(item.id, item.CarritoProducto.quantity - 1)}>-</button>
                    <span className="qty-value">{item.CarritoProducto.quantity}</span>
                    <button className="qty-btn" onClick={() => handleQuantityChange(item.id, item.CarritoProducto.quantity + 1)}>+</button>
                  </div>
                </div>

                <div className="cart-item-price-actions">
                  <div className="cart-item-price-group">
                    <div className="cart-item-price">${item.price.toFixed(2)}</div>
                    {item.oldPrice && <div className="cart-item-discount">-{Math.round((1 - item.price/item.oldPrice)*100)}% descuento</div>}
                  </div>
                  
                  <div className="cart-item-actions">
                    <span className="cart-action-link">Guardar</span>
                    <span className="cart-action-link" style={{ color: '#ff4500' }} onClick={() => handleRemove(item.id)}>Eliminar</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary-sidebar">
            <h3 className="summary-title">Resumen del pedido</h3>
            
            <div className="summary-row">
              <span>Subtotal ({carrito.Productos.length} productos)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="summary-row discount">
                <span>Descuento (AI Promo)</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>IVA (21%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row shipping">
              <span>Gastos de envío</span>
              <span>{shipping === 0 ? 'GRATIS' : `$${shipping.toFixed(2)}`}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button className="checkout-btn-premium">Proceder al pago</button>

            <div className="payment-methods">
              <span style={{ fontSize: '1.5rem' }}>💳</span>
              <span style={{ fontSize: '1.5rem' }}>🅿️</span>
              <span style={{ fontSize: '1.5rem' }}>🍎</span>
              <span style={{ fontSize: '1.5rem' }}>🛰️</span>
            </div>

            <div className="promo-code-box">
              <label className="promo-label">¿Tienes un código promocional?</label>
              <div className="promo-input-group">
                <input type="text" className="promo-input" placeholder="Introduce tu código" />
                <button className="promo-apply-btn">Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations always visible to fill space */}
      <div className="recommendations-container-full" style={{ marginTop: carrito.Productos.length === 0 ? '0' : '4rem' }}>
        <SmartRecommendations cartItems={carrito.Productos || []} />
        {carrito.Productos.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <span style={{ color: '#ff4500', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>Ver detalles de productos</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarritoCompra;
