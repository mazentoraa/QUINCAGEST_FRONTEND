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

        const mappedInstallments = installmentsData.map(item => {
          const clientInfo = clientsData.find(c => `${c.id}` === `${item.client}`) || {};
          const seen = new Set();
          const uniqueTraites = (item.traites || []).filter((tr) => {
            const key = `${tr.montant}-${tr.date_echeance}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          return {
            ...item,
            clientName: item.nom_raison_sociale || item.client?.nom_client || 'N/A',
            clientAddress: clientInfo.adresse || 'Non spécifiée', 
            invoiceNumber: item.numero_facture || 'N/A',
            totalAmount: item.montant_total || 0,
            numberOfInstallments: item.nombre_traite || uniqueTraites.length,
            status: item.status || 'non_paye',
            traites: uniqueTraites,
            bankName: item.banque || '',
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
      const data = await ClientService.get_all_clients();
      console.log('CLIENTS RAW:', data); 
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
        periode_str: newInstallment.periode_str,
        nom_raison_sociale: newInstallment.nom_raison_sociale,
        matricule_fiscal: newInstallment.tire_matricule,
        tireur_nom: newInstallment.tireur_nom,
        tireur_matricule: newInstallment.tireur_matricule,
        tireur_adresse: newInstallment.tireur_adresse,
        tire_nom: newInstallment.tire_nom,
        tire_matricule: newInstallment.tire_matricule,
        tire_adresse: newInstallment.tire_adresse,
        acceptation: newInstallment.acceptation,
        aval: newInstallment.aval,
        banque: newInstallment.banque,
        adresse_banque: newInstallment.adresse_banque,
        rip: newInstallment.rip,
        date_creation: newInstallment.date_creation,
        mode_paiement: 'traite'
      };
        // console.log("created",payload)
      const created = await InstallmentService.createPlanTraite(payload);
  
      const seen = new Set();
      const cleanTraites = (created.traites || []).filter(tr => {
        const key = `${tr.montant}-${tr.date_echeance}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  
      const enriched = {
        ...created,
        clientName: payload.nom_raison_sociale,
        invoiceNumber: created.numero_facture,
        totalAmount: payload.montant_total,
        numberOfInstallments: payload.nombre_traite,
        status: created.status || 'non_paye',
        traites: cleanTraites,
        bankName: payload.banque,
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
      const updateRequests = updatedInstallment.traites.map(traite =>
        InstallmentService.updateTraiteStatus(traite.id, { status: traite.status })
      );
      await Promise.all(updateRequests);

      setInstallments(prev =>
        prev.map(item =>
          item.id === updatedInstallment.id
            ? { ...item, ...updatedInstallment }
            : item
        )
      );

      return updatedInstallment;
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour de la traite");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInstallment = (installmentId) => {
    setInstallments(prev => prev.filter(item => item.id !== installmentId));
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
