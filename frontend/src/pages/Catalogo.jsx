import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProductos, addToCarrito } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import defaultProductImage from '../assets/default-product.jpg';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';

const Catalogo = () => {
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categories: [],
    platforms: [],
    minPrice: '',
    maxPrice: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await getProductos();
        setProductos(data);
        setFilteredProductos(data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    let result = productos;

    // Filter by search term
    if (searchTerm.trim() !== '') {
      result = result.filter(producto =>
        producto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.description && producto.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      result = result.filter(producto => {
        const pCats = producto.Categorias || (producto.Categoria ? [producto.Categoria] : []);
        return pCats.some(cat => filters.categories.includes(cat.id.toString()));
      });
    }

    // Filter by platforms
    if (filters.platforms.length > 0) {
      result = result.filter(producto => {
        const pCats = producto.Categorias || (producto.Categoria ? [producto.Categoria] : []);
        return pCats.some(cat => filters.platforms.includes(cat.id.toString()));
      });
    }

    // Filter by price
    if (filters.minPrice !== '') {
      result = result.filter(p => p.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice !== '') {
      result = result.filter(p => p.price <= parseFloat(filters.maxPrice));
    }

    setFilteredProductos(result);
  }, [searchTerm, filters, productos]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Función para obtener la imagen de portada
  const getCoverImage = (producto) => {
    if (producto.imagenes && producto.imagenes.length > 0) {
      // Buscar la imagen principal o usar la primera
      const principalImage = producto.imagenes.find(img => img.esPrincipal);
      return principalImage ? principalImage.url : producto.imagenes[0].url;
    }
    return producto.image || null;
  };

  const handleAddToCart = async (productoId) => {
    if (!user) {
      toast.warn("Por favor, inicia sesión para añadir productos al carrito.");
      return;
    }
    try {
      await addToCarrito(user.id, productoId, 1);
      toast.success("Producto añadido al carrito");
    } catch {
      toast.error("Error al añadir producto al carrito");
    }
  };

  return (
    <div className="catalogo-page-container">
      <div className="catalog-header">
        <h2>Catálogo de Productos</h2>
        <div className="catalog-search">
          <SearchBar onSearch={handleSearch} placeholder="Buscar productos..." />
        </div>
      </div>
      
      <div className="catalog-layout">
        <FilterSidebar onFilterChange={handleFilterChange} currentFilters={filters} />
        
        <div className="catalog-content">
          {searchTerm && (
            <div className="search-results-info">
              {filteredProductos.length > 0 
                ? `Se encontraron ${filteredProductos.length} producto(s) para "${searchTerm}"`
                : `No se encontraron productos para "${searchTerm}"`
              }
            </div>
          )}
          
          <div className="product-list">
            {filteredProductos.map(p => {
              const coverImage = getCoverImage(p);
              return (
                <div key={p.id} className="product-card">
                  <Link to={`/producto/${p.id}`}>
                    <img 
                      src={coverImage ? `http://localhost:5000${coverImage}` : defaultProductImage} 
                      alt={p.name} 
                    />
                    <h3>{p.name}</h3>
                  </Link>
                  <p className="product-category">
                    {p.Categorias && p.Categorias.length > 0 
                      ? p.Categorias.map(c => c.name).join(', ') 
                      : (p.Categoria?.name || 'Varios')}
                  </p>

                  <p className="product-price">${p.price}</p>
                  <button 
                    className="add-to-cart-btn" 
                    onClick={() => handleAddToCart(p.id)}
                  >
                    Añadir al carrito
                  </button>
                </div>
              );
            })}
          </div>
          
          {filteredProductos.length === 0 && (
            <div className="no-products">
              <p>No se encontraron productos con los filtros seleccionados.</p>
              <button onClick={() => setFilters({
                categories: [],
                platforms: [],
                minPrice: '',
                maxPrice: ''
              })} className="btn">Limpiar filtros</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalogo;
