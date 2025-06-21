import React, { useState, useRef } from 'react';
import './TraitePrinter.css';
import traiteVideImage from '../../../assets/images/traite-vide.jpeg'; // Assurez-vous que le chemin est correct


const TraitePrinter = ({ installmentData, onClose , hideControls = false , fromParent = false }) => {
  console.log("ins",installmentData)
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

  // const handlePrint = ( ) => {
  //   if (fromParent)  return; 
  //    const printContent = printRef.current;
  //    const originalBody = document.body.innerHTML;
  //    const printClone = printContent.cloneNode(true);
  //    const printContainer = document.createElement('div');
  //     printContainer.innerHTML = `
  //   <style>
  //     @page {
  //       size: auto;  /* auto est la taille de la page */
  //       margin: 0mm; /* Supprime les marges */
  //     }
  //     body {
  //       margin: 0;
  //       padding: 0;
  //       background: white;
  //     }
  //     .traite-container {
  //       border: none !important;
  //       box-shadow: none !important;
  //       background: transparent !important;
  //     }
  //     /* Cache les éléments indésirables */
  //     .no-print, .print-hide {
  //       display: none !important;
  //     }
  //   </style>
  // `;

  //    printContainer.appendChild(printClone);
  //     document.body.innerHTML = printContainer.innerHTML;
  //     setTimeout(() => {
  //     window.print();
  //     document.body.innerHTML = originalBody;
  // }, 100);

  //   // const printWindow = window.open('', '_blank');
  //   // const printContent = printRef.current.innerHTML;
    
  //   // printWindow.document.write(`
  //   //   <html>
  //   //     <head>
  //   //       <title>Traite ${installmentData.invoiceNumber}-${currentTraite.index}</title>
  //   //       <style>
  //   //         body { 
  //   //           margin: 0; 
  //   //           padding: 0; 
  //   //           font-family: Arial, sans-serif;
  //   //           background: white;
  //   //         }
  //   //         .traite-container { 
  //   //           width: 17.5cm; 
  //   //           height: 11.5cm; 
  //   //           margin: 0 auto;
  //   //           position: relative;
  //   //           background-color: #f9f9f9;
  //   //           border: 1px solid #ccc;
  //   //         }
  //   //         .field-overlay {
  //   //           position: absolute;
  //   //           font-family: Arial, sans-serif;
  //   //           color: #000;
  //   //           font-size: 12px;
  //   //           line-height: 1.2;
  //   //           z-index: 10;
  //   //         }
  //   //         .no-print { display: none !important; }
  //   //         @media print {
  //   //           body { margin: 0; padding: 0; }
  //   //           .traite-container { 
  //   //             margin: 0; 
  //   //             border: none; 
  //   //             background-color: transparent;
  //   //           }
  //   //           @page { margin: 0.5cm; size: A4 landscape; }
  //   //         }
  //   //       </style>
  //   //     </head>
  //   //     <body>
  //   //       ${printContent}
  //   //     </body>
  //   //   </html>
  //   // `);
    
  //   // printWindow.document.close();
  //   // printWindow.focus();
  //   // printWindow.print();
  //   // printWindow.close();
  // };
  const handlePrint = () => {
    if (!printRef.current) return;
  
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      const printContent = printRef.current.innerHTML;
  
 printWindow.document.write(`
  <html>
    <head>
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
       
.traite-printer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.traite-printer-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 95%;
  max-height: 95%;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toolbar-left h3 {
  margin: 0;
  color: #333;
}

.navigation-buttons {
  display: flex;
  gap: 10px;
}

.nav-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.nav-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.print-btn, .close-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.print-btn {
  background: #007bff;
  color: white;
}

.print-btn:hover {
  background: #0056b3;
}

.close-btn {
  background: #6c757d;
  color: white;
}

.close-btn:hover {
  background: #545b62;
}

.traite-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  min-height: 400px;
}

.traite-container {
  width: 17.5cm;
  height: 11.5cm;
  position: relative;
  /* Ajout de l'image de fond avec chemin absolu */
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  /* Garder une couleur de fond de secours */
  background-color: #ffffff;
  border: 2px solid #ddd;
  margin: 0 auto;
  /* Assurer que les dimensions sont fixes */
  min-width: 17.5cm;
  min-height: 11.5cm;
  max-width: 17.5cm;
  max-height: 11.5cm;
}

/* Positionnement des champs sur la traite */
.field-overlay {
  position: absolute;
  font-family: 'Arial', sans-serif;
  color: #000;
  font-size: 12px;
  line-height: 1.2;
  z-index: 10;
}

/* Style uniforme pour tous les éléments */

.amount-main {
  top: 2.5cm;
  right: 1.7cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}

/* Informations client séparées et uniformisées - Première zone */
.client-name {
  top: 3.8cm;
  left: 1cm;
  font-family: 'Arial', sans-serif;
  font-size: 10px;
  font-weight: normal;
  color: #000;
  max-width: 8cm;
}

.client-address {
  top: 4.1cm;
  left: 1cm;
  font-family: 'Arial', sans-serif;
  font-size: 10px;
  font-weight: normal;
  color: #000;
  max-width: 8cm;
}

.client-tax-id {
  top: 4.4cm;
  left: 1cm;
  font-family: 'Arial', sans-serif;
  font-size: 10px;
  font-weight: normal;
  color: #000;
  max-width: 8cm;
}


.amount-words {
  top: 5cm;
  left: 2cm;
  right: 2cm;
  text-align: center;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}


.amount-repeated {
  top: 4cm;
  right: 1.7cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}

.creation-place {
  bottom: 5.2cm;
  left: 1cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}

.creation-place-2 {
  bottom: 10cm;
  left: 9cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}

.creation-date {
  bottom: 5.2cm;
  left: 3.5cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}
.creation-date-2 {
  bottom: 9.5cm;
  left:9cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}

.due-date-repeated {
  bottom: 5.2cm;
  left: 6.5cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}

.due-date-repeated-2{
  bottom: 9.5cm;
  left: 5.5cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000; 
}

.drawer-name {
  bottom: 5.2cm;
  left: 10cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}



.client-rib {
  bottom: 4.1cm;
  left: 0.5cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
  letter-spacing: 5px;
  word-spacing: 1px;
  line-height: 1.2;
}

.client-rib-2 {
  bottom: 8.5cm;
  left: 5.3cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
  letter-spacing: 5px;
  word-spacing: 1px;
  line-height: 1.2;
}

.client-info-bottom {
  bottom: 3cm;
  right: 7cm;
  max-width: 6cm;
  text-align: left;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}



/* Acceptance et Aval avec marges limitées */
.acceptance {
  top: 8.2cm;
  left: 0.4cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
  max-width: 3.5cm;
  word-wrap: break-word;
  overflow-wrap: break-word;

}


.aval {
  top: 8.2cm;
  left: 4.5cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
  max-width: 3.5cm;
  word-wrap: break-word;
  overflow-wrap: break-word;

}



/* Champs de banque ajoutés */
.bank-name {
  top: 7cm;
  left: 12cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
}


.bank-address {
  top: 7.3cm;
  left: 12cm;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  font-weight: normal;
  color: #000;
  max-width: 8cm;
}



/* Informations de la traite */
.traite-info {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  font-size: 14px;
}

.info-grid div {
  padding: 5px 0;
}

@media print {
  .toolbar, .no-print {
    display: none !important;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
  }
  .traite-container {
    page-break-after: always;
    border: none !important;
  }
}




        /* Include all other required classes like .amount-main, .client-name etc. */
      </style>
    </head>
    <body>${printContent}</body>
  </html>
`);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 300); // Allow DOM to update
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