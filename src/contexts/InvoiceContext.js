import React, { createContext, useState, useEffect } from 'react';

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
      // Simulation d'appel API - à remplacer par votre vrai API
      // const response = await fetch('/api/invoices');
      // const data = await response.json();
      // setInvoices(data);
      
      // Pour le test, utilisons des données fictives
      setTimeout(() => {
        setInvoices([
          {
            id: '1',
            number: 'FACT-2025-001',
            date: '2025-05-10',
            clientName: 'Entreprise XYZ',
            totalAmount: 1250.75,
            status: 'pending', // pending, paid, partially_paid, cancelled
            paymentMethod: 'comptant', // comptant ou traite
            items: [
              { id: '1', description: 'Produit A', quantity: 5, price: 120, total: 600 },
              { id: '2', description: 'Service B', quantity: 2, price: 325.38, total: 650.75 }
            ],
            payments: []
          },
          {
            id: '2',
            number: 'FACT-2025-002',
            date: '2025-05-12',
            clientName: 'Client ABC',
            totalAmount: 3450.00,
            status: 'partially_paid',
            paymentMethod: 'traite',
            items: [
              { id: '1', description: 'Matériel C', quantity: 10, price: 345, total: 3450 }
            ],
            payments: [
              { id: '1', date: '2025-05-13', amount: 1150, method: 'traite', reference: 'TR-001' }
            ]
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError('Erreur lors du chargement des factures');
      setLoading(false);
      console.error(err);
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

  // Valeurs exposées par le contexte
  const contextValue = {
    invoices,
    loading,
    error,
    fetchInvoices,
    addInvoice,
    updateInvoice,
    addPayment,
    cancelInvoice
  };

  return (
    <InvoiceContext.Provider value={contextValue}>
      {children}
    </InvoiceContext.Provider>
  );
};