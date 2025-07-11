import React, { useState, useRef } from 'react';
import './TraitePrinter.css';
import traiteVideImage from '../../../assets/images/traite-vide.jpeg'; // Assure-toi que le chemin est bon

const SupplierTraitePrinter = ({ installmentData, onClose, hideControls = false, fromParent = false }) => {
    console.log('installmentData:', installmentData);

  const printRef = useRef();
  const [currentTraiteIndex, setCurrentTraiteIndex] = useState(0);

  if (!installmentData || !installmentData.installmentDetails) return null;

  const currentTraite = installmentData.installmentDetails[currentTraiteIndex];

  const formatRIB = (rib) => {
    if (!rib) return '';
    const cleanRIB = rib.replace(/\s/g, '');
    return cleanRIB.length >= 20
      ? cleanRIB.replace(/(.{2})(.{3})(.{13})(.{2})/, '$1 $2 $3 $4')
      : cleanRIB;
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
    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    let result = thousand === 1 ? 'mille' : numberToWords(thousand) + ' mille';
    if (rest) result += ' ' + numberToWords(rest);
    return result;
  };

  const formatAmountInWords = (amount) => {
    const numAmount = Math.floor(parseFloat(amount));
    const decimals = Math.round((parseFloat(amount) - numAmount) * 1000);
    let result = numberToWords(numAmount);
    result += decimals > 0
      ? ` dinars et ${numberToWords(decimals)} millimes`
      : ' dinars';
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
            @page { size: auto; margin: 0mm; }
            body { margin: 0; padding: 0; background: white; }
            .traite-container { border: none !important; box-shadow: none !important; background: transparent !important; }
            .no-print, .print-hide { display: none !important; }
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
        <body>${printRef.current.outerHTML}</body>
      </html>
    `);
    doc.close();
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  const nextTraite = () => {
    if (currentTraiteIndex < installmentData.installmentDetails.length - 1)
      setCurrentTraiteIndex(currentTraiteIndex + 1);
  };

  const prevTraite = () => {
    if (currentTraiteIndex > 0)
      setCurrentTraiteIndex(currentTraiteIndex - 1);
  };

  return (
    <div className="traite-printer-overlay">
      <div className="traite-printer-container">
        {!hideControls && (
          <div className="no-print toolbar">
            <div className="toolbar-left">
              <h3>Aperçu Traite {currentTraiteIndex + 1} / {installmentData.installmentDetails.length}</h3>
              <div className="navigation-buttons">
                <button className="nav-btn" onClick={prevTraite} disabled={currentTraiteIndex === 0}>← Précédent</button>
                <button className="nav-btn" onClick={nextTraite} disabled={currentTraiteIndex === installmentData.installmentDetails.length - 1}>Suivant →</button>
              </div>
            </div>
            <div className="toolbar-right">
              <button className="print-btn" onClick={handlePrint}>🖨️ Imprimer</button>
              <button className="close-btn" onClick={onClose}>Fermer</button>
            </div>
          </div>
        )}

        {/* Traite à imprimer */}
        <div className="traite-preview">
          <div
            ref={printRef}
            className="traite-container"
            style={{ backgroundImage: `url(${traiteVideImage})` }}
          >
            {/* Montants */}
            <div className="field-overlay amount-main">
              {parseFloat(currentTraite.amount).toLocaleString('fr-FR', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              })}
            </div>

            {/* Fournisseur (tiré) = client */}
            <div className="field-overlay client-name">{installmentData.drawerName}</div>
            <div className="field-overlay client-address">{installmentData.drawerAddress}</div>
            <div className="field-overlay client-tax-id">{installmentData.drawerTaxId}</div>

            {/* RM METALAZER (tireur) */}
            <div className="field-overlay drawer-name">{installmentData.supplierName}</div>
            <div className="field-overlay creation-place">Sfax</div>
            <div className="field-overlay creation-place-2">Sfax</div>

            {/* Dates et montants */}
            <div className="field-overlay amount-words">{formatAmountInWords(currentTraite.amount)}</div>
            <div className="field-overlay amount-repeated">{parseFloat(currentTraite.amount).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
            <div className="field-overlay creation-date">{new Date(installmentData.creationDate).toLocaleDateString('fr-FR')}</div>
            <div className="field-overlay creation-date-2">{new Date(installmentData.creationDate).toLocaleDateString('fr-FR')}</div>
            <div className="field-overlay due-date-repeated">{new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}</div>
            <div className="field-overlay due-date-repeated-2">{new Date(currentTraite.dueDate).toLocaleDateString('fr-FR')}</div>

            {/* RIB */}
            <div className="field-overlay client-rib">{formatRIB(installmentData.rip || '')}</div>
            <div className="field-overlay client-rib-2">{formatRIB(installmentData.rip || '')}</div>

            {/* Info tiré en bas */}
            <div className="field-overlay client-info-bottom">
              <div>{installmentData.drawerName}</div>
              <div>{installmentData.drawerAddress}</div>
            </div>

            {/* Optionnels */}
            {installmentData.acceptance && <div className="field-overlay acceptance">{installmentData.acceptance}</div>}
            {installmentData.notice && <div className="field-overlay aval">{installmentData.notice}</div>}
            {installmentData.bankName && <div className="field-overlay bank-name">{installmentData.bankName}</div>}
            {installmentData.bankAddress && <div className="field-overlay bank-address">{installmentData.bankAddress}</div>}
          </div>
        </div>

        {/* Infos en bas */}
        <div className="traite-info no-print">
            
          <div className="info-grid">
            <div><strong>Fournisseur:</strong> {installmentData.supplierName}</div>
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

export default SupplierTraitePrinter;
