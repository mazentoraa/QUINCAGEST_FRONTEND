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
          InstallmentService.getPlanTraitess(),
          getClients()
        ]);
        setInstallments(installmentsData);
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
      if (ClientService?.getClients) {
        return await ClientService.getClients();
      }

      const installmentsData = await InstallmentService.getPlanTraitess();
      const clientMap = new Map();

      installmentsData.forEach((item) => {
        if (item.client_nom && !clientMap.has(item.client_nom)) {
          clientMap.set(item.client_nom, {
            id: item.client_nom,
            name: item.client_nom,
            address: item.client_address || '',
            taxId: item.client_tax_id || '',
          });
        }
      });

      return Array.from(clientMap.values());
    } catch (err) {
      console.error('Erreur lors de la récupération des clients:', err);
      return [];
    }
  };

  const addClient = async (newClient) => {
    try {
      if (ClientService?.createClient) {
        const created = await ClientService.createClient(newClient);
        setClients((prev) => [...prev, created]);
        return created;
      }

      const clientWithId = {
        ...newClient,
        id: newClient.id || Date.now().toString(),
      };
      setClients((prev) => [...prev, clientWithId]);
      return clientWithId;
    } catch (err) {
      console.error("Erreur lors de l'ajout du client:", err);
      throw err;
    }
  };

  const updateClientsFromInstallment = (installmentData) => {
    const existing = clients.find(c => c.name === installmentData.client_nom);
    if (!existing && installmentData.client_nom) {
      setClients((prev) => [
        ...prev,
        {
          id: installmentData.client_nom,
          name: installmentData.client_nom,
          address: installmentData.client_address || '',
          taxId: installmentData.client_tax_id || '',
        },
      ]);
    }
  };

  const addInstallment = async (newInstallment) => {
    setLoading(true);
    try {
      const payload = {
        facture_id: newInstallment.facture_id,
        nombre_traite: newInstallment.nombre_traite,
        date_premier_echeance: newInstallment.date_premier_echeance,
        periode: newInstallment.periode || 30,
      };

      // 🔍 Debug console détaillé :
      console.log("📦 Payload debug :");
      console.log("facture_id =", payload.facture_id, "→ type:", typeof payload.facture_id);
      console.log("nombre_traite =", payload.nombre_traite, "→ type:", typeof payload.nombre_traite);
      console.log("date_premier_echeance =", payload.date_premier_echeance, "→ type:", typeof payload.date_premier_echeance);
      console.log("periode =", payload.periode, "→ type:", typeof payload.periode);

      const created = await InstallmentService.createPlanTraite(payload);
      setInstallments((prev) => [...prev, created]);
      updateClientsFromInstallment(newInstallment);
      setError(null);
      return created;
    } catch (err) {
      console.error('Erreur lors de la création de la traite :', err);
      if (err.response) {
        console.error("API response error data:", err.response.data);
      }
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
        updatedInstallment.traiteId,
        { status: updatedInstallment.status }
      );
      setInstallments((prev) =>
        prev.map((item) =>
          item.id === updatedInstallment.id ? { ...item, ...updated } : item
        )
      );
      setError(null);
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

  const value = {
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
  };

  return (
    <InstallmentContext.Provider value={value}>
      {children}
    </InstallmentContext.Provider>
  );
};

export default InstallmentProvider;
