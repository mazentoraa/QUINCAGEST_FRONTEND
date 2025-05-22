import React, { createContext, useState, useCallback } from 'react';

export const InstallmentContext = createContext({
  installments: [],
  addInstallment: () => {},
  updateInstallment: () => {},
});

export const InstallmentProvider = ({ children }) => {
  const [installments, setInstallments] = useState([]);

  const addInstallment = useCallback((installment) => {
    setInstallments(prev => [...prev, installment]);
  }, []);

  const updateInstallment = useCallback((updatedInstallment) => {
    setInstallments(prev =>
      prev.map(inst =>
        inst.id === updatedInstallment.id ? updatedInstallment : inst
      )
    );
  }, []);

  return (
    <InstallmentContext.Provider value={{ installments, addInstallment, updateInstallment }}>
      {children}
    </InstallmentContext.Provider>
  );
};
