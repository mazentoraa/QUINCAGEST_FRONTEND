import React, { useContext, useState } from 'react';
import { InstallmentContext } from '../contexts/InstallmentContext';
import { generateInstallmentsPDF } from '../../../utils/pdfGenerator';
import './InstallmentsPrinter.css';

const InstallmentsPrinter = ({ selectedInstallment }) => {
  const { installments } = useContext(InstallmentContext);
  const [loading, setLoading] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(
    selectedInstallment ? selectedInstallment.id : ''
  );
  const [selectedTraites, setSelectedTraites] = useState([]);

  // Gérer la sélection/désélection d'une traite individuelle
  const handleTraiteToggle = (traitIndex) => {
    setSelectedTraites(prev => {
      if (prev.includes(traitIndex)) {
        // Désélectionner la traite
        return prev.filter(index => index !== traitIndex);
      } else {
        // Sélectionner la traite
        return [...prev, traitIndex];
      }
    });
  };

  // Gérer la sélection/désélection de toutes les traites
  const handleSelectAllToggle = () => {
    const currentInstallment = installments.find(i => i.id === selectedInstallmentId);
    if (!currentInstallment) return;

    const allTraiteIndexes = currentInstallment.installmentDetails.map(inst => inst.index);
    
    if (selectedTraites.length === allTraiteIndexes.length) {
      // Désélectionner toutes
      setSelectedTraites([]);
    } else {
      // Sélectionner toutes
      setSelectedTraites(allTraiteIndexes);
    }
  };

  // Réinitialiser les sélections quand on change de facture
  const handleInstallmentChange = (installmentId) => {
    setSelectedInstallmentId(installmentId);
    setSelectedTraites([]);
  };

  const handlePrint = async () => {
    if (selectedTraites.length === 0) {
      alert('Veuillez sélectionner au moins une traite à imprimer.');
      return;
    }

    setLoading(true);
    try {
      const installmentToPrint = installments.find(i => i.id === selectedInstallmentId);
      if (installmentToPrint) {
        // Filtrer les traites sélectionnées
        const filteredInstallment = {
          ...installmentToPrint,
          installmentDetails: installmentToPrint.installmentDetails.filter(
            inst => selectedTraites.includes(inst.index)
          )
        };
        await generateInstallmentsPDF(filteredInstallment, true);
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

  const currentInstallment = installments.find(i => i.id === selectedInstallmentId);
  const allTraitesSelected = currentInstallment && 
    selectedTraites.length === currentInstallment.installmentDetails.length;

  return (
    <div className="printer-container">
      <h2>Imprimer les Traites</h2>
      
      <div className="select-container">
        <label>Sélectionner une facture</label>
        <select
          value={selectedInstallmentId}
          onChange={(e) => handleInstallmentChange(e.target.value)}
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
      
      {selectedInstallmentId && currentInstallment && (
        <>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="select-all-checkbox"
              checked={allTraitesSelected}
              onChange={handleSelectAllToggle}
            />
            <label htmlFor="select-all-checkbox">
              Imprimer toutes les traites (sinon, imprimer seulement la première)
            </label>
          </div>
          
          <div className="installment-details">
            <h3>Détails des traites</h3>
            {currentInstallment.installmentDetails.map((inst) => (
              <div key={inst.index} className="detail-item">
                <div className="traite-checkbox">
                  <input
                    type="checkbox"
                    id={`traite-${inst.index}`}
                    checked={selectedTraites.includes(inst.index)}
                    onChange={() => handleTraiteToggle(inst.index)}
                  />
                  <label htmlFor={`traite-${inst.index}`}>
                    <span>Traite #{inst.index}: {inst.amount} DT</span>
                    <span>Échéance: {inst.dueDate}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          <div className="selected-count">
            {selectedTraites.length > 0 && (
              <p>{selectedTraites.length} traite(s) sélectionnée(s)</p>
            )}
          </div>
          
          <button
            onClick={handlePrint}
            disabled={loading || selectedTraites.length === 0}
            className={`print-button ${loading ? 'loading' : ''} ${selectedTraites.length === 0 ? 'disabled' : ''}`}
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