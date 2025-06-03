import React, { createContext, useState, useEffect } from 'react';
import * as InstallmentService from '../services/InstallmentService';
import ClientService from '../../clientManagement/services/ClientService';

export const InstallmentContext = createContext();

export const InstallmentProvider = ({ children }) => {
  const [installments, setInstallments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [installmentsData, clientsData] = await Promise.all([
          InstallmentService.getPlansTraite(),
          getClients()
        ]);

        const mappedInstallments = installmentsData.map(item => ({
          ...item,
          clientName: item.nom_raison_sociale || item.client?.nom_client || 'N/A',
          invoiceNumber: item.numero_facture || 'N/A',
          totalAmount: item.montant_total || 0,
          numberOfInstallments: item.nombre_traite || 0,
          status: item.status || 'EN_COURS',
          installmentDetails: item.traites || [],
          bankName: item.banque || '',
        }));

        setInstallments(mappedInstallments);
        setClients(clientsData);
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getClients = async () => {
    try {
      const data = await ClientService.getClients?.();
      return data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des clients:', err);
      return [];
    }
  };

  const addClient = async (newClient) => {
    try {
      const created = await ClientService.createClient?.(newClient);
      if (created) {
        setClients((prev) => [...prev, created]);
        return created;
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout du client:", err);
      throw err;
    }
  };

  const updateClientsFromInstallment = (installmentData) => {
    const exists = clients.some(c => c.name === installmentData.clientName);
    if (!exists) {
      setClients(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          name: installmentData.clientName,
          taxId: installmentData.clientTaxId,
          address: installmentData.clientAddress,
        },
      ]);
    }
  };

  const addInstallment = async (newInstallment) => {
    setLoading(true);
    try {
      const payload = {
        numero_commande: newInstallment.numero_commande,
        nombre_traite: newInstallment.nombre_traite,
        date_premier_echeance: newInstallment.date_premier_echeance,
        periode: newInstallment.periode || 30,
        montant_total: newInstallment.montant_total || 0,
        nom_raison_sociale: newInstallment.nom_raison_sociale,
        matricule_fiscal: newInstallment.tire_matricule,
        mode_paiement: 'traite'
      };

      const created = await InstallmentService.createPlanTraite(payload);

      const enriched = {
        ...created,
        clientName: payload.nom_raison_sociale,
        invoiceNumber: created.numero_facture,
        totalAmount: payload.montant_total,
        numberOfInstallments: payload.nombre_traite,
        status: created.status || "EN_COURS",
        installmentDetails: created.traites || [],
      };

      setInstallments(prev => [...prev, enriched]);
      updateClientsFromInstallment(enriched);

      return created;
    } catch (err) {
      console.error('Erreur lors de la création de la traite :', err);
      setError("Erreur lors de la création de la traite");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInstallment = async (updatedInstallment) => {
    setLoading(true);
    try {
      const updated = await InstallmentService.updateTraiteStatus(
        updatedInstallment.id, // 👈 Assure-toi que c'est l'ID du Traite
        { status: updatedInstallment.status }
      );
      setInstallments((prev) =>
        prev.map((item) =>
          item.id === updatedInstallment.id ? { ...item, ...updated } : item
        )
      );
      return updated;
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour de la traite");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInstallment = (installmentId) => {
    setInstallments((prev) => prev.filter((item) => item.id !== installmentId));
  };

  const refreshClients = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
      return clientsData;
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des clients:', err);
      return [];
    }
  };

  return (
    <InstallmentContext.Provider
      value={{
        installments,
        addInstallment,
        updateInstallment,
        deleteInstallment,
        clients,
        getClients,
        addClient,
        refreshClients,
        loading,
        error,
      }}
    >
      {children}
    </InstallmentContext.Provider>
  );
};

export default InstallmentProvider;
