import React, { createContext, useState } from 'react';

export const StockContext = createContext();

export const StockProvider = ({ children }) => {
  // Example products, replace with your real data or fetching logic
  const [products, setProducts] = useState([
    { id: '1', name: 'Produit A', material: 'PVC', quantity: 10, price: 100 },
    { id: '2', name: 'Produit B', material: 'Alu', quantity: 5, price: 150 },
    // ...
  ]);

  return (
    <StockContext.Provider value={{ products, setProducts }}>
      {children}
    </StockContext.Provider>
  );
};
