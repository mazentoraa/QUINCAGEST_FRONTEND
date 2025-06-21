import React, { useState, useMemo } from "react";
import "./InstallmentDetails.css";

const InstallmentDetails = ({ installment, onBack, onUpdateInstallment }) => {
  console.log("insta",installment)
  
  const mappedInstallmentDetails = useMemo(() => {
    return installment.traites.map((traite) => ({
      id: traite.id,
      amount: traite.montant,
      dueDate: traite.date_echeance,
      status: traite.status || "non_paye",
    }));
  }, [installment.traites]);

  const [installmentStatuses, setInstallmentStatuses] = useState(() => {
    return mappedInstallmentDetails.reduce((acc, detail, i) => {
      acc[i] = detail.status || "non_paye";
      return acc;
    }, {});
  });

  const handleInstallmentStatusChange = (index, newStatus) => {
    const updatedStatuses = {
      ...installmentStatuses,
      [index]: newStatus,
    };
    setInstallmentStatuses(updatedStatuses);

    const updatedInstallmentDetails = mappedInstallmentDetails.map(
      (detail, i) => ({
        ...detail,
        status: updatedStatuses[i],
      })
    );

    const allPaid = updatedInstallmentDetails.every(
      (detail) => detail.status === "PAYEE"
    );
    const somePaid = updatedInstallmentDetails.some(
      (detail) => detail.status === "PAYEE"
    );

    const globalStatus = allPaid
      ? "PAYEE"
      : somePaid
      ? "PARTIELLEMENT_PAYEE"
      : "NON_PAYEE";

    const updatedInstallment = {
      ...installment,
      traites: updatedInstallmentDetails,
      status: globalStatus,
    };

    onUpdateInstallment(updatedInstallment);
  };

  const handleBulkStatusChange = (newStatus) => {
    const updatedStatuses = {};
    mappedInstallmentDetails.forEach((_, i) => {
      updatedStatuses[i] = newStatus;
    });

    setInstallmentStatuses(updatedStatuses);

    const updatedInstallmentDetails = mappedInstallmentDetails.map(
      (detail) => ({
        ...detail,
        status: newStatus,
      })
    );

    const globalStatus = newStatus === "PAYEE" ? "PAYEE" : "NON_PAYEE";

    const updatedInstallment = {
      ...installment,
      traites: updatedInstallmentDetails,
      status: globalStatus,
    };

    onUpdateInstallment(updatedInstallment);
  };

  const totalInstallments = mappedInstallmentDetails.length;

  const paidInstallments = Object.values(installmentStatuses).filter(
    (status) => status === "PAYEE"
  ).length;
  
  const unpaidInstallments = Object.values(installmentStatuses).filter(
    (status) => status === "NON_PAYEE"
  ).length;
  

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
          <div className="info-item">
            <label>Nom du Client:</label>
            <span>{installment.client_nom}</span>
          </div>
          <div className="info-item">
            <label>Adresse:</label>
            <span>{installment.clientAddress|| "Non spécifiée"}</span>
          </div>
          <div className="info-item">
            <label>Numéro de Facture:</label>
            <span>{installment.numero_facture}</span>
          </div>
          <div className="info-item">
            <label>Montant Total:</label>
            <span className="amount">{installment.montant_total} DT</span>
          </div>
        </div>
      </div>
      <div className="installment-summary-cards">
        <div className="summary-card total">
          <h3>{totalInstallments}</h3>
          <p>TOTAL TRAITES</p>
        </div>
        <div className="summary-card paid">
          <h3>{paidInstallments}</h3>
          <p>PAYÉES</p>
        </div>
        <div className="summary-card unpaid">
          <h3>{unpaidInstallments}</h3>
          <p>NON PAYÉES</p>
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
                <th>Changer le Statut</th> {/* ✅ New column */}
              </tr>
            </thead>
            <tbody>
              {mappedInstallmentDetails.map((detail, i) => {
                const isPaid = installmentStatuses[i] === "PAYEE";

                return (
                  <tr key={i} className={isPaid ? "paid-row" : "unpaid-row"}>
                    <td className="installment-number">#{i + 1}</td>
                    <td className="amount">{detail.amount} DT</td>
                    <td className="due-date">
                      {new Date(detail.dueDate).toLocaleDateString("fr-FR")}
                    </td>

                    {/* ✅ Display status as label */}
                    <td className="status-cell">
                      <span
                        className={`status-label ${isPaid ? "paid" : "unpaid"}`}
                      >
                        {isPaid ? "Payée" : "Non payée"}
                      </span>
                    </td>

                    {/* ✅ Toggle status button */}
                    <td>
                      <button
                        className={`toggle-status-btn ${
                          isPaid ? "mark-unpaid" : "mark-paid"
                        }`}
                        onClick={() =>
                          handleInstallmentStatusChange(
                            i,
                            isPaid ? "NON_PAYEE" : "PAYEE"
                          )
                        }
                      >
                        {isPaid ? "Marquer Non Payée" : "Marquer Payée"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bulk-action-buttons">
          <button
            className="bulk-button mark-all-paid"
            onClick={() => handleBulkStatusChange("PAYEE")}
          >
            Marquer tout comme Payée
          </button>
          <button
            className="bulk-button mark-all-unpaid"
            onClick={() => handleBulkStatusChange("NON_PAYEE")}
          >
            Marquer tout comme Non Payée
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallmentDetails;
