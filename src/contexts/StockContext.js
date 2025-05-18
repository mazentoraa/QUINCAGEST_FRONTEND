import React, { createContext, useState, useEffect } from 'react';
import { mockProducts } from '../data/mockData';

export const StockContext = createContext();

export const StockProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');

  useEffect(() => {
    // Dans une application réelle, vous chargeriez les données depuis une API
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
  }, []);

  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now().toString(),
    };
    setProducts([...products, newProduct]);
    applyFilters(searchTerm, filterMaterial, [...products, newProduct]);
  };

  const updateProduct = (id, updatedProduct) => {
    const updatedProducts = products.map(product => 
      product.id === id ? { ...product, ...updatedProduct } : product
    );
    setProducts(updatedProducts);
    applyFilters(searchTerm, filterMaterial, updatedProducts);
  };

  const deleteProduct = (id) => {
    const updatedProducts = products.filter(product => product.id !== id);
    setProducts(updatedProducts);
    applyFilters(searchTerm, filterMaterial, updatedProducts);
  };

  const updateStock = (id, quantity) => {
    const updatedProducts = products.map(product => 
      product.id === id ? { ...product, quantity } : product
    );
    setProducts(updatedProducts);
    applyFilters(searchTerm, filterMaterial, updatedProducts);
  };

  const applyFilters = (search, material, productList = products) => {
    let filtered = productList;
    
    if (search) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (material && material !== 'all') {
      filtered = filtered.filter(product => 
        product.material.toLowerCase() === material.toLowerCase()
      );
    }
    
    setFilteredProducts(filtered);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    applyFilters(term, filterMaterial);
  };

  const handleFilterMaterial = (material) => {
    setFilterMaterial(material);
    applyFilters(searchTerm, material);
  };

  return (
    <StockContext.Provider 
      value={{ 
        products, 
        filteredProducts, 
        searchTerm,
        filterMaterial,
        addProduct, 
        updateProduct, 
        deleteProduct, 
        updateStock,
        handleSearch,
        handleFilterMaterial
      }}
    >
      {children}
    </StockContext.Provider>
  );
};