import React, { useState, useContext, useEffect } from 'react';
import { InstallmentContext } from "../contexts/InstallmentContext";
import TraitePrinter from './TraitePrinter';
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
    bankAddress: '', // Nouveau champ
    rip: '', // Renommé de 'rib' à 'rip'
  });

  // États pour la gestion des listes et aperçu
  const [clientsList, setClientsList] = useState([
    { id: 1, name: 'STE ZITOUNA', address: 'SFAX', taxId: '234567890213456789' },
    { id: 2, name: 'Client B', address: 'Tunis', taxId: 'TAX002' },
    { id: 3, name: 'Client C', address: 'Sousse', taxId: 'TAX003' }
  ]);
  
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Simuler une base de données de factures par client
  const invoicesDatabase = {
    'STE ZITOUNA': ['FAC001', 'FAC002', 'FAC003'],
    'Client B': ['FAC004', 'FAC005'],
    'Client C': ['FAC006', 'FAC007', 'FAC008', 'FAC009']
  };

  // Formatage du RIP en temps réel
  const formatRIPInput = (value) => {
    // Nettoyer la valeur (enlever tous les espaces)
    const cleanValue = value.replace(/\s/g, '');
    
    // Limiter à 20 chiffres maximum
    const limitedValue = cleanValue.substring(0, 20);
    
    // Appliquer le format: XX XXX XXXXXXXXXXXXXXX XX
    if (limitedValue.length <= 2) {
      return limitedValue;
    } else if (limitedValue.length <= 5) {
      return limitedValue.replace(/(.{2})(.*)/, '$1 $2');
    } else if (limitedValue.length <= 18) {
      return limitedValue.replace(/(.{2})(.{3})(.*)/, '$1 $2 $3');
    } else {
      return limitedValue.replace(/(.{2})(.{3})(.{13})(.*)/, '$1 $2 $3 $4');
    }
  };

  // Effet pour mettre à jour les factures disponibles quand le client change
  useEffect(() => {
    if (formData.clientName && formData.clientName !== 'nouveau') {
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
    const amountPerInstallment = Math.round((total / count) * 1000) / 1000;
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
        amount: amount.toFixed(3),
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'non_paye'
      });
    }
    
    return installments;
  };

  const installmentsList = calculateInstallments();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Formatage spécial pour le RIP
    if (name === 'rip') {
      const formattedValue = formatRIPInput(value);
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Nettoyer l'erreur si l'utilisateur corrige le champ
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
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

  const handlePreview = () => {
    if (validate()) {
      const installmentDetails = calculateInstallments();
      const previewInstallment = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        numberOfInstallments: parseInt(formData.numberOfInstallments),
        installmentDetails,
        status: 'non_paye',
        createdAt: new Date().toISOString()
      };
      setPreviewData(previewInstallment);
      setShowPreview(true);
    }
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
      
      // Afficher l'aperçu après sauvegarde
      setPreviewData(newInstallment);
      setShowPreview(true);
      
      // Optionnel: Réinitialiser le formulaire après l'aperçu
      // setFormData({ ... });
      // Afficher la liste après enregistrement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('switchInstallmentTab', { detail: { tab: 'view' } }));
      }
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
                step="0.001"
                className={`form-input ${errors.totalAmount ? 'error' : ''}`}
                placeholder="0.000"
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
            <h3 className="section-title">Informations additionnelles</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Aval:</label>
                <textarea
                  name="notice"
                  value={formData.notice}
                  onChange={handleChange}
                  rows="3"
                  className="form-input"
                  placeholder="Informations sur l'aval..."
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
                  placeholder="Informations sur l'acceptation..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-section bank-info-section">
            <h3 className="section-title">Informations bancaires</h3>
            <div className="bank-info-content">
              <div className="bank-info-row">
                <div className="form-group">
                  <label>Banque:</label>
                  <select
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">-- Sélectionnez une banque --</option>
              <option value="BCT">Banque Centrale de Tunisie (BCT)</option>
              <option value="STB">Société Tunisienne de Banque (STB)</option>
              <option value="BNA">Banque Nationale Agricole (BNA)</option>
              <option value="BIAT">Banque Internationale Arabe de Tunisie (BIAT)</option>
              <option value="Attijari_Bank">Attijari Bank</option>
              <option value="BT">Banque de Tunisie (BT)</option>
              <option value="UIB">Union Internationale de Banques (UIB)</option>
              <option value="Amen Bank">Amen Bank</option>
              <option value="ATB">Arab Tunisian Bank (ATB)</option>
              <option value="BTK">Banque Tuniso-Koweitienne (BTK)</option>
              <option value="Autre">Autre</option>
            </select>
                </div>
                
                <div className="form-group">
                  <label>Adresse de la banque:</label>
                  <input
                    type="text"
                    name="bankAddress"
                    value={formData.bankAddress}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Adresse de la banque..."
                  />
                </div>
              </div>
              
              <div className="form-group rip-group">
                <label>RIB :</label>
                <input
                  type="text"
                  name="rip"
                  value={formData.rip}
                  onChange={handleChange}
                  maxLength="23"
                  className="form-input rip-input"
                  placeholder="01 234 567890213456 78"
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
                      <td className="font-bold">Traite {inst.index}</td>
                      <td className="amount">
                        {parseFloat(inst.amount).toLocaleString('fr-FR', { 
                          minimumFractionDigits: 3, 
                          maximumFractionDigits: 3 
                        })}
                      </td>
                      <td>{new Date(inst.dueDate).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <span className="status-badge non-paye">Non payé</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td className="font-bold">Total:</td>
                    <td className="amount font-bold">
                      {parseFloat(formData.totalAmount).toLocaleString('fr-FR', { 
                        minimumFractionDigits: 3, 
                        maximumFractionDigits: 3 
                      })} DT
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button type="button" onClick={handlePreview} className="preview-btn">
            📄 Aperçu et Impression
          </button>
          <button type="submit" className="submit-btn">
            💾 Enregistrer et Voir Traites
          </button>
          <button 
            type="button" 
            onClick={() => {
              setFormData({
                drawerName: 'RM METALASER',
                drawerTaxId: '191 1419B/M/A/000',
                drawerAddress: 'Sfax',
                clientName: '',
                clientTaxId: '',
                clientAddress: '',
                invoiceNumber: '',
                numberOfInstallments: 3,
                firstDueDate: '',
                totalAmount: '',
                period: 'mensuel',
                creationDate: new Date().toISOString().split('T')[0],
                notice: '',
                acceptance: '',
                bankName: '',
                bankAddress: '',
                rip: ''
              });
              setErrors({});
            }}
            className="reset-btn"
          >
            🔄 Réinitialiser
          </button>
        </div>
      </form>

      {/* Modal d'aperçu avec impression */}
      {showPreview && previewData && (
        <TraitePrinter
          installmentData={previewData}
          onClose={() => {
            setShowPreview(false);
            setPreviewData(null);
          }}
        />
      )}
    </div>
  );
};

export default InstallmentForm;

// En haut du fichier ou dans useEffect :
// Permet à InstallmentManagement d'écouter l'événement pour changer d'onglet
window.addEventListener('switchInstallmentTab', (e) => {
  const { tab } = e.detail;
  // Logique pour changer d'onglet dans InstallmentManagement
  console.log('Changer d\'onglet vers:', tab);
  // Ici, vous pouvez ajouter le code pour changer l'onglet, par exemple:
  // setActiveTab(tab);
});