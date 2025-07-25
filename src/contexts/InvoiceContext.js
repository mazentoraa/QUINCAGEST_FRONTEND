import React, { createContext, useState, useEffect } from 'react';
import { getApiService } from '../services/apiServiceFactory';
import InvoiceService from '../features/manifeste/services/InvoiceService';

const { cdsService } = getApiService();

// Création du contexte
export const InvoiceContext = createContext();

// Provider du contexte
export const InvoiceProvider = ({ children }) => {
  // État pour stocker toutes les factures
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chargement initial des factures
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fonction pour récupérer les factures (non supprimées)
  const fetchInvoices = async (nature = 'facture') => {
    setLoading(true);
    try {
      // Utilise le paramètre nature pour filtrer factures ou avoirs
      const data = await cdsService.getOrders({ nature, deleted: false });
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des factures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter une nouvelle facture
  const addInvoice = (newInvoice) => {
    const id = Date.now().toString();
    const invoiceNumber = `FACT-${new Date().getFullYear()}-${invoices.length + 1}`.padEnd(3, '0');
    
    const invoiceToAdd = {
      ...newInvoice,
      id,
      number: invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      payments: []
    };
    
    setInvoices([...invoices, invoiceToAdd]);
    return invoiceToAdd;
  };

  // Fonction pour mettre à jour une facture existante
  const updateInvoice = (updatedInvoice) => {
    setInvoices(invoices.map(invoice => 
      invoice.id === updatedInvoice.id ? updatedInvoice : invoice
    ));
  };

  // Fonction pour ajouter un paiement à une facture
  const addPayment = (invoiceId, payment) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const newPayment = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...payment
    };
    
    const updatedPayments = [...invoice.payments, newPayment];
    const totalPaid = updatedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    let newStatus = 'pending';
    if (totalPaid >= invoice.totalAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
    }
    
    const updatedInvoice = {
      ...invoice,
      payments: updatedPayments,
      status: newStatus
    };
    
    updateInvoice(updatedInvoice);
    return updatedInvoice;
  };

  // Fonction pour annuler une facture
  const cancelInvoice = (invoiceId) => {
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        return { ...invoice, status: 'cancelled' };
      }
      return invoice;
    });
    setInvoices(updatedInvoices);
  };

  // Fonction pour supprimer une facture (soft delete)
  const deleteInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      // Utilise la méthode de soft delete du backend
      await InvoiceService.softDeleteInvoice(invoiceId);
      
      // Retire la facture de la liste des factures actives
      setInvoices(prevInvoices => 
        prevInvoices.filter(invoice => invoice.id !== invoiceId)
      );
      
      setError(null);
    } catch (error) {
      setError('Erreur lors de la suppression de la facture');
      console.error('Error in deleteInvoice:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les factures supprimées
  const fetchDeletedInvoices = async (nature = 'facture') => {
    setLoading(true);
    try {
      const data = await InvoiceService.getDeletedInvoices(nature);
      setError(null);
      return data;
    } catch (error) {
      setError('Erreur lors du chargement des factures supprimées');
      console.error('Error in fetchDeletedInvoices:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour restaurer une facture
const restoreInvoice = async (invoiceId, nature = 'facture') => {
  setLoading(true);
  try {
    const restoredInvoice = await InvoiceService.restoreInvoice(invoiceId, nature);
    setError(null);

    // Recharger la liste des factures actives avec le bon filtre
    await fetchInvoices(nature);

    return restoredInvoice;
  } catch (error) {
    setError('Erreur lors de la restauration de la facture');
    console.error('Error in restoreInvoice:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};

    // Fonction pour supprimer définitivement une facture
  const permanentlyDeleteInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      await InvoiceService.permanentlyDeleteInvoice(invoiceId);
      setError(null);
      
      // Optionnel : tu peux ici forcer un rechargement des factures supprimées
      // await fetchDeletedInvoices(); (si tu veux les mettre à jour automatiquement)

    } catch (error) {
      setError('Erreur lors de la suppression définitive de la facture');
      console.error('Error in permanentlyDeleteInvoice:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  // Valeurs exposées par le contexte
  const contextValue = {
    invoices,
    loading,
    error,
    fetchInvoices,
    addInvoice,
    updateInvoice,
    addPayment,
    cancelInvoice,
    deleteInvoice,
    fetchDeletedInvoices,
    restoreInvoice,
     permanentlyDeleteInvoice
  };

  return (
    <InvoiceContext.Provider value={contextValue}>
      {children}
    </InvoiceContext.Provider>
  );
};