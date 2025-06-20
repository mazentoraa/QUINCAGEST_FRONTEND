import React, { useContext, useRef, useState } from "react";
import { InstallmentContext } from "../contexts/InstallmentContext";
import "./TraitePrinter.css";
import "./InstallmentsPrinter.css";

const InstallmentsPrinter = ({ selectedInstallment }) => {
  const { installments } = useContext(InstallmentContext);
  const [loading, setLoading] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(
    selectedInstallment ? selectedInstallment.id : ""
  );
  const [selectedTraites, setSelectedTraites] = useState([]);
  const printRef = useRef(null);

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
      if (ten === 7) return "soixante-" + teens[one];
      if (ten === 9) return "quatre-vingt-" + teens[one];
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
    const thousand = Math.floor(num / 1000);
    const rest = num % 1000;
    let result = thousand === 1 ? "mille" : numberToWords(thousand) + " mille";
    if (rest) result += " " + numberToWords(rest);
    return result;
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

  const currentInstallment = installments.find(
    (i) => String(i.id) === String(selectedInstallmentId)
  );
  const allTraitesSelected =
    Array.isArray(currentInstallment?.traites) &&
    selectedTraites.length === currentInstallment.traites.length;
  console.log("hhhh", currentInstallment);

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
    const printClone = printRef.current.cloneNode(true);
    const originalBody = document.body.innerHTML;
    const printContainer = document.createElement("div");
    printContainer.innerHTML = `
      <style>
        @page { size: auto; margin: 0mm; }
        body { margin: 0; padding: 0; background: white; }
        .traite-container { border: none !important; box-shadow: none !important; background: transparent !important; }
        .no-print, .print-hide { display: none !important; }
      </style>
    `;
    printContainer.appendChild(printClone);
    document.body.innerHTML = printContainer.innerHTML;
    setTimeout(() => {
      window.print();
      document.body.innerHTML = originalBody;
    }, 100);
  };

  if (installments.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucune traite n'est disponible pour l'impression.</p>
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
              Facture #{item.invoiceNumber} - {item.clientName}
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
              currentInstallment.traites.map((inst,index) => (
                <div key={index} className="trait-item">
                  <div className="trait-left">
                    <input
                      type="checkbox"
                      id={`traite-${index}`}
                      checked={selectedTraites.includes(index)}
                      onChange={() => handleTraiteToggle(index)}
                    />
                    <label htmlFor={`traite-${index}`}>
                      <strong>Traite #{index+1}</strong>:{" "}
                      {parseFloat(inst.montant).toLocaleString("fr-FR", {
                        minimumFractionDigits: 3,
                      })}{" "}
                      DT
                    </label>
                  </div>
                  <div className="trait-right">
                    <span className="due-date">
                      Échéance:{" "}
                      {new Date(inst.date_echeance).toLocaleDateString("fr-FR")}
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
            className={`print-button \${loading ? 'loading' : ''}`}
          >
            {loading ? "Génération en cours..." : "Imprimer les traites"}
          </button>
        </>
      )}

      <div style={{ display: "none" }}>
        <div ref={printRef}>
          {(currentInstallment?.traites || [])
            .filter((inst) => selectedTraites.includes(inst.index))
            .map((inst) => (
              <div key={inst.index} className="print-traite">
                <div className="traite-container">
                  <div className="field-overlay amount-main">
                    {parseFloat(inst.amount).toLocaleString("fr-FR", {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })}
                  </div>
                  {/* Add other fields similarly if needed */}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default InstallmentsPrinter;
