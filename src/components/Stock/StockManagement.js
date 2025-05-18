import React, { useContext } from 'react';
import { StockContext } from '../../contexts/StockContext';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import FilterSearch from './FilterSearch';
import './StockManagement.css';

function StockManagement() {
  const { filteredProducts } = useContext(StockContext);

  return (
    <div className="stock-management">
      <div className="stock-header">
        <h1>Gestion des produits</h1>
        <button className="add-product-btn" data-bs-toggle="modal" data-bs-target="#addProductModal">
          <i className="fas fa-plus"></i> Ajouter un produit
        </button>
      </div>
      
      <FilterSearch />
      
      
      <ProductList products={filteredProducts} />
      
      {/* Modal pour ajouter un produit */}
      <div className="modal fade" id="addProductModal" tabIndex="-1" aria-labelledby="addProductModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addProductModalLabel">Ajouter un nouveau produit</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <ProductForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockManagement;