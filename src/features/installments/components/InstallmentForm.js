import React, { useState, useContext } from 'react';
import { InstallmentContext } from '../contexts/InstallmentContext';
import './InstallmentForm.css';

const InstallmentForm = () => {
  const { addInstallment } = useContext(InstallmentContext);
  const [formData, setFormData] = useState({
    clientName: '',
    clientId: '',
    clientAddress: '',
    invoiceNumber: '',
    totalAmount: '',
    numberOfInstallments: 3,
    startDate: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Calcul des montants de traites
  const calculateInstallments = () => {
    if (!formData.totalAmount || !formData.numberOfInstallments) return [];
    
    const total = parseFloat(formData.totalAmount);
    const count = parseInt(formData.numberOfInstallments);
    const amountPerInstallment = Math.round((total / count) * 100) / 100;
    const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
    
    // Création des traites
    const installments = [];
    let remainingAmount = total;
    
    for (let i = 0; i < count; i++) {
      let dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      // Pour la dernière traite, ajuster pour s'assurer que le total est exact
      let amount = i === count - 1 ? remainingAmount : amountPerInstallment;
      remainingAmount -= amount;
      
      installments.push({
        index: i + 1,
        amount: amount.toFixed(2),
        dueDate: dueDate.toISOString().split('T')[0]
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

  const validate = () => {
    const newErrors = {};
    if (!formData.clientName) newErrors.clientName = 'Nom du client requis';
    if (!formData.invoiceNumber) newErrors.invoiceNumber = 'Numéro de facture requis';
    if (!formData.totalAmount || isNaN(formData.totalAmount) || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Montant valide requis';
    }
    if (!formData.numberOfInstallments || formData.numberOfInstallments < 1) {
      newErrors.numberOfInstallments = 'Nombre de traites valide requis';
    }
    if (!formData.startDate) newErrors.startDate = 'Date de début requise';
    
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
        installmentDetails: installmentsList
      };
      
      addInstallment(newInstallment);
      
      // Réinitialiser le formulaire
      setFormData({
        clientName: '',
        clientId: '',
        clientAddress: '',
        invoiceNumber: '',
        totalAmount: '',
        numberOfInstallments: 3,
        startDate: '',
        notes: ''
      });
      
      alert('Les traites ont été créées avec succès !');
    }
  };

  return (
    <div className="installment-form">
      <h2>Créer des Traites</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Informations client */}
          <div className="form-group">
            <label>Nom du Client *</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className={`form-input ${errors.clientName ? 'error' : ''}`}
            />
            {errors.clientName && <p className="error-text">{errors.clientName}</p>}
          </div>
          
          <div className="form-group">
            <label>ID Client (CIN/RNE)</label>
            <input
              type="text"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          <div className="form-group full-width">
            <label>Adresse Client</label>
            <input
              type="text"
              name="clientAddress"
              value={formData.clientAddress}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          {/* Informations de la facture */}
          <div className="form-group">
            <label>Numéro de Facture *</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              className={`form-input ${errors.invoiceNumber ? 'error' : ''}`}
            />
            {errors.invoiceNumber && <p className="error-text">{errors.invoiceNumber}</p>}
          </div>
          
          <div className="form-group">
            <label>Montant Total (DT) *</label>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`form-input ${errors.totalAmount ? 'error' : ''}`}
            />
            {errors.totalAmount && <p className="error-text">{errors.totalAmount}</p>}
          </div>
          
          {/* Paramètres des traites */}
          <div className="form-group">
            <label>Nombre de Traites *</label>
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
            <label>Date de début *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`form-input ${errors.startDate ? 'error' : ''}`}
            />
            {errors.startDate && <p className="error-text">{errors.startDate}</p>}
          </div>
          
          <div className="form-group full-width">
            <label>Notes supplémentaires</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="form-input"
            ></textarea>
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
                  </tr>
                </thead>
                <tbody>
                  {installmentsList.map((inst) => (
                    <tr key={inst.index}>
                      <td>{inst.index}</td>
                      <td className="amount">{inst.amount}</td>
                      <td>{inst.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <button type="submit" className="submit-btn">
          <i className="fas fa-save"></i> Créer les Traites
        </button>
      </form>
    </div>
  );
};

export default InstallmentForm;