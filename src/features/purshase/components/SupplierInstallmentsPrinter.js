import React, { useContext, useRef, useState } from "react";
import { SupplierInstallmentContext } from "../contexts/SupplierInstallmentContext";
import "../../installments/components/TraitePrinter.css";
import "../../installments/components/InstallmentsPrinter.css";

const SupplierInstallmentsPrinter = ({ selectedInstallment }) => {
  const { installments } = useContext(SupplierInstallmentContext);
  const [loading, setLoading] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(
    selectedInstallment ? selectedInstallment.id : ""
  );
  const [selectedTraites, setSelectedTraites] = useState([]);
  const printRef = useRef(null);


  // Mapping fournisseur → client pour impression
// Fonction complète mapSupplierToClientFields avec tri des traites
const mapSupplierToClientFields = (inst) => {
  if (!inst) return {}; // Protection si inst est undefined ou null

  return {
    ...inst,

    // ✅ Tiré (client) = RM METALAZER
    clientName: "RM METALAZER",
    clientAddress: "Sfax",
    clientTaxId: "191 1419B/A/M/000",

    // ✅ Tireur (émetteur) = fournisseur
    drawerName: inst.fournisseur_nom || inst.supplierName || inst.nom_raison_sociale || '',
    drawerAddress: inst.fournisseurAdresse || inst.drawerAddress || "Adresse non spécifiée",
    drawerTaxId: inst.fournisseur_matricule || inst.supplierTaxId || inst.matricule_fiscal || '',

    // ✅ Informations liées à la facture
    invoiceNumber: inst.numero_facture || inst.numero_commande || '',
    bankName: inst.bank_name || inst.bankName || '',
    bankAddress: inst.bank_address || inst.bankAddress || '',
    rip: inst.rip || '',

    // ✅ Traitement des traites avec tri par date d'échéance
    traites: (inst.traites ? inst.traites : [])
      .map((traite) => ({
        ...traite,
        montant: traite.montant,
        date_echeance: traite.date_echeance,
        status: (traite.status || "NON_PAYEE").toUpperCase(),
      }))
      .sort((a, b) => {
        // Trier par date d'échéance croissante (plus proche en premier)
        const dateA = new Date(a.date_echeance);
        const dateB = new Date(b.date_echeance);
        return dateA - dateB;
      }),
  };
};


  const formatRIB = (rib) => {
    if (!rib) return "";
    const cleanRIB = rib.replace(/\s/g, "");
    return cleanRIB.length >= 20
      ? cleanRIB.replace(/(.{2})(.{3})(.{13})(.{2})/, "$1 $2 $3 $4")
      : cleanRIB;
  };

  const numberToWords = (num) => {
    const ones = [
      "",
      "un",
      "deux",
      "trois",
      "quatre",
      "cinq",
      "six",
      "sept",
      "huit",
      "neuf",
    ];
    const teens = [
      "dix",
      "onze",
      "douze",
      "treize",
      "quatorze",
      "quinze",
      "seize",
      "dix-sept",
      "dix-huit",
      "dix-neuf",
    ];
    const tens = [
      "",
      "",
      "vingt",
      "trente",
      "quarante",
      "cinquante",
      "soixante",
      "soixante-dix",
      "quatre-vingt",
      "quatre-vingt-dix",
    ];
    if (num === 0) return "zéro";
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      if (ten === 7) return "soixante-" + teens[one]; // 70–79
      if (ten === 9) return "quatre-vingt-" + teens[one]; // 90–99
      return tens[ten] + (one ? "-" + ones[one] : "");
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const rest = num % 100;
      return (
        (hundred === 1 ? "cent" : ones[hundred] + " cent") +
        (rest ? " " + numberToWords(rest) : "")
      );
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const rest = num % 1000;
      let result =
        thousand === 1 ? "mille" : numberToWords(thousand) + " mille";
      if (rest) result += " " + numberToWords(rest);
      return result;
    }
    return "nombre trop grand";
  };

  const formatAmountInWords = (amount) => {
    const numAmount = Math.floor(parseFloat(amount));
    const decimals = Math.round((parseFloat(amount) - numAmount) * 1000);
    let result = numberToWords(numAmount);
    result +=
      decimals > 0
        ? ` dinars et ${numberToWords(decimals)} millimes`
        : " dinars";
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const formatDateFR = (isoDateStr) => {
    if (!isoDateStr || !isoDateStr.includes("-")) return "undefined";
    const [year, month, day] = isoDateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const currentInstallmentRaw = installments.find(
    (i) => String(i.id) === String(selectedInstallmentId)
  );
 console.log("Données brutes fournisseur :", currentInstallmentRaw);
console.log("drawerAddress:", mapSupplierToClientFields(currentInstallmentRaw).drawerAddress);



  const currentInstallment = currentInstallmentRaw ? mapSupplierToClientFields(currentInstallmentRaw) : null;
  const allTraitesSelected =
    Array.isArray(currentInstallment?.traites) &&
    selectedTraites.length === currentInstallment.traites.length;

  const handleTraiteToggle = (traitIndex) => {
    setSelectedTraites((prev) =>
      prev.includes(traitIndex)
        ? prev.filter((index) => index !== traitIndex)
        : [...prev, traitIndex]
    );
  };

  const handleSelectAllToggle = () => {
    if (!currentInstallment?.traites) return;
    const allIndexes = currentInstallment.traites.map((_, i) => i);
    setSelectedTraites(
      selectedTraites.length === allIndexes.length ? [] : allIndexes
    );
  };

  const handleInstallmentChange = (installmentId) => {
    setSelectedInstallmentId(installmentId);
    setSelectedTraites([]);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    setTimeout(() => {
      const printWindow = window.open("", "_blank");
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

  return (
    <div className="printer-container">
      <h2>Imprimer les Traites Fournisseur</h2>
      <div className="select-container">
        <label>Sélectionner un plan de traites</label>
        <select
          value={selectedInstallmentId}
          onChange={(e) => handleInstallmentChange(e.target.value)}
          className="installment-select"
        >
          <option value="">-- Sélectionner un plan --</option>
          {installments.map((item) => (
            <option key={item.id} value={item.id}>
              Facture #{item.numero_facture || item.numero_commande} - {item.fournisseur_nom || item.supplierName || item.nom_raison_sociale}
            </option>
          ))}
        </select>
      </div>

      {currentInstallment && (
        <>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="select-all-checkbox"
              checked={allTraitesSelected}
              onChange={handleSelectAllToggle}
            />
            <label htmlFor="select-all-checkbox">
              Imprimer toutes les traites
            </label>
          </div>

          <div className="installment-details">
            {Array.isArray(currentInstallment.traites) &&
              currentInstallment.traites.map((inst, index) => (
                <div key={index} className="trait-item">
                  <div className="trait-left">
                    <input
                      type="checkbox"
                      id={`traite-${index}`}
                      checked={selectedTraites.includes(index)}
                      onChange={() => handleTraiteToggle(index)}
                    />
                    <label htmlFor={`traite-${index}`}>
                      <strong>Traite #{index + 1}</strong>: {parseFloat(inst.montant).toLocaleString("fr-FR", { minimumFractionDigits: 3 })} DT
                    </label>
                  </div>
                  <div className="trait-right">
                    <span className="due-date">
                      Échéance: {new Date(inst.date_echeance).toLocaleDateString("fr-FR")}
                    </span>
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
            className={`print-button${loading ? ' loading' : ''}`}
          >
            {loading ? "Génération en cours..." : "Imprimer les traites"}
          </button>
        </>
      )}

      <div className="traite-preview">
        <div ref={printRef}>
          {selectedTraites.map((index) => {
            const inst = currentInstallment.traites[index];
            const currentTraite = {
              amount: inst.montant,
              dueDate: inst.date_echeance,
            };
            return (
              <div
                className="traite-container"
                style={{
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                  backgroundPosition: "center",
                  width: "17.5cm",
                  height: "11.5cm",
                  position: "relative",
                  border: "2px solid #ddd",
                  pageBreakAfter: "always",
                }}
                key={index}
              >
                <div className="field-overlay amount-main">
                  {parseFloat(currentTraite.amount).toLocaleString("fr-FR", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
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
                  {formatAmountInWords(currentTraite.amount)}
                </div>
                <div className="field-overlay amount-repeated">
                  {parseFloat(currentTraite.amount).toLocaleString("fr-FR", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}
                </div>
               <div className="field-overlay creation-place">
  {currentInstallment.clientAddress || "Adresse non spécifiée"}
</div>
<div className="field-overlay creation-place-2">
  {currentInstallment.clientAddress || "Adresse non spécifiée"}
</div>

                  <div className="field-overlay creation-date">
                  {new Date(currentInstallment.date_emission).toLocaleDateString(
                    "fr-FR"
                  ) ?? "undefined"}
                </div>
                <div className="field-overlay creation-date-2">
                {new Date(currentInstallment.date_emission).toLocaleDateString(
                    "fr-FR"
                  ) ?? "undefined"}
                </div>
                <div className="field-overlay due-date-repeated">
                  {formatDateFR(currentTraite.dueDate)}
                </div>
                <div className="field-overlay due-date-repeated-2">
                  {formatDateFR(currentTraite.dueDate)}
                </div>
                <div className="field-overlay drawer-name">
                  {currentInstallment.drawerName ?? "RM METALAZER"}
                </div>
                <div className="field-overlay client-rib">
                  {formatRIB(currentInstallment.rip || "") ?? "undefined"}
                </div>
                <div className="field-overlay client-rib-2">
                  {formatRIB(currentInstallment.rip || "") ?? "undefined"}
                </div>
                <div className="field-overlay client-info-bottom">
                  <div>{currentInstallment.clientName ?? "undefined"}</div>
                  <div>{currentInstallment.clientAddress ?? "undefined"}</div>
                </div>
                {currentInstallment.acceptance && (
                  <div className="field-overlay acceptance">
                    {currentInstallment.acceptance ?? "undefined"}
                  </div>
                )}
                {currentInstallment.notice && (
                  <div className="field-overlay aval">
                    {currentInstallment.notice ?? "undefined"}
                  </div>
                )}
                <div className="field-overlay bank-name">
                  {currentInstallment.bankName || "Banque non spécifiée"}
                </div>
                <div className="field-overlay bank-address">
                  {currentInstallment.bankAddress || "Adresse non spécifiée"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SupplierInstallmentsPrinter;
