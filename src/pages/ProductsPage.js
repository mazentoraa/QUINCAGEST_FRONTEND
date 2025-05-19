import React from 'react';
import { ProductProvider } from '../features/products/contexts/ProductContext';
import ProductList from '../features/products/components/ProductList';
import ProductForm from '../features/products/components/ProductForm';

const ProductsPage = () => {
  return (
    <ProductProvider>
      <div className="products-page">
        <h1>Gestion des Produitsss</h1>
        <ProductForm />
        <ProductList />
      </div>
    </ProductProvider>
  );
};

export default ProductsPage;
