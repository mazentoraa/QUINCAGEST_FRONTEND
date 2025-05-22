import React, { useState, useContext, useEffect } from 'react';
import { InstallmentContext } from '../contexts/InstallmentContext';
import './InstallmentForm.css';

const InstallmentForm = () => {
  const { addInstallment } = useContext(InstallmentContext);
  
  // État pour les données du formulaire
  const [formData, setFormData] = useState({
    // Informations du tireur (vendeur)
    drawerName: 'RM METALASER', // Valeur par défaut
    drawerTaxId: '191 1419B/M/A/000', // Valeur par défaut
    drawerAddress: 'Sfax', // Valeur par défaut
    
    // Informations du tiré (acheteur/client)
    clientName: '',
    clientTaxId: '',
    clientAddress: '',
    
    // Informations principales
    invoiceNumber: '',
    numberOfInstallments: 3,
    firstDueDate: '',
    totalAmount: '',
    period: 'mensuel',
    creationDate: new Date().toISOString().split('T')[0],
    
    // Informations additionnelles
    notice: '',
    acceptance: '',
    
    // Informations bancaires
    bankName: '',
    rib: ''
  });

  // États pour la gestion des listes
  const [clientsList, setClientsList] = useState([
    { id: 1, name: 'Client A', address: 'Adresse Client A', taxId: 'TAX001' },
    { id: 2, name: 'Client B', address: 'Adresse Client B', taxId: 'TAX002' },
    { id: 3, name: 'Client C', address: 'Adresse Client C', taxId: 'TAX003' }
  ]);
  
  const [invoicesList, setInvoicesList] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [errors, setErrors] = useState({});

  // Simuler une base de données de factures par client
  const invoicesDatabase = {
    'Client A': ['FAC001', 'FAC002', 'FAC003'],
    'Client B': ['FAC004', 'FAC005'],
    'Client C': ['FAC006', 'FAC007', 'FAC008', 'FAC009']
  };

  // Effet pour mettre à jour les factures disponibles quand le client change
  useEffect(() => {
    if (formData.clientName) {
      const availableInvoices = invoicesDatabase[formData.clientName] || [];
      setFilteredInvoices(availableInvoices);
    } else {
      setFilteredInvoices([]);
    }
  }, [formData.clientName]);

  // Calcul des montants de traites
  const calculateInstallments = () => {
    if (!formData.totalAmount || !formData.numberOfInstallments) return [];
    
    const total = parseFloat(formData.totalAmount);
    const count = parseInt(formData.numberOfInstallments);
    const amountPerInstallment = Math.round((total / count) * 100) / 100;
    const startDate = formData.firstDueDate ? new Date(formData.firstDueDate) : new Date();
    
    // Création des traites
    const installments = [];
    let remainingAmount = total;
    
    for (let i = 0; i < count; i++) {
      let dueDate = new Date(startDate);
      
      // Calcul de la date selon la période
      if (formData.period === 'mensuel') {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (formData.period === 'trimestriel') {
        dueDate.setMonth(dueDate.getMonth() + (i * 3));
      } else if (formData.period === 'semestriel') {
        dueDate.setMonth(dueDate.getMonth() + (i * 6));
      } else if (formData.period === 'annuel') {
        dueDate.setFullYear(dueDate.getFullYear() + i);
      }
      
      // Pour la dernière traite, ajuster pour s'assurer que le total est exact
      let amount = i === count - 1 ? remainingAmount : amountPerInstallment;
      remainingAmount -= amount;
      
      installments.push({
        index: i + 1,
        amount: amount.toFixed(2),
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'non_paye'
      });
    }
    
    return installments;
  };

  const installmentsList = calculateInstallments();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Nettoyer l'erreur si l'utilisateur corrige le champ
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Gestion de la sélection de client
  const handleClientSelect = (e) => {
    const selectedClientName = e.target.value;
    const selectedClient = clientsList.find(client => client.name === selectedClientName);
    
    if (selectedClient) {
      setFormData({
        ...formData,
        clientName: selectedClientName,
        clientAddress: selectedClient.address,
        clientTaxId: selectedClient.taxId,
        invoiceNumber: '' // Reset invoice number when client changes
      });
    } else {
      setFormData({
        ...formData,
        clientName: selectedClientName,
        clientAddress: '',
        clientTaxId: '',
        invoiceNumber: ''
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.drawerName) newErrors.drawerName = 'Nom du tireur requis';
    if (!formData.clientName) newErrors.clientName = 'Nom du client requis';
    if (!formData.invoiceNumber) newErrors.invoiceNumber = 'Numéro de facture requis';
    if (!formData.totalAmount || isNaN(formData.totalAmount) || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Montant valide requis';
    }
    if (!formData.numberOfInstallments || formData.numberOfInstallments < 1) {
      newErrors.numberOfInstallments = 'Nombre de traites valide requis';
    }
    if (!formData.firstDueDate) newErrors.firstDueDate = 'Date de première échéance requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      const newInstallment = {
        id: Date.now().toString(),
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        numberOfInstallments: parseInt(formData.numberOfInstallments),
        installmentDetails: installmentsList,
        status: 'non_paye',
        createdAt: new Date().toISOString()
      };
      
      addInstallment(newInstallment);
      
      // Réinitialiser le formulaire (garder les infos du tireur)
      setFormData({
        ...formData,
        clientName: '',
        clientTaxId: '',
        clientAddress: '',
        invoiceNumber: '',
        totalAmount: '',
        numberOfInstallments: 3,
        firstDueDate: '',
        notice: '',
        acceptance: '',
        bankName: '',
        rib: ''
      });
      
      alert('Les traites ont été créées avec succès !');
    }
  };

  return (
    <div className="installment-form">
      <h1 className="form-title">Créer des Traites</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          {/* Section Informations du tireur (vendeur) */}
          <div className="form-section drawer-section">
            <h3 className="section-title">Informations du tireur (vendeur)</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Nom/Raison sociale:</label>
                <input
                  type="text"
                  name="drawerName"
                  value={formData.drawerName}
                  onChange={handleChange}
                  className={`form-input ${errors.drawerName ? 'error' : ''}`}
                />
                {errors.drawerName && <p className="error-text">{errors.drawerName}</p>}
              </div>
              
              <div className="form-group">
                <label>Matricule fiscale:</label>
                <input
                  type="text"
                  name="drawerTaxId"
                  value={formData.drawerTaxId}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group full-width">
                <label>Adresse:</label>
                <input
                  type="text"
                  name="drawerAddress"
                  value={formData.drawerAddress}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section Informations du tiré (acheteur) */}
          <div className="form-section client-section">
            <h3 className="section-title">Informations du tiré (acheteur)</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Nom/Raison sociale:</label>
                <select
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleClientSelect}
                  className={`form-input ${errors.clientName ? 'error' : ''}`}
                >
                  <option value="">Sélectionner un client</option>
                  {clientsList.map(client => (
                    <option key={client.id} value={client.name}>
                      {client.name}
                    </option>
                  ))}
                  <option value="nouveau">+ Nouveau client</option>
                </select>
                {errors.clientName && <p className="error-text">{errors.clientName}</p>}
              </div>
              
              <div className="form-group">
                <label>Matricule fiscale:</label>
                <input
                  type="text"
                  name="clientTaxId"
                  value={formData.clientTaxId}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={formData.clientName === 'nouveau' ? 'Saisir matricule' : ''}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Adresse:</label>
                <input
                  type="text"
                  name="clientAddress"
                  value={formData.clientAddress}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={formData.clientName === 'nouveau' ? 'Saisir adresse' : ''}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Informations principales */}
        <div className="form-section main-info-section">
          <h3 className="section-title">Informations principales</h3>
          <div className="main-info-grid">
            <div className="form-group">
              <label>Numéro de Facture:</label>
              <select
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className={`form-input ${errors.invoiceNumber ? 'error' : ''}`}
                disabled={!formData.clientName || formData.clientName === 'nouveau'}
              >
                <option value="">
                  {formData.clientName ? 'Sélectionner une facture' : 'Sélectionner d\'abord un client'}
                </option>
                {filteredInvoices.map(invoice => (
                  <option key={invoice} value={invoice}>
                    {invoice}
                  </option>
                ))}
              </select>
              {errors.invoiceNumber && <p className="error-text">{errors.invoiceNumber}</p>}
            </div>

            <div className="form-group">
              <label>Nombre de Traites:</label>
              <input
                type="number"
                name="numberOfInstallments"
                value={formData.numberOfInstallments}
                onChange={handleChange}
                min="1"
                max="24"
                className={`form-input ${errors.numberOfInstallments ? 'error' : ''}`}
              />
              {errors.numberOfInstallments && <p className="error-text">{errors.numberOfInstallments}</p>}
            </div>

            <div className="form-group">
              <label>Date de Première échéance:</label>
              <input
                type="date"
                name="firstDueDate"
                value={formData.firstDueDate}
                onChange={handleChange}
                className={`form-input ${errors.firstDueDate ? 'error' : ''}`}
              />
              {errors.firstDueDate && <p className="error-text">{errors.firstDueDate}</p>}
            </div>

            <div className="form-group">
              <label>Montant total:</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`form-input ${errors.totalAmount ? 'error' : ''}`}
                placeholder="0.00"
              />
              {errors.totalAmount && <p className="error-text">{errors.totalAmount}</p>}
            </div>

            <div className="form-group">
              <label>Période:</label>
              <select
                name="period"
                value={formData.period}
                onChange={handleChange}
                className="form-input"
              >
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="semestriel">Semestriel</option>
                <option value="annuel">Annuel</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date de création:</label>
              <input
                type="date"
                name="creationDate"
                value={formData.creationDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section Informations additionnelles et bancaires */}
        <div className="form-sections">
          <div className="form-section additional-info-section">
            <h3 className="section-title">Informations:</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Aval:</label>
                <textarea
                  name="notice"
                  value={formData.notice}
                  onChange={handleChange}
                  rows="3"
                  className="form-input"
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Acceptation:</label>
                <textarea
                  name="acceptance"
                  value={formData.acceptance}
                  onChange={handleChange}
                  rows="3"
                  className="form-input"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-section bank-info-section">
            <h3 className="section-title">Informations bancaires</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Banque:</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>RIB:</label>
                <input
                  type="text"
                  name="rib"
                  value={formData.rib}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Aperçu des traites */}
        {formData.totalAmount && formData.numberOfInstallments > 0 && (
          <div className="installment-preview">
            <h3>Aperçu des Traites</h3>
            <div className="table-responsive">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Montant (DT)</th>
                    <th>Date d'échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {installmentsList.map((inst) => (
                    <tr key={inst.index}>
                      <td>{inst.index}</td>
                      <td className="amount">{inst.amount}</td>
                      <td>{new Date(inst.dueDate).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <span className="status-badge non-paye">Non payé</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <button type="submit" className="submit-btn">
          Créer des Traites
        </button>
      </form>
    </div>
  );
};

export default InstallmentForm;