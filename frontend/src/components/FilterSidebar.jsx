import React, { useState, useEffect } from 'react';
import { getCategorias } from '../services/api';

const FilterSidebar = ({ onFilterChange, currentFilters }) => {
  const [generos, setGeneros] = useState([]);
  const [plataformas, setPlataformas] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategorias();
        setGeneros(data.filter(c => c.type === 'Genero' || c.type === 'General'));
        setPlataformas(data.filter(c => c.type === 'Plataforma' || c.type === 'Serie'));
      } catch (error) {
        console.error("Error fetching categories for filters:", error);
      }
    };
    fetchCats();
  }, []);

  const handleCheckboxChange = (type, value) => {
    const updatedList = [...currentFilters[type]];
    const index = updatedList.indexOf(value);
    
    if (index === -1) {
      updatedList.push(value);
    } else {
      updatedList.splice(index, 1);
    }
    
    onFilterChange({ ...currentFilters, [type]: updatedList });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...currentFilters, [name]: value });
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-section">
        <h3>Filtros</h3>
      </div>

      <div className="filter-section">
        <h4>Categorías</h4>
        <div className="filter-options">
          {generos.map(cat => (
            <label key={cat.id} className="filter-checkbox">
              <input
                type="checkbox"
                checked={currentFilters.categories.includes(cat.id.toString())}
                onChange={() => handleCheckboxChange('categories', cat.id.toString())}
              />
              <span className="checkmark"></span>
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Plataforma</h4>
        <div className="filter-options">
          {plataformas.map(plat => (
            <label key={plat.id} className="filter-checkbox">
              <input
                type="checkbox"
                checked={currentFilters.platforms.includes(plat.id.toString())}
                onChange={() => handleCheckboxChange('platforms', plat.id.toString())}
              />
              <span className="checkmark"></span>
              {plat.name}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Precio</h4>
        <div className="price-range-container">
          <div className="price-inputs">
            <div className="price-field">
              <span>Min</span>
              <input
                type="number"
                name="minPrice"
                value={currentFilters.minPrice}
                onChange={handlePriceChange}
                placeholder="0"
              />
            </div>
            <div className="price-separator">-</div>
            <div className="price-field">
              <span>Max</span>
              <input
                type="number"
                name="maxPrice"
                value={currentFilters.maxPrice}
                onChange={handlePriceChange}
                placeholder="Any"
              />
            </div>
          </div>
          <input
            type="range"
            name="maxPrice"
            min="0"
            max="10000"
            step="50"
            value={currentFilters.maxPrice || 10000}
            onChange={handlePriceChange}
            className="price-slider"
          />
          <div className="price-labels">
            <span>$0</span>
            <span>$10,000+</span>
          </div>
        </div>
      </div>

      <button 
        className="clear-filters-btn"
        onClick={() => onFilterChange({
          categories: [],
          platforms: [],
          minPrice: '',
          maxPrice: ''
        })}
      >
        Limpiar Filtros
      </button>
    </div>
  );
};

export default FilterSidebar;
