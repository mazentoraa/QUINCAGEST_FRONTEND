import React, { createContext, useState, useEffect } from 'react';
import { getApiService } from '../services/apiServiceFactory';

const { cdsService } = getApiService();

// Création du contexte
export const InvoiceContext = createContext();

// Provider du contexte
export const InvoiceProvider = ({ children }) => {
  // État pour stocker toutes les factures
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chargement initial des factures (à remplacer par votre API)
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fonction pour récupérer les factures
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await cdsService.getOrders();
      setInvoices(data);
    } catch (err) {
      setError('Erreur lors du chargement des factures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter une nouvelle facture
  const addInvoice = (newInvoice) => {
    // Générer un ID unique pour la nouvelle facture
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
    
    // Appel API pour sauvegarder (à implémenter)
    // saveInvoiceToAPI(invoiceToAdd);
    
    return invoiceToAdd;
  };

  // Fonction pour mettre à jour une facture existante
  const updateInvoice = (updatedInvoice) => {
    setInvoices(invoices.map(invoice => 
      invoice.id === updatedInvoice.id ? updatedInvoice : invoice
    ));
    
    // Appel API pour mettre à jour (à implémenter)
    // updateInvoiceInAPI(updatedInvoice);
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
    
    // Calculer le total des paiements
    const totalPaid = updatedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    // Déterminer le nouveau statut
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
    
    // Appel API pour mettre à jour (à implémenter)
    // updateInvoiceStatusInAPI(invoiceId, 'cancelled');
  };

  // Fonction pour supprimer une facture
  const deleteInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      await cdsService.deleteOrder(invoiceId);
      setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== invoiceId));
      setLoading(false);
    } catch (error) {
      setError('Erreur lors de la suppression de la facture');
      setLoading(false);
      throw error;
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
    deleteInvoice
  };

  return (
    <InvoiceContext.Provider value={contextValue}>
      {children}
    </InvoiceContext.Provider>
  );
};
