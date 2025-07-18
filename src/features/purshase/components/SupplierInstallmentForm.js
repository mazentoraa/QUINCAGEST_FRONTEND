import React, { useState, useContext, useEffect } from "react";
// Contexts for supplier installments (to be created)
// import { SupplierInstallmentContext } from "../contexts/SupplierInstallmentContext";
// import { SupplierInvoiceContext } from "../../../contexts/SupplierInvoiceContext";
import TraitePrinter from "./TraitePrinter";
import "../../installments/components/InstallmentForm.css";
import axios from 'axios';
import FournisseurService from "../Services/FournisseurService";
import FactureAchatMatiereService from "../Services/FactureAchatMatiereService";
import SupplierInstallmentService from "../Services/SupplierInstallmentService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const SupplierInstallmentForm = () => {
  // Replace with supplier context when available
  // const { addSupplierInstallment, refreshSupplierInstallments } = useContext(SupplierInstallmentContext);
  // const { supplierInvoices } = useContext(SupplierInvoiceContext);
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    drawerName: "RM METALASER", // Default value
    drawerTaxId: "191 1419B/A/M/000", // Default value
    drawerAddress: "Sfax", // Default value
    supplierName: "",
    supplierTaxId: "",
    supplierAddress: "",
    numero_commande: "",
    numberOfInstallments: 3,
    firstDueDate: "",
    totalAmount: "",
    period: "mensuel",
    creationDate: new Date().toISOString().split("T")[0],
    notice: "",
    acceptance: "",
    bankName: "",
    bankAddress: "",
    rip: "",
  });

  const [suppliersList, setSuppliersList] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const periodToDays = {
    mensuel: 30,
    trimestriel: 90,
    semestriel: 180,
    annuel: 365,
  };

  // Charger la liste des fournisseurs existants (comme dans FactureMatiere)
  useEffect(() => {
    const fetchFournisseurs = async () => {
      try {
        const data = await FournisseurService.getAll();
        let list = [];
        if (data && Array.isArray(data.results)) {
          list = data.results;
        } else if (Array.isArray(data)) {
          list = data;
        }
        setSuppliersList(list.map(f => ({
          id: f.id,
          name: f.nom_raison_sociale || f.nom_fournisseur || f.nom,
          address: f.adresse || "",
          taxId: f.numero_fiscal || f.num_reg_fiscal || "",
        })));
      } catch {
        setSuppliersList([]);
      }
    };
    fetchFournisseurs();
  }, []);

  // Format RIP
  const formatRIPInput = (value) => {
    const cleanValue = value.replace(/\s/g, "");
    const limitedValue = cleanValue.substring(0, 20);
    if (limitedValue.length <= 2) {
      return limitedValue;
    } else if (limitedValue.length <= 5) {
      return limitedValue.replace(/(.{2})(.*)/, "$1 $2");
    } else if (limitedValue.length <= 18) {
      return limitedValue.replace(/(.{2})(.{3})(.*)/, "$1 $2 $3");
    } else {
      return limitedValue.replace(/(.{2})(.{3})(.{13})(.*)/, "$1 $2 $3 $4");
    }
  };

  // Update invoices when supplier changes (replace with supplierInvoices when available)
  useEffect(() => {
    // Replace with supplierInvoices context
    const supplierInvoices = [];
    if (formData.supplierName && formData.supplierName !== "nouveau") {
      const availableInvoices = supplierInvoices
        .filter(
          (invoice) =>
            invoice.nom_fournisseur &&
            invoice.numero_commande.charAt(0) == 'F' && // pour choisir seulement FAC pas avoirs (AV)
            invoice.mode_paiement == ('traite' || 'mixte') &&
            formData.supplierName &&
            invoice.nom_fournisseur.trim().toLowerCase() === formData.supplierName.trim().toLowerCase()
        )
        .map((invoice) => ({
          id: invoice.id,
          number: invoice.numero_commande || invoice.numero_facture || invoice.id || "",
          numero_commande: invoice.numero_commande || null
        }));
      setFilteredInvoices(availableInvoices);
    } else {
      setFilteredInvoices([]);
    }
  }, [formData.supplierName, formData.supplierTaxId]);

  // Charger les factures liées au fournisseur sélectionné
  useEffect(() => {
    const fetchFactures = async () => {
      if (formData.supplierName && formData.supplierName !== "nouveau") {
        try {
          const allFactures = await FactureAchatMatiereService.getAll();
          // On suppose que le champ du fournisseur dans la facture est nom, nom_raison_sociale ou nom_fournisseur
          const filtered = allFactures.filter(f => {
            const fournisseur = f.fournisseur || f.nom_raison_sociale || f.nom_fournisseur || f.nom;
            return fournisseur && fournisseur.trim().toLowerCase() === formData.supplierName.trim().toLowerCase();
          });
          setFilteredInvoices(filtered.map(f => ({
            id: f.id,
            number: f.numero_commande || f.numero_facture || f.numero || f.id || "",
            numero_commande: f.numero_commande || f.numero_facture || f.numero || f.id || null
          })));
        } catch {
          setFilteredInvoices([]);
        }
      } else {
        setFilteredInvoices([]);
      }
    };
    fetchFactures();
  }, [formData.supplierName, formData.supplierTaxId]);

  // Calculate installments
  const calculateInstallments = () => {
    if (!formData.numberOfInstallments) return [];
    const total = parseFloat(formData.totalAmount || 0);
    const count = parseInt(formData.numberOfInstallments);
    const amountPerInstallment = Math.round((total / count) * 1000) / 1000;
    const startDate = formData.firstDueDate
      ? new Date(formData.firstDueDate)
      : new Date();
    const installments = [];
    let remainingAmount = total;
    for (let i = 0; i < count; i++) {
      let dueDate = new Date(startDate);
      if (formData.period === "mensuel") {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (formData.period === "trimestriel") {
        dueDate.setMonth(dueDate.getMonth() + i * 3);
      } else if (formData.period === "semestriel") {
        dueDate.setMonth(dueDate.getMonth() + i * 6);
      } else if (formData.period === "annuel") {
        dueDate.setFullYear(dueDate.getFullYear() + i);
      }
      let amount = i === count - 1 ? remainingAmount : amountPerInstallment;
      remainingAmount -= amount;
      installments.push({
        index: i + 1,
        amount: amount.toFixed(3),
        dueDate: dueDate.toISOString().split("T")[0],
        status: "non_paye",
      });
    }
    return installments;
  };

  const installmentsList = calculateInstallments();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "numero_commande") {
      setFormData({ ...formData, numero_commande: value });
      if (errors.numero_commande) {
        setErrors({ ...errors, numero_commande: null });
      }
      return;
    }
    if (name === "rip") {
      const formattedValue = formatRIPInput(value);
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // Supplier select
  const handleSupplierSelect = (e) => {
    const selectedSupplierName = e.target.value;
    const selectedSupplier = suppliersList.find(
      (supplier) => supplier.name === selectedSupplierName
    );
    if (selectedSupplier) {
      setFormData({
        ...formData,
        supplierName: selectedSupplierName,
        supplierAddress: selectedSupplier.address,
        supplierTaxId: selectedSupplier.taxId,
        numero_commande: "",
      });
    } else {
      setFormData({
        ...formData,
        supplierName: selectedSupplierName,
        supplierAddress: "",
        supplierTaxId: "",
        numero_commande: "",
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.drawerName) newErrors.drawerName = "Nom du tireur requis";
    if (!formData.supplierName) newErrors.supplierName = "Nom du fournisseur requis";
    if (!formData.numero_commande)
      newErrors.numero_commande = "Numéro de commande requis";
    if (
      !formData.totalAmount ||
      isNaN(formData.totalAmount) ||
      parseFloat(formData.totalAmount) <= 0
    ) {
      newErrors.totalAmount = "Montant valide requis";
    }
    if (!formData.numberOfInstallments || formData.numberOfInstallments < 1) {
      newErrors.numberOfInstallments = "Nombre de traites valide requis";
    }
    if (!formData.firstDueDate)
      newErrors.firstDueDate = "Date de première échéance requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (validate()) {
      const installmentDetails = calculateInstallments();
      const previewInstallment = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        numberOfInstallments: parseInt(formData.numberOfInstallments),
        installmentDetails,
        status: "non_paye",
        createdAt: new Date().toISOString(),
      };
      setPreviewData(previewInstallment);
      setShowPreview(true);
    }
  };

  const resetForm = () => {
    setFormData({
      drawerName: "RM METALASER",
      drawerTaxId: "191 1419B/A/M/000",
      drawerAddress: "Sfax",
      supplierName: "",
      supplierTaxId: "",
      supplierAddress: "",
      numero_commande: "",
      numberOfInstallments: 3,
      firstDueDate: "",
      totalAmount: "",
      period: "mensuel",
      creationDate: new Date().toISOString().split("T")[0],
      notice: "",
      acceptance: "",
      bankName: "",
      bankAddress: "",
      rip: "",
    });
    setErrors({});
    setFilteredInvoices([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Map formData to API expected payload (ajusté pour compatibilité backend)
      const payload = {
        numero_commande: formData.numero_commande,
        numero_facture: formData.numero_commande, // Correction pour l'API backend
        nombre_traite: parseInt(formData.numberOfInstallments),
        date_premier_echeance: formData.firstDueDate,
        periode: periodToDays[formData.period] || 30,
        tireur_nom: formData.drawerName,
        tireur_matricule: formData.drawerTaxId,
        tireur_adresse: formData.drawerAddress,
        nom_raison_sociale: formData.supplierName,
        tire_nom: formData.supplierName,
        tire_matricule: formData.supplierTaxId,
        tire_adresse: formData.supplierAddress,
        montant_total: parseFloat(formData.totalAmount),
        periode_str: formData.period,
        aval: formData.notice,
        acceptation: formData.acceptance,
        bank_name: formData.bankName,
        bank_address: formData.bankAddress,
        rip: formData.rip.replace(/\s/g, ''),
        date_creation: formData.creationDate,
      };
      // Utilise le service pour créer le plan de traite fournisseur
      const createdInstallment = await SupplierInstallmentService.createPlan(payload);
      const previewInstallment = {
        ...formData,
        id: createdInstallment.id || Date.now(),
        totalAmount: parseFloat(formData.totalAmount),
        numberOfInstallments: parseInt(formData.numberOfInstallments),
        installmentDetails: calculateInstallments(),
        status: "non_paye",
        createdAt: new Date().toISOString(),
      };
      setPreviewData(previewInstallment);
      setShowPreview(true);
      // Rafraîchir la liste des traites si possible
      if (window.refreshSupplierInstallments) {
        await window.refreshSupplierInstallments();
      }
      resetForm();
      setSuccessMessage("✅ Traite fournisseur créée avec succès !");
      setTimeout(() => setSuccessMessage(""), 4000);
      setTimeout(() => {
        setShowPreview(false);
        setPreviewData(null);
        if (typeof window !== "undefined") {
          const event = new CustomEvent("switchSupplierInstallmentTab", {
            detail: { tab: "view" }
          });
          window.dispatchEvent(event);
        }
      }, 2000);
    } catch (error) {
      console.error("Error creating supplier installment:", error);
      alert("Erreur lors de la création de la traite fournisseur: " + (error.message || "Erreur inconnue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleTabSwitch = (e) => {
      const { tab } = e.detail;
      // Logic for tab switch handled by parent
    };
    window.addEventListener("switchSupplierInstallmentTab", handleTabSwitch);
    return () => {
      window.removeEventListener("switchSupplierInstallmentTab", handleTabSwitch);
    };
  }, []);

  return (
    <div className="installment-form">
      <h1 className="form-title">Créer des Traites Fournisseur</h1>
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          {/* Drawer (buyer) info */}
          <div className="form-section drawer-section">
            <h3 className="section-title">Informations du tireur (acheteur)</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Nom/Raison sociale:</label>
                <input
                  type="text"
                  name="drawerName"
                  value={formData.drawerName}
                  onChange={handleChange}
                  className={`form-input ${errors.drawerName ? "error" : ""}`}
                />
                {errors.drawerName && (
                  <p className="error-text">{errors.drawerName}</p>
                )}
              </div>
              <div className="form-group">
                <label>Matricule fiscale:</label>
                <input
                  type="text"
                  name="drawerTaxId"
                  value={formData.drawerTaxId}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group full-width">
                <label>Adresse:</label>
                <input
                  type="text"
                  name="drawerAddress"
                  value={formData.drawerAddress}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
          {/* Supplier (tiré) info */}
          <div className="form-section client-section">
            <h3 className="section-title">Informations du fournisseur (vendeur)</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Nom/Raison sociale:</label>
                <select
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleSupplierSelect}
                  className={`form-input ${errors.supplierName ? "error" : ""}`}
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliersList.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                  <option value="nouveau">+ Nouveau fournisseur</option>
                </select>
                {errors.supplierName && (
                  <p className="error-text">{errors.supplierName}</p>
                )}
              </div>
              <div className="form-group">
                <label>Matricule fiscale:</label>
                <input
                  type="text"
                  name="supplierTaxId"
                  value={formData.supplierTaxId}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={
                    formData.supplierName === "nouveau" ? "Saisir matricule" : ""
                  }
                />
              </div>
              <div className="form-group full-width">
                <label>Adresse:</label>
                <input
                  type="text"
                  name="supplierAddress"
                  value={formData.supplierAddress}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={
                    formData.supplierName === "nouveau" ? "Saisir adresse" : ""
                  }
                />
              </div>
            </div>
          </div>
        </div>
        {/* Main info */}
        <div className="form-section main-info-section">
          <h3 className="section-title">Informations principales</h3>
          <div className="main-info-grid">
            <div className="form-group">
              <label>Numéro de Facture:</label>
              <select
                name="numero_commande"
                value={formData.numero_commande}
                onChange={handleChange}
                className={`form-input ${errors.numero_commande ? "error" : ""}`}
                disabled={!formData.supplierName || formData.supplierName === "nouveau"}
              >
                <option value="">
                  {formData.supplierName
                    ? "Sélectionner une facture"
                    : "Sélectionner d'abord un fournisseur"}
                </option>
                {filteredInvoices.map((invoice) => (
                  <option key={invoice.numero_commande} value={invoice.numero_commande}>
                    {invoice.number}
                  </option>
                ))}
              </select>
              {errors.numero_commande && (
                <p className="error-text">{errors.numero_commande}</p>
              )}
            </div>
            <div className="form-group">
              <label>Nombre de Traites:</label>
              <input
                type="number"
                name="numberOfInstallments"
                value={formData.numberOfInstallments}
                onChange={handleChange}
                min="1"
                max="24"
                className={`form-input ${errors.numberOfInstallments ? "error" : ""}`}
              />
              {errors.numberOfInstallments && (
                <p className="error-text">{errors.numberOfInstallments}</p>
              )}
            </div>
            <div className="form-group">
              <label>Date de Première échéance:</label>
              <input
                type="date"
                name="firstDueDate"
                value={formData.firstDueDate}
                onChange={handleChange}
                className={`form-input ${errors.firstDueDate ? "error" : ""}`}
              />
              {errors.firstDueDate && (
                <p className="error-text">{errors.firstDueDate}</p>
              )}
            </div>
            <div className="form-group">
              <label>Montant total:</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                min="0"
                step="0.001"
                className={`form-input ${errors.totalAmount ? "error" : ""}`}
                placeholder="0.000"
              />
              {errors.totalAmount && (
                <p className="error-text">{errors.totalAmount}</p>
              )}
            </div>
            <div className="form-group">
              <label>Période:</label>
              <select
                name="period"
                value={formData.period}
                onChange={handleChange}
                className="form-input"
              >
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="semestriel">Semestriel</option>
                <option value="annuel">Annuel</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date de création:</label>
              <input
                type="date"
                name="creationDate"
                value={formData.creationDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>
        {/* Additional and bank info */}
        <div className="form-sections">
          <div className="form-section additional-info-section">
            <h3 className="section-title">Informations additionnelles</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Aval:</label>
                <textarea
                  name="notice"
                  value={formData.notice}
                  onChange={handleChange}
                  rows="3"
                  className="form-input"
                  placeholder="Informations sur l'aval..."
                ></textarea>
              </div>
              <div className="form-group">
                <label>Acceptation:</label>
                <textarea
                  name="acceptance"
                  value={formData.acceptance}
                  onChange={handleChange}
                  rows="3"
                  className="form-input"
                  placeholder="Informations sur l'acceptation..."
                ></textarea>
              </div>
            </div>
          </div>
          <div className="form-section bank-info-section">
            <h3 className="section-title">Informations bancaires</h3>
            <div className="bank-info-content">
              <div className="bank-info-row">
                <div className="form-group">
                  <label>Banque:</label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="">-- Sélectionnez une banque --</option>
                    <option value="BCT">Banque Centrale de Tunisie (BCT)</option>
                    <option value="STB">Société Tunisienne de Banque (STB)</option>
                    <option value="BNA">Banque Nationale Agricole (BNA)</option>
                    <option value="BIAT">Banque Internationale Arabe de Tunisie (BIAT)</option>
                    <option value="Attijari_Bank">Attijari Bank</option>
                    <option value="BT">Banque de Tunisie (BT)</option>
                    <option value="UIB">Union Internationale de Banques (UIB)</option>
                    <option value="Amen Bank">Amen Bank</option>
                    <option value="ATB">Arab Tunisian Bank (ATB)</option>
                    <option value="BTK">Banque Tuniso-Koweitienne (BTK)</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Adresse de la banque:</label>
                  <input
                    type="text"
                    name="bankAddress"
                    value={formData.bankAddress}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Adresse de la banque..."
                  />
                </div>
              </div>
              <div className="form-group rip-group">
                <label>RIB :</label>
                <input
                  type="text"
                  name="rip"
                  value={formData.rip}
                  onChange={handleChange}
                  maxLength="30"
                  className="form-input rip-input"
                  placeholder="01 234 567890213456 78"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Installment preview */}
        {formData.totalAmount && formData.numberOfInstallments > 0 && (
          <div className="installment-preview">
            <h3>Aperçu des Traites</h3>
            <div className="table-responsive">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Montant (DT)</th>
                    <th>Date d'échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {installmentsList.map((inst) => (
                    <tr key={inst.index}>
                      <td className="font-bold">Traite {inst.index}</td>
                      <td className="amount">
                        {parseFloat(inst.amount).toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td>
                        {new Date(inst.dueDate).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        <span className="status-badge non-paye">Non payé</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td className="font-bold">Total:</td>
                    <td className="amount font-bold">
                      {parseFloat(formData.totalAmount).toLocaleString(
                        "fr-FR",
                        {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        }
                      )} DT
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        <div className="form-actions">
          <button type="button" onClick={handlePreview} className="preview-btn">
            📄 Aperçu et Impression
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "⏳ Enregistrement..." : "💾 Enregistrer et Voir Traites"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="reset-btn"
            disabled={isSubmitting}
          >
            🔄 Réinitialiser
          </button>
        </div>
      </form>
      {showPreview && previewData && (
        <TraitePrinter
          installmentData={previewData}
          onClose={() => {
            setShowPreview(false);
            setPreviewData(null);
          }}
        />
      )}
    </div>
  );
};

export default SupplierInstallmentForm;
