import React, { useState } from 'react';
import './InstallmentDetails.css';

const InstallmentDetails = ({ installment, onBack, onUpdateInstallment }) => {
  const [installmentStatuses, setInstallmentStatuses] = useState(() => {
    // Initialiser les statuts de chaque traite (par défaut 'non_paye')
    const statuses = {};
    installment.installmentDetails.forEach(detail => {
      statuses[detail.index] = detail.status || 'non_paye';
    });
    return statuses;
  });

  // Fonction pour changer le statut d'une traite individuelle
  const handleInstallmentStatusChange = (installmentIndex, newStatus) => {
    const updatedStatuses = {
      ...installmentStatuses,
      [installmentIndex]: newStatus
    };
    setInstallmentStatuses(updatedStatuses);

    // Mettre à jour les détails des traites dans l'objet principal
    const updatedInstallmentDetails = installment.installmentDetails.map(detail => ({
      ...detail,
      status: updatedStatuses[detail.index]
    }));

    // Déterminer le statut global basé sur les statuts individuels
    const allPaid = updatedInstallmentDetails.every(detail => detail.status === 'paye');
    const somePaid = updatedInstallmentDetails.some(detail => detail.status === 'paye');
    
    let globalStatus = 'non_paye';
    if (allPaid) {
      globalStatus = 'paye';
    } else if (somePaid) {
      globalStatus = 'partiellement_paye';
    }

    // Mettre à jour l'objet installment complet
    const updatedInstallment = {
      ...installment,
      installmentDetails: updatedInstallmentDetails,
      status: globalStatus
    };

    onUpdateInstallment(updatedInstallment);
  };

  // Fonction pour marquer toutes les traites avec le même statut
  const handleBulkStatusChange = (newStatus) => {
    // Créer un nouvel objet de statuts avec toutes les traites au même statut
    const updatedStatuses = {};
    installment.installmentDetails.forEach(detail => {
      updatedStatuses[detail.index] = newStatus;
    });
    
    setInstallmentStatuses(updatedStatuses);

    // Mettre à jour les détails des traites dans l'objet principal
    const updatedInstallmentDetails = installment.installmentDetails.map(detail => ({
      ...detail,
      status: newStatus
    }));

    // Déterminer le statut global
    let globalStatus = newStatus;
    if (newStatus === 'paye') {
      globalStatus = 'paye'; // Tout est payé
    } else {
      globalStatus = 'non_paye'; // Tout est non payé
    }

    // Mettre à jour l'objet installment complet
    const updatedInstallment = {
      ...installment,
      installmentDetails: updatedInstallmentDetails,
      status: globalStatus
    };

    onUpdateInstallment(updatedInstallment);
  };

  // Calculer les statistiques
  const totalInstallments = installment.installmentDetails.length;
  const paidInstallments = Object.values(installmentStatuses).filter(status => status === 'paye').length;
  const unpaidInstallments = totalInstallments - paidInstallments;

  return (
    <div className="installment-details-page">
      <div className="details-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Retour à la liste
        </button>
        <h1>Détails des Traites - {installment.clientName}</h1>
      </div>

      {/* Informations générales */}
      <div className="client-info-card">
        <h2>Informations Client</h2>
        <div className="info-grid">
          <div className="info-item">
            <label>Nom du Client:</label>
            <span>{installment.clientName}</span>
          </div>
          <div className="info-item">
            <label>Adresse:</label>
            <span>{installment.clientAddress || 'Non spécifiée'}</span>
          </div>
          <div className="info-item">
            <label>Numéro de Facture:</label>
            <span>{installment.invoiceNumber}</span>
          </div>
          <div className="info-item">
            <label>Montant Total:</label>
            <span className="amount">{installment.totalAmount} DT</span>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{totalInstallments}</div>
            <div className="stat-label">Total Traites</div>
          </div>
          <div className="stat-card paid">
            <div className="stat-number">{paidInstallments}</div>
            <div className="stat-label">Payées</div>
          </div>
          <div className="stat-card unpaid">
            <div className="stat-number">{unpaidInstallments}</div>
            <div className="stat-label">Non Payées</div>
          </div>
        </div>
      </div>

      {/* Tableau des traites */}
      <div className="installments-table-section">
        <h2>Liste des Traites</h2>
        <div className="table-responsive">
          <table className="installments-details-table">
            <thead>
              <tr>
                <th>N° Traite</th>
                <th>Montant</th>
                <th>Date d'Échéance</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {installment.installmentDetails.map((detail) => (
                <tr key={detail.index} className={installmentStatuses[detail.index] === 'paye' ? 'paid-row' : 'unpaid-row'}>
                  <td className="installment-number">#{detail.index}</td>
                  <td className="amount">{detail.amount} DT</td>
                  <td className="due-date">{new Date(detail.dueDate).toLocaleDateString('fr-FR')}</td>
                  <td className="status-cell">
                    <select
                      value={installmentStatuses[detail.index]}
                      onChange={(e) => handleInstallmentStatusChange(detail.index, e.target.value)}
                      className={`status-select ${installmentStatuses[detail.index] === 'paye' ? 'paid' : 'unpaid'}`}
                    >
                      <option value="non_paye">Non payé</option>
                      <option value="paye">Payé</option>
                    </select>
                  </td>
                  <td className="actions-cell">
                    <button
                      className={`status-toggle-btn ${installmentStatuses[detail.index] === 'paye' ? 'mark-unpaid' : 'mark-paid'}`}
                      onClick={() => handleInstallmentStatusChange(
                        detail.index, 
                        installmentStatuses[detail.index] === 'paye' ? 'non_paye' : 'paye'
                      )}
                    >
                      {installmentStatuses[detail.index] === 'paye' ? (
                        <>
                          <i className="fas fa-times"></i> Marquer non payé
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i> Marquer payé
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions globales */}
      <div className="global-actions">
        <button
          className="bulk-action-btn mark-all-paid"
          onClick={() => handleBulkStatusChange('paye')}
        >
          <i className="fas fa-check-double"></i> Marquer tout comme payé
        </button>
        
        <button
          className="bulk-action-btn mark-all-unpaid"
          onClick={() => handleBulkStatusChange('non_paye')}
        >
          <i className="fas fa-times-circle"></i> Marquer tout comme non payé
        </button>
      </div>
    </div>
  );
};

export default InstallmentDetails;