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

        const mappedInstallments = installmentsData.map(item => {
          // Determine status from traites array if available
          let status = item.status || 'EN_COURS';
          if (item.traites && item.traites.length > 0) {
            // If all traites are paid, status is 'paye', else 'non_paye'
            const allPaid = item.traites.every(t => t.status === 'paye');
            status = allPaid ? 'paye' : 'non_paye';
          }
          return {
            ...item,
            clientName: item.nom_raison_sociale || item.client?.nom_client || 'N/A',
            invoiceNumber: item.facture?.numero_facture || item.numero_facture || 'N/A',
            totalAmount: item.montant_total || item.facture?.montant_ttc || 0,
            numberOfInstallments: item.nombre_traite || 0,
            status,
            installmentDetails: item.traites || [],
          };
        });

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
  invoiceNumber: newInstallment.numero_commande,
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
      const response = await InstallmentService.updateTraiteStatus(
        updatedInstallment.id,
        { status: updatedInstallment.status }
      );
      // The backend returns { status: "success", new_status: "paye" }
      // Update the local state with the new status
      setInstallments((prev) =>
        prev.map((item) =>
          item.id === updatedInstallment.id ? { ...item, status: response.new_status || updatedInstallment.status } : item
        )
      );
      return response;
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
