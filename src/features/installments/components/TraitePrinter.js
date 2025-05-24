import React, { useState, useRef } from 'react';
import './TraitePrinter.css';

const TraitePrinter = ({ installmentData, onClose }) => {
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
const handlePrint = () => {
  const printWindow = window.open('', '_blank');
  const printDocument = printWindow.document;

  const content = printRef.current.cloneNode(true);

  // Appliquer la taille exacte sans fond ni cadre
  content.style.width = '17.5cm';
  content.style.height = '11.5cm';
  content.style.margin = '0 auto';
  content.style.border = 'none';
  content.style.backgroundImage = 'none';
  content.style.backgroundColor = 'white';
  content.style.boxSizing = 'border-box';
  content.style.position = 'relative';

  printDocument.write(`
    <html>
      <head>
        <title>Traite ${installmentData.invoiceNumber}-${currentTraiteIndex + 1}</title>
        <style>
          @page {
            size: 17.5cm 11.5cm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body></body>
    </html>
  `);
  printDocument.close();

  printWindow.onload = () => {
    printDocument.body.appendChild(content);

    // Copier les styles CSS actifs
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        const rules = sheet.cssRules;
        if (rules) {
          const style = printDocument.createElement("style");
          Array.from(rules).forEach((rule) => {
            style.appendChild(printDocument.createTextNode(rule.cssText));
          });
          printDocument.head.appendChild(style);
        }
      } catch (e) {
        console.warn("Impossible de copier certaines règles CSS");
      }
    });

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
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
        </div>

        {/* Aperçu de la traite */}
        <div className="traite-preview">
          <div 
            ref={printRef}
            className="traite-container"
          >
            {/* Dates d'échéance - Version principale et dupliquée */}
            <div className="field-overlay due-date-main">
              {new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}
            </div>
            <div className="field-overlay due-date-main-2">
              {new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}
            </div>

            {/* Montants principaux - Version principale et dupliquée */}
            <div className="field-overlay amount-main">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', { 
                minimumFractionDigits: 3, 
                maximumFractionDigits: 3 
              })}
            </div>
            <div className="field-overlay amount-main-2">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', { 
                minimumFractionDigits: 3, 
                maximumFractionDigits: 3 
              })}
            </div>

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
            <div className="field-overlay client-name-2">
              {installmentData.clientName}
            </div>
            <div className="field-overlay client-address-2">
              {installmentData.clientAddress}  
            </div>
            <div className="field-overlay client-tax-id-2">
              {installmentData.clientTaxId}
            </div>

            {/* Montant en lettres - Version principale et dupliquée */}

            <div className="field-overlay amount-words-2">
              {formatAmountInWords(currentTraite.amount)}
            </div>

            {/* Montant répété - Version principale et dupliquée */}
            <div className="field-overlay amount-repeated">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', { 
                minimumFractionDigits: 3, 
                maximumFractionDigits: 3 
              })}
            </div>
            <div className="field-overlay amount-repeated-2">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', { 
                minimumFractionDigits: 3, 
                maximumFractionDigits: 3 
              })}
            </div>

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


            {/* Acceptation - si disponible */}
            {installmentData.acceptance && (
              <>
                <div className="field-overlay acceptance">
                  {installmentData.acceptance}
                </div>

              </>
            )}

            {/* Aval - si disponible */}
            {installmentData.notice && (
              <>
                <div className="field-overlay aval">
                  {installmentData.notice}
                </div>

              </>
            )}

            {/* Banque - Version principale et dupliquée */}
            {installmentData.bankName && (
              <>
                <div className="field-overlay bank-name">
                  {installmentData.bankName}
                </div>

              </>
            )}

            {/* Adresse de la banque - Version principale et dupliquée (nouveau champ ajouté) */}
            {installmentData.bankAddress && (
              <>
                <div className="field-overlay bank-address">
                  {installmentData.bankAddress}
                </div>

              </>
            )}

            {/* Matricule fiscal du tireur - Version principale et dupliquée */}
            <div className="field-overlay drawer-tax-id">
              {installmentData.drawerTaxId}
            </div>


            {/* Informations complètes du tireur en bas - Version principale et dupliquée */}
            <div className="field-overlay drawer-info-bottom">
              <div>{installmentData.drawerName}</div>
              <div>{installmentData.drawerAddress}</div>
              <div>Mat. Fiscal: {installmentData.drawerTaxId}</div>
            </div>
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