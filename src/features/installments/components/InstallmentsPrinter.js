import React, { useContext, useRef, useState } from 'react';
import { InstallmentContext } from '../contexts/InstallmentContext';
import TraitePrinter from './TraitePrinter';
import './TraitePrinter.css';
import './InstallmentsPrinter.css';
import ReactDOMServer from 'react-dom/server';

const InstallmentsPrinter = ({ selectedInstallment }) => {
  // Context and state
  const { installments } = useContext(InstallmentContext);
  const [loading, setLoading] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(
    selectedInstallment ? selectedInstallment.id : ''
  );
   const formatRIB = (rib) => {
    if (!rib) return '';
    const cleanRIB = rib.replace(/\s/g, '');
    // Format: XX XXX XXXXXXXXXXXXXXX XX
    if (cleanRIB.length >= 20) {
      return cleanRIB.replace(/(.{2})(.{3})(.{13})(.{2})/, '$1 $2 $3 $4');
    }
    return cleanRIB;
  };
  const numberToWords = (num) => {
    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

    if (num === 0) return 'zéro';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      if (ten === 7) return 'soixante-' + teens[one];
      if (ten === 9) return 'quatre-vingt-' + teens[one];
      return tens[ten] + (one ? '-' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      return (hundred === 1 ? 'cent' : ones[hundred] + ' cent') + (rest ? ' ' + numberToWords(rest) : '');
    }
    
    // Pour les milliers
    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    let result = '';
    if (thousand === 1) {
      result = 'mille';
    } else {
      result = numberToWords(thousand) + ' mille';
    }
    if (rest) {
      result += ' ' + numberToWords(rest);
    }
    return result;
  };

  const formatAmountInWords = (amount) => {
    const numAmount = Math.floor(parseFloat(amount));
    const decimals = Math.round((parseFloat(amount) - numAmount) * 1000);
    
    let result = numberToWords(numAmount);
    if (decimals > 0) {
      result += ` dinars et ${numberToWords(decimals)} millimes`;
    } else {
      result += ' dinars';
    }
    
    return result.charAt(0).toUpperCase() + result.slice(1);
  };
  const [selectedTraites, setSelectedTraites] = useState([]);
  const printRef = useRef(null);

  // Helper functions
  const currentInstallment = installments.find(i => i.id === selectedInstallmentId);
  const allTraitesSelected = currentInstallment && 
    selectedTraites.length === currentInstallment.installmentDetails.length;

  // Event handlers
  const handleTraiteToggle = (traitIndex) => {
    setSelectedTraites(prev => {
      if (prev.includes(traitIndex)) {
        return prev.filter(index => index !== traitIndex);
      } else {
        return [...prev, traitIndex];
      }
    });
  };

  const handleSelectAllToggle = () => {
    if (!currentInstallment) return;

    const allTraiteIndexes = currentInstallment.installmentDetails.map(inst => inst.index);
    
    if (selectedTraites.length === allTraiteIndexes.length) {
      setSelectedTraites([]);
    } else {
      setSelectedTraites(allTraiteIndexes);
    }
  };

  const handleInstallmentChange = (installmentId) => {
    setSelectedInstallmentId(installmentId);
    setSelectedTraites([]);
  };

  const handlePrint = async () => {
    const printContent = printRef.current;
     const originalBody = document.body.innerHTML;
     const printClone = printContent.cloneNode(true);
     const printContainer = document.createElement('div');
      printContainer.innerHTML = `
    <style>
      @page {
        size: auto;  /* auto est la taille de la page */
        margin: 0mm; /* Supprime les marges */
      }
      body {
        margin: 0;
        padding: 0;
        background: white;
      }
      .traite-container {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
      /* Cache les éléments indésirables */
      .no-print, .print-hide {
        display: none !important;
      }
    </style>
  `;
     printContainer.appendChild(printClone);
      document.body.innerHTML = printContainer.innerHTML;
      setTimeout(() => {
      window.print();
      document.body.innerHTML = originalBody;
  }, 100);
  };

  // Render empty state if no installments
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
      {/* <div style={{ display: 'none' }}> */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
        {selectedInstallmentId && currentInstallment &&
          currentInstallment.installmentDetails
            .filter(inst => selectedTraites.includes(inst.index))
            .map((inst) => (
              
              <div key={inst.index} className="print-traite">
                <div className="traite-container">
                        
                          <div className="field-overlay amount-main">
                          {parseFloat(inst.amount).toLocaleString('fr-FR', { 
                            minimumFractionDigits: 3, 
                            maximumFractionDigits: 3 
                          })}
                        </div>
                        <div className="field-overlay client-name">
                          {currentInstallment.clientName}
                        </div>
                        <div className="field-overlay client-address">
                          {currentInstallment.clientAddress}
                        </div>
                        <div className="field-overlay client-tax-id">
                          {currentInstallment.clientTaxId}
                        </div>
                          
                           <div className="field-overlay amount-words">
                          {formatAmountInWords(inst.amount)}
                        </div>

                        {/* Montant répété */}
                        <div className="field-overlay amount-repeated">
                          {parseFloat(inst.amount).toLocaleString('fr-FR', { 
                            minimumFractionDigits: 3, 
                            maximumFractionDigits: 3 
                          })}
                        </div>
                        <div className="field-overlay creation-place">
                        {currentInstallment.drawerAddress}
                      </div>
                      <div className="field-overlay creation-place-2">
                        {currentInstallment.drawerAddress}
                      </div>
                      <div className="field-overlay creation-date">
                        {new Date(currentInstallment.creationDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="field-overlay creation-date-2">
                        {new Date(currentInstallment.creationDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="field-overlay due-date-repeated">
                          {new Date(inst.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="field-overlay due-date-repeated-2">
                          {new Date(inst.dueDate).toLocaleDateString('fr-FR')}
                        </div>

                        {/* Tireur */}
                        <div className="field-overlay drawer-name">
                          {inst.drawerName}
                        </div>
                        <div className="field-overlay drawer-name">
                        {currentInstallment.drawerName}
                      </div>

                      {/* RIB */}
                      <div className="field-overlay client-rib">
                        {formatRIB(currentInstallment.rip || '')}
                      </div>
                      <div className="field-overlay client-rib-2">
                        {formatRIB(currentInstallment.rip || '')}
                      </div>

                      {/* Informations client en bas */}
                      <div className="field-overlay client-info-bottom">
                        <div>{currentInstallment.clientName}</div>
                        <div>{currentInstallment.clientAddress}</div>
                      </div>
                      {currentInstallment.acceptance && (
              <>
                <div className="field-overlay acceptance">
                  {currentInstallment.acceptance}
                </div>
                {/* <div className="field-overlay acceptance-2">
                  {installmentData.acceptance}
                </div> */}
              </>
            )}

            {/* Aval - si disponible */}
            {currentInstallment.notice && (
              <>
                <div className="field-overlay aval">
                  {currentInstallment.notice}
                </div>
                {/* <div className="field-overlay aval-2">
                  {installmentData.notice}
                </div> */}
              </>
            )}

            {/* Banque - Version principale et dupliquée */}
            {currentInstallment.bankName && (
              <>
                <div className="field-overlay bank-name">
                  {currentInstallment.bankName}
                </div>
                {/* <div className="field-overlay bank-name-2">
                  {installmentData.bankName}
                </div> */}
              </>
            )}

            {/* Adresse de la banque - Version principale et dupliquée (nouveau champ ajouté) */}
            {currentInstallment.bankAddress && (
              <>
                <div className="field-overlay bank-address">
                  {currentInstallment.bankAddress}
                </div>
                {/* <div className="field-overlay bank-address-2">
                  {installmentData.bankAddress}
                </div> */}
              </>
            )}
                  {/* </div> */}
                  </div>
                {/* <TraitePrinter
                  installmentData={currentInstallment}
                  currentTraite={inst}
                  onClose={() => {}}
                  hideControls={true}
                  fromParent={true}
                /> */}
              </div>
              
            ))
        }
     </div>
    </div>

    
    </div>
  );
};

export default InstallmentsPrinter;