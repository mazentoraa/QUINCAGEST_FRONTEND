import React, { useState, useMemo } from 'react';
import './InstallmentDetails.css';

const InstallmentDetails = ({ installment, onBack, onUpdateInstallment }) => {
  const mappedInstallmentDetails = useMemo(() => {
    return installment.traites.map((traite) => ({
      id: traite.id,
      amount: traite.montant,
      dueDate: traite.date_echeance,
      status: traite.status || 'non_paye',
    }));
  }, [installment.traites]);

  const [installmentStatuses, setInstallmentStatuses] = useState(() => {
    return mappedInstallmentDetails.reduce((acc, detail, i) => {
      acc[i] = detail.status || 'non_paye';
      return acc;
    }, {});
  });

  const handleInstallmentStatusChange = (index, newStatus) => {
    const updatedStatuses = {
      ...installmentStatuses,
      [index]: newStatus || 'non_paye'
    };
    setInstallmentStatuses(updatedStatuses);

    const updatedInstallmentDetails = mappedInstallmentDetails.map((detail, i) => ({
      ...detail,
      status: updatedStatuses[i] || 'non_paye'
    }));

    const allPaid = updatedInstallmentDetails.every(detail => detail.status === 'paye');
    const somePaid = updatedInstallmentDetails.some(detail => detail.status === 'paye');

    const globalStatus = allPaid
      ? 'paye'
      : somePaid
      ? 'partiellement_paye'
      : 'non_paye';

    const updatedInstallment = {
      ...installment,
      traites: updatedInstallmentDetails,
      status: globalStatus
    };

    onUpdateInstallment(updatedInstallment);
  };

  const handleBulkStatusChange = (newStatus) => {
    const updatedStatuses = {};
    mappedInstallmentDetails.forEach((_, i) => {
      updatedStatuses[i] = newStatus;
    });

    setInstallmentStatuses(updatedStatuses);

    const updatedInstallmentDetails = mappedInstallmentDetails.map((detail) => ({
      ...detail,
      status: newStatus
    }));

    const globalStatus = newStatus === 'paye' ? 'paye' : 'non_paye';

    const updatedInstallment = {
      ...installment,
      traites: updatedInstallmentDetails,
      status: globalStatus
    };

    onUpdateInstallment(updatedInstallment);
  };

  const totalInstallments = mappedInstallmentDetails.length;
  const paidInstallments = Object.values(installmentStatuses).filter(status => status === 'paye').length;
  const unpaidInstallments = totalInstallments - paidInstallments;

  return (
    <div className="installment-details-page">
      <div className="details-header">
        <button className="back-button" onClick={onBack}>
          ← Retour à la liste
        </button>
        <h1>Détails des Traites - {installment.client_nom}</h1>
      </div>

      <div className="client-info-card">
        <h2>Informations Client</h2>
        <div className="info-grid">
          <div className="info-item"><label>Nom du Client:</label><span>{installment.client_nom}</span></div>
          <div className="info-item"><label>Adresse:</label><span>{installment.client_adresse || 'Non spécifiée'}</span></div>
          <div className="info-item"><label>Numéro de Facture:</label><span>{installment.numero_facture}</span></div>
          <div className="info-item"><label>Montant Total:</label><span className="amount">{installment.montant_total} DT</span></div>
        </div>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {mappedInstallmentDetails.map((detail, i) => (
                <tr key={i} className={installmentStatuses[i] === 'paye' ? 'paid-row' : 'unpaid-row'}>
                  <td className="installment-number">#{i + 1}</td>
                  <td className="amount">{detail.amount} DT</td>
                  <td className="due-date">{new Date(detail.dueDate).toLocaleDateString('fr-FR')}</td>
                  <td className="status-cell">
                    <input
                      type="text"
                      value={installmentStatuses[i]}
                      placeholder="non_paye"
                      onChange={(e) => handleInstallmentStatusChange(i, e.target.value)}
                      className={`status-input ${installmentStatuses[i]}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default InstallmentDetails;
