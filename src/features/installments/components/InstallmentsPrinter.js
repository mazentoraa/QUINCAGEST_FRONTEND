import React, { useContext, useState } from 'react';
import { InstallmentContext } from '../contexts/InstallmentContext';
import { generateInstallmentsPDF } from '../../../utils/pdfGenerator';
import './InstallmentsPrinter.css';

const InstallmentsPrinter = ({ selectedInstallment }) => {
  const { installments } = useContext(InstallmentContext);
  const [printAll, setPrintAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(
    selectedInstallment ? selectedInstallment.id : ''
  );

  const handlePrint = async () => {
    setLoading(true);
    try {
      const installmentToPrint = installments.find(i => i.id === selectedInstallmentId);
      if (installmentToPrint) {
        await generateInstallmentsPDF(installmentToPrint, printAll);
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      alert('Une erreur est survenue lors de la génération du PDF');
    }
    setLoading(false);
  };

  if (installments.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucune traite n'est disponible pour l'impression.</p>
        <p>Veuillez d'abord créer des traites.</p>
      </div>
    );
  }

  return (
    <div className="printer-container">
      <h2>Imprimer les Traites</h2>
      
      <div className="select-container">
        <label>Sélectionner une facture</label>
        <select
          value={selectedInstallmentId}
          onChange={(e) => setSelectedInstallmentId(e.target.value)}
          className="installment-select"
        >
          <option value="">-- Sélectionner une facture --</option>
          {installments.map((item) => (
            <option key={item.id} value={item.id}>
              Facture #{item.invoiceNumber} - {item.clientName} ({item.numberOfInstallments} traites)
            </option>
          ))}
        </select>
      </div>
      
      {selectedInstallmentId && (
        <>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="print-all-checkbox"
              checked={printAll}
              onChange={() => setPrintAll(!printAll)}
            />
            <label htmlFor="print-all-checkbox">
              Imprimer toutes les traites (sinon, imprimer seulement la première)
            </label>
          </div>
          
          <div className="installment-details">
            <h3>Détails des traites</h3>
            {installments.find(i => i.id === selectedInstallmentId)?.installmentDetails.map((inst) => (
              <div key={inst.index} className="detail-item">
                <span>Traite #{inst.index}: {inst.amount} DT</span>
                <span>Échéance: {inst.dueDate}</span>
              </div>
            ))}
          </div>
          
          <button
            onClick={handlePrint}
            disabled={loading}
            className={`print-button ${loading ? 'loading' : ''}`}
          >
            {loading && <span className="spinner"></span>}
            {loading ? 'Génération en cours...' : 'Imprimer les traites'}
          </button>
        </>
      )}
    </div>
  );
};

export default InstallmentsPrinter;