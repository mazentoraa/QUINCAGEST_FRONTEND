import React, { createContext, useState, useEffect } from 'react';

// Création du contexte
export const InstallmentContext = createContext();

// Provider du contexte
export const InstallmentProvider = ({ children }) => {
  // État pour stocker les traites
  const [installments, setInstallments] = useState([]);

  // Charger les données depuis le localStorage au démarrage
  useEffect(() => {
    const savedInstallments = localStorage.getItem('installments');
    if (savedInstallments) {
      try {
        setInstallments(JSON.parse(savedInstallments));
      } catch (error) {
        console.error('Erreur lors du chargement des traites:', error);
        // Réinitialiser en cas d'erreur
        localStorage.removeItem('installments');
      }
    }
  }, []);

  // Sauvegarder les données dans le localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('installments', JSON.stringify(installments));
  }, [installments]);

  // Fonction pour ajouter une nouvelle traite
  const addInstallment = (newInstallment) => {
    setInstallments([...installments, newInstallment]);
  };

  // Fonction pour supprimer une traite
  const deleteInstallment = (installmentId) => {
    setInstallments(installments.filter(item => item.id !== installmentId));
  };

  // Fonction pour mettre à jour une traite existante
  const updateInstallment = (updatedInstallment) => {
    setInstallments(
      installments.map(item => 
        item.id === updatedInstallment.id ? updatedInstallment : item
      )
    );
  };

  // Valeur exposée par le contexte
  const value = {
    installments,
    addInstallment,
    deleteInstallment,
    updateInstallment
  };

  return (
    <InstallmentContext.Provider value={value}>
      {children}
    </InstallmentContext.Provider>
  );
};

export default InstallmentProvider;