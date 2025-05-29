import React, { useState, useRef } from 'react';
import './TraitePrinter.css';
import traiteVideImage from '../../../assets/images/traite-vide.jpeg'; // Assurez-vous que le chemin est correct


const TraitePrinter = ({ installmentData, onClose , hideControls = false , fromParent = false }) => {
  const printRef = useRef();
  const [currentTraiteIndex, setCurrentTraiteIndex] = useState(0);

  if (!installmentData || !installmentData.installmentDetails) {
    return null;
  }

  const currentTraite = installmentData.installmentDetails[currentTraiteIndex];

  // Formatage du RIB avec espaces selon le format tunisien
  const formatRIB = (rib) => {
    if (!rib) return '';
    const cleanRIB = rib.replace(/\s/g, '');
    // Format: XX XXX XXXXXXXXXXXXXXX XX
    if (cleanRIB.length >= 20) {
      return cleanRIB.replace(/(.{2})(.{3})(.{13})(.{2})/, '$1 $2 $3 $4');
    }
    return cleanRIB;
  };

  // Conversion du montant en lettres (fonction améliorée)
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

  const handlePrint = ( ) => {
    if (fromParent)  return; 
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
    // const printWindow = window.open('', '_blank');
    // const printContent = printRef.current.innerHTML;
    
    // printWindow.document.write(`
    //   <html>
    //     <head>
    //       <title>Traite ${installmentData.invoiceNumber}-${currentTraite.index}</title>
    //       <style>
    //         body { 
    //           margin: 0; 
    //           padding: 0; 
    //           font-family: Arial, sans-serif;
    //           background: white;
    //         }
    //         .traite-container { 
    //           width: 17.5cm; 
    //           height: 11.5cm; 
    //           margin: 0 auto;
    //           position: relative;
    //           background-color: #f9f9f9;
    //           border: 1px solid #ccc;
    //         }
    //         .field-overlay {
    //           position: absolute;
    //           font-family: Arial, sans-serif;
    //           color: #000;
    //           font-size: 12px;
    //           line-height: 1.2;
    //           z-index: 10;
    //         }
    //         .no-print { display: none !important; }
    //         @media print {
    //           body { margin: 0; padding: 0; }
    //           .traite-container { 
    //             margin: 0; 
    //             border: none; 
    //             background-color: transparent;
    //           }
    //           @page { margin: 0.5cm; size: A4 landscape; }
    //         }
    //       </style>
    //     </head>
    //     <body>
    //       ${printContent}
    //     </body>
    //   </html>
    // `);
    
    // printWindow.document.close();
    // printWindow.focus();
    // printWindow.print();
    // printWindow.close();
  };

  const nextTraite = () => {
    if (currentTraiteIndex < installmentData.installmentDetails.length - 1) {
      setCurrentTraiteIndex(currentTraiteIndex + 1);
    }
  };

  const prevTraite = () => {
    if (currentTraiteIndex > 0) {
      setCurrentTraiteIndex(currentTraiteIndex - 1);
    }
  };

  return (
    <div className="traite-printer-overlay">
      <div className="traite-printer-container">
        {/* Barre d'outils */}
        {!hideControls && (
        <div className="toolbar no-print">
          <div className="toolbar-left">
            <h3>Aperçu Traite {currentTraiteIndex + 1} / {installmentData.installmentDetails.length}</h3>
            <div className="navigation-buttons">
              <button
                onClick={prevTraite}
                disabled={currentTraiteIndex === 0}
                className="nav-btn prev-btn"
              >
                ← Précédent
              </button>
              <button
                onClick={nextTraite}
                disabled={currentTraiteIndex === installmentData.installmentDetails.length - 1}
                className="nav-btn next-btn"
              >
                Suivant →
              </button>
            </div>
          </div>
          <div className="toolbar-right">
            <button onClick={handlePrint} className="print-btn">
              🖨️ Imprimer
            </button>
            <button onClick={onClose} className="close-btn">
              Fermer
            </button>
          </div>
        </div>)}

        {/* Aperçu de la traite */}
        <div className="traite-preview">
          <div 
            ref={printRef}
            className="traite-container"
            style={{backgroundImage: `url(${traiteVideImage})`}}
          >
            {/* Dates d'échéance - Version principale et dupliquée */}
            {/* <div className="field-overlay due-date-main">
              {new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}
            </div>
            <div className="field-overlay due-date-main-2">
              {new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}
            </div> */}

            {/* Montants principaux - Version principale et dupliquée */}
            <div className="field-overlay amount-main">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', { 
                minimumFractionDigits: 3, 
                maximumFractionDigits: 3 
              })}
            </div>
            {/* <div className="field-overlay amount-main-2">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', { 
                minimumFractionDigits: 3, 
                maximumFractionDigits: 3 
              })}
            </div> */}

            {/* Informations client - Zone 1 (séparées) */}
            <div className="field-overlay client-name">
              {installmentData.clientName}
            </div>
            <div className="field-overlay client-address">
              {installmentData.clientAddress}
            </div>
            <div className="field-overlay client-tax-id">
              {installmentData.clientTaxId}
            </div>

            {/* Informations client - Zone 2 (séparées et dupliquées) */}
            {/* <div className="field-overlay client-name-2">
              {installmentData.clientName}
            </div>
            <div className="field-overlay client-address-2">
              {installmentData.clientAddress}  
            </div> */}
            {/* <div className="field-overlay client-tax-id-2">
              {installmentData.clientTaxId}
            </div> */}

            {/* Montant en lettres - Version principale et dupliquée */}
            <div className="field-overlay amount-words">
              {formatAmountInWords(currentTraite.amount)}
            </div>
            {/* <div className="field-overlay amount-words-2">
              {formatAmountInWords(currentTraite.amount)}
            </div> */}

            {/* Montant répété - Version principale et dupliquée */}
            <div className="field-overlay amount-repeated">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', { 
                minimumFractionDigits: 3, 
                maximumFractionDigits: 3 
              })}
            </div>
            {/* <div className="field-overlay amount-repeated-2">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', { 
                minimumFractionDigits: 3, 
                maximumFractionDigits: 3 
              })}
            </div> */}

            {/* Lieu de création - Version principale et dupliquée */}
            <div className="field-overlay creation-place">
              {installmentData.drawerAddress}
            </div>
            <div className="field-overlay creation-place-2">
              {installmentData.drawerAddress}
            </div>

            {/* Date de création - Version principale et dupliquée */}
            <div className="field-overlay creation-date">
              {new Date(installmentData.creationDate).toLocaleDateString('fr-FR')}
            </div>
            <div className="field-overlay creation-date-2">
              {new Date(installmentData.creationDate).toLocaleDateString('fr-FR')}
            </div>

            {/* Échéance répétée - Version principale et dupliquée */}
            <div className="field-overlay due-date-repeated">
              {new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}
            </div>
            <div className="field-overlay due-date-repeated-2">
              {new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}
            </div>

            {/* Nom du tireur - Version principale et dupliquée */}
            <div className="field-overlay drawer-name">
              {installmentData.drawerName}
            </div>
            {/* <div className="field-overlay drawer-name-2">
              {installmentData.drawerName}
            </div> */}

            {/* RIB du Tiré - Version principale et dupliquée  */}
            <div className="field-overlay client-rib">
              {formatRIB(installmentData.rip || '')}
            </div>
            <div className="field-overlay client-rib-2">
              {formatRIB(installmentData.rip || '')}
            </div>

            {/* Informations client en bas - Version principale et dupliquée */}
            <div className="field-overlay client-info-bottom">
              <div>{installmentData.clientName}</div>
              <div>{installmentData.clientAddress}</div>
            </div>
            {/* <div className="field-overlay client-info-bottom-2">
              <div>{installmentData.clientName}</div>
              <div>{installmentData.clientAddress}</div>
            </div> */}

            {/* Acceptation - si disponible */}
            {installmentData.acceptance && (
              <>
                <div className="field-overlay acceptance">
                  {installmentData.acceptance}
                </div>
                {/* <div className="field-overlay acceptance-2">
                  {installmentData.acceptance}
                </div> */}
              </>
            )}

            {/* Aval - si disponible */}
            {installmentData.notice && (
              <>
                <div className="field-overlay aval">
                  {installmentData.notice}
                </div>
                {/* <div className="field-overlay aval-2">
                  {installmentData.notice}
                </div> */}
              </>
            )}

            {/* Banque - Version principale et dupliquée */}
            {installmentData.bankName && (
              <>
                <div className="field-overlay bank-name">
                  {installmentData.bankName}
                </div>
                {/* <div className="field-overlay bank-name-2">
                  {installmentData.bankName}
                </div> */}
              </>
            )}

            {/* Adresse de la banque - Version principale et dupliquée (nouveau champ ajouté) */}
            {installmentData.bankAddress && (
              <>
                <div className="field-overlay bank-address">
                  {installmentData.bankAddress}
                </div>
                {/* <div className="field-overlay bank-address-2">
                  {installmentData.bankAddress}
                </div> */}
              </>
            )}

            {/* Matricule fiscal du tireur - Version principale et dupliquée */}
            {/* <div className="field-overlay drawer-tax-id">
              {installmentData.drawerTaxId}
            </div> */}
            {/* <div className="field-overlay drawer-tax-id-2">
              {installmentData.drawerTaxId}
            </div> */}

            {/* Informations complètes du tireur en bas - Version principale et dupliquée */}
            {/* <div className="field-overlay drawer-info-bottom">
              <div>{installmentData.drawerName}</div>
              <div>{installmentData.drawerAddress}</div>
              <div>Mat. Fiscal: {installmentData.drawerTaxId}</div>
            </div> */}
            {/* <div className="field-overlay drawer-info-bottom-2">
              <div>{installmentData.drawerName}</div>
              <div>{installmentData.drawerAddress}</div>
              <div>Mat. Fiscal: {installmentData.drawerTaxId}</div>
            </div> */}
          </div>
        </div>

        {/* Informations de la traite en bas */}
        <div className="traite-info no-print">
          <div className="info-grid">
            <div><strong>Client:</strong> {installmentData.clientName}</div>
            <div><strong>Facture:</strong> {installmentData.invoiceNumber}</div>
            <div><strong>Montant:</strong> {currentTraite.amount} DT</div>
            <div><strong>Échéance:</strong> {new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}</div>
            <div><strong>Banque:</strong> {installmentData.bankName || 'Non spécifiée'}</div>
            <div><strong>RIB:</strong> {formatRIB(installmentData.rip || '') || 'Non spécifié'}</div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TraitePrinter;