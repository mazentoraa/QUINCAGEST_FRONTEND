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

const handlePrint = () => {
  if (fromParent || !printRef.current) return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Impression</title>
        <style>
          @page {
            size: auto;
            margin: 0mm;
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
          .no-print, .print-hide {
            display: none !important;
          }
          ${Array.from(document.styleSheets)
            .filter(sheet => !sheet.href || sheet.href.startsWith(window.location.origin))
            .map(sheet => {
              try {
                return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
              } catch (e) {
                return '';
              }
            }).join('\n')}
        </style>
      </head>
      <body>
        ${printRef.current.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
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
     {!hideControls && (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    padding: "10px 0",
    borderBottom: "1px solid #ddd"
  }} className="no-print">
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <h3 style={{ margin: 0 }}>Aperçu Traite {currentTraiteIndex + 1} / {installmentData.installmentDetails.length}</h3>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={prevTraite}
          disabled={currentTraiteIndex === 0}
          style={{
            padding: "8px 16px",
            border: "1px solid #ddd",
            background: "white",
            borderRadius: "4px",
            cursor: currentTraiteIndex === 0 ? "not-allowed" : "pointer",
            opacity: currentTraiteIndex === 0 ? 0.5 : 1
          }}
        >
          ← Précédent
        </button>
        <button
          onClick={nextTraite}
          disabled={currentTraiteIndex === installmentData.installmentDetails.length - 1}
          style={{
            padding: "8px 16px",
            border: "1px solid #ddd",
            background: "white",
            borderRadius: "4px",
            cursor: currentTraiteIndex === installmentData.installmentDetails.length - 1 ? "not-allowed" : "pointer",
            opacity: currentTraiteIndex === installmentData.installmentDetails.length - 1 ? 0.5 : 1
          }}
        >
          Suivant →
        </button>
      </div>
    </div>
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        onClick={handlePrint}
        style={{
          padding: "10px 20px",
          border: "none",
          borderRadius: "4px",
          background: "#007bff",
          color: "white",
          cursor: "pointer"
        }}
      >
        🖨️ Imprimer
      </button>
      <button
        onClick={onClose}
        style={{
          padding: "10px 20px",
          border: "none",
          borderRadius: "4px",
          background: "#6c757d",
          color: "white",
          cursor: "pointer"
        }}
      >
        Fermer
      </button>
    </div>
  </div>
)}

        {/* Aperçu de la traite */}
        <div className="traite-preview">
          <div 
            ref={printRef}
            className="traite-container"
            style={{backgroundImage: `url(${traiteVideImage})`}}
          >
       

            {/* Montants principaux - Version principale et dupliquée */}
            <div className="field-overlay amount-main">
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


            {/* Montant en lettres - Version principale et dupliquée */}
            <div className="field-overlay amount-words">
              {formatAmountInWords(currentTraite.amount)}
            </div>
          

            {/* Montant répété - Version principale et dupliquée */}
            <div className="field-overlay amount-repeated">
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

         
          </div>
        </div>

        {/* Informations de la traite en bas */}
         <div className="traite-info no-print">
          <div className="info-grid">
            <div><strong>Client:</strong> {installmentData.clientName}</div>
            <div><strong>Facture:</strong> {installmentData.numero_commande}</div>
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