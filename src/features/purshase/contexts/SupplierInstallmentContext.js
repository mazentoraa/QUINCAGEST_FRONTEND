import React, { createContext, useState, useEffect } from 'react';
import SupplierInstallmentService from '../Services/SupplierInstallmentService';

export const SupplierInstallmentContext = createContext();

export const SupplierInstallmentProvider = ({ children }) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const data = await SupplierInstallmentService.getAllPlans();

      // Enrichir les traites fournisseurs avec les infos importantes
      const mappedInstallments = data.map(item => {
        const seen = new Set();
        const uniqueTraites = (item.traites || []).filter(tr => {
          const key = tr.id ? `id-${tr.id}` : `val-${tr.montant}-${tr.date_echeance}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          ...item,
          traites: uniqueTraites,
          fournisseurNom: item.nom_raison_sociale || item.fournisseur_nom || "N/A",
          fournisseurAdresse: item.fournisseur_adresse || "Adresse non spécifiée",
          drawerAddress: item.tireur_adresse || item.fournisseur_adresse || "Adresse non spécifiée",
          bankName: item.bank_name || item.banque || "Banque non spécifiée",
          bankAddress: item.bank_address || item.adresse_banque || "Adresse non spécifiée",
          numeroFacture: item.numero_facture || "N/A",
          status: item.status || "non_paye",
          montantTotal: item.montant_total || 0,
          nombreTraite: item.nombre_traite || uniqueTraites.length,
          dateEmission: item.date_emission || null,
        };
      });

      setInstallments(mappedInstallments);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des traites fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, []);

  const refreshInstallments = fetchInstallments;

  return (
    <SupplierInstallmentContext.Provider value={{ installments, loading, error, refreshInstallments }}>
      {children}
    </SupplierInstallmentContext.Provider>
  );
};
