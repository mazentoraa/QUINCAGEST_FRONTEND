import React, { useContext } from 'react';
import { StockContext } from '../../stock/contexts/StockContext';
import './FilterSearch.css';

function FilterSearch() {
  const { handleSearch, handleFilterMaterial, searchTerm, filterMaterial } = useContext(StockContext);

  return (
    <div className="filter-search">
      <div className="search-box">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <button className="search-btn">
          <i className="fas fa-search"></i>
        </button>
      </div>
      
      <div className="filter-box">
        <label htmlFor="materialFilter">Filtrer par matériau:</label>
        <select
          id="materialFilter"
          value={filterMaterial}
          onChange={(e) => handleFilterMaterial(e.target.value)}
        >
          <option value="">Tous</option>
          <option value="inox">Inox</option>
          <option value="fer">Fer</option>
          <option value="aluminium">Aluminium</option>
          <option value="cuivre">Cuivre</option>
          <option value="laiton">Laiton</option>
        </select>
      </div>
    </div>
  );
}

export default FilterSearch;