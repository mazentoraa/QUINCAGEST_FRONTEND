import React, { useContext } from 'react';
import ProductCard from '../../products/components/ProductCard';
import './ProductList.css';

function ProductList({ products }) {
  return (
    <div className="product-list">
      {products.length === 0 ? (
        <div className="no-products">
          <p>Aucun produit ne correspond à votre recherche</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;