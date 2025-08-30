import React, { useState, useContext, useEffect } from "react";
import { InstallmentContext } from "../contexts/InstallmentContext";
import { InvoiceContext } from "../../../contexts/InvoiceContext";
import TraitePrinter from "./TraitePrinter";
import "./InstallmentForm.css";
import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";


const InstallmentForm = () => {
  const { addInstallment, refreshInstallments } = useContext(InstallmentContext);
  const { invoices } = useContext(InvoiceContext);
  const [successMessage, setSuccessMessage] = useState("");


  // État pour les données du formulaire
  const [formData, setFormData] = useState({
    // Informations du tireur (vendeur)
    drawerName: "YUCCAINFO", // Valeur par défaut
    drawerTaxId: "1883737/D/A/M/000", // Valeur par défaut
    drawerAddress: "Sfax", // Valeur par défaut

    // Informations du tiré (acheteur/client)
    clientName: "",
    clientTaxId: "",
    clientAddress: "",

    // Informations principales
    numero_commande: "", // à la place de factureTravauxId
    numberOfInstallments: 3,
    firstDueDate: "",
    totalAmount: "",
    period: "mensuel",
    creationDate: new Date().toISOString().split("T")[0],

    // Informations additionnelles
    notice: "",
    acceptance: "",

    // Informations bancaires
    bankName: "",
    bankAddress: "", // Nouveau champ
    rip: "", // Renommé de 'rib' à 'rip'
  });

  // États pour la gestion des listes et aperçu
  const [clientsList, setClientsList] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  // Removed selectedInvoiceId state as per user request
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map period string to days integer
  const periodToDays = {
    mensuel: 30,
    trimestriel: 90,
    semestriel: 180,
    annuel: 365,
  };

  // Chargement des clients
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user ? user.token : null;

    fetch(`${API_BASE_URL}/clients/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => {
          if (!res.ok) {
            throw new Error(`Erreur HTTP ${res.status}`);
          }
        return res.json();
      })
      .then((data) => {
        const formattedClients = (data.results || data).map((client) => ({
          id: client.id,
          name: client.nom_raison_sociale || client.nom_client,
          address: client.adresse || "",
          taxId: client.numero_fiscal,
        }));
        setClientsList(formattedClients);
      })
      .catch((error) => {
        console.error("❌ Erreur lors du chargement des clients :", error);
      });
  }, []);

  // Formatage du RIP en temps réel
  const formatRIPInput = (value) => {
    // Nettoyer la valeur (enlever tous les espaces)
    const cleanValue = value.replace(/\s/g, "");

    // Limiter à 20 chiffres maximum
    const limitedValue = cleanValue.substring(0, 20);

    // Appliquer le format: XX XXX XXXXXXXXXXXXXXX XX
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

  // Effet pour mettre à jour les factures disponibles quand le client change
  useEffect(() => {
    console.log("Invoices:", invoices);
    console.log("Selected clientName:", formData.clientName);
    if (formData.clientName && formData.clientName !== "nouveau") {
      // Filter invoices from context by matching clientName or clientTaxId (case-insensitive)
      console.log(invoices)
      const availableInvoices = invoices
        .filter(
          (invoice) =>
            invoice.nom_client &&
            invoice.numero_commande.charAt(0) == 'F' && // pour choisir seulement FAC pas avoirs facture (AV-FAC) ou avoirs (AV)
            invoice.mode_paiement == ('traite' || 'mixte') &&
            formData.clientName &&
            invoice.nom_client.trim().toLowerCase() === formData.clientName.trim().toLowerCase()
        )
.map((invoice) => ({
  id: invoice.id,
  number: invoice.numero_commande || invoice.numero_facture || invoice.id || "",
  numero_commande: invoice.numero_commande || null
}));

      console.log("Filtered invoices:", availableInvoices);
      setFilteredInvoices(availableInvoices);
    } else {
      setFilteredInvoices([]);
    }
  }, [formData.clientName, formData.clientTaxId, invoices]);

  // Calcul des montants de traites
  const calculateInstallments = () => {
    if (!formData.numberOfInstallments) return [];

    const total = parseFloat(formData.totalAmount || 0);
    const count = parseInt(formData.numberOfInstallments);
    const amountPerInstallment = Math.round((total / count) * 1000) / 1000;
    const startDate = formData.firstDueDate
      ? new Date(formData.firstDueDate)
      : new Date();

    // Création des traites
    const installments = [];
    let remainingAmount = total;

    for (let i = 0; i < count; i++) {
      let dueDate = new Date(startDate);

      // Calcul de la date selon la période
      if (formData.period === "mensuel") {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (formData.period === "trimestriel") {
        dueDate.setMonth(dueDate.getMonth() + i * 3);
      } else if (formData.period === "semestriel") {
        dueDate.setMonth(dueDate.getMonth() + i * 6);
      } else if (formData.period === "annuel") {
        dueDate.setFullYear(dueDate.getFullYear() + i);
      }

      // Pour la dernière traite, ajuster pour s'assurer que le total est exact
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

    // Removed logic related to selectedInvoiceId for factureTravauxId
    if (name === "numero_commande") {
      setFormData({ ...formData, numero_commande: value });
      if (errors.numero_commande) {
        setErrors({ ...errors, numero_commande: null });
      }
      return;
    }
    // Mise à jour des données du formulaire
    // Formatage spécial pour le RIP
    if (name === "rip") {
      const formattedValue = formatRIPInput(value);
      setFormData({ ...formData, [name]: formattedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Nettoyer l'erreur si l'utilisateur corrige le champ
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  // Gestion de la sélection de client
  const handleClientSelect = (e) => {
    const selectedClientName = e.target.value;
    const selectedClient = clientsList.find(
      (client) => client.name === selectedClientName
    );

    if (selectedClient) {
      setFormData({
        ...formData,
        clientName: selectedClientName,
        clientAddress: selectedClient.address,
        clientTaxId: selectedClient.taxId,
        numero_commande: "", // Reset facture travaux id when client changes
      });
    } else {
      setFormData({
        ...formData,
        clientName: selectedClientName,
        clientAddress: "",
        clientTaxId: "",
        numero_commande: "",
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.drawerName) newErrors.drawerName = "Nom du tireur requis";
    if (!formData.clientName) newErrors.clientName = "Nom du client requis";
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

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      drawerName: "YUCCAINFO",
      drawerTaxId: "1883737/D/A/M/000",
      drawerAddress: "Sfax",
      clientName: "",
      clientTaxId: "",
      clientAddress: "",
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
      // Map formData to API expected payload
      const payload = {
      numero_commande: formData.numero_commande,

        nombre_traite: parseInt(formData.numberOfInstallments),
        date_premier_echeance: formData.firstDueDate,
        periode: periodToDays[formData.period] || 30,
        
        // Ajouter les informations supplémentaires si nécessaire
        tireur_nom: formData.drawerName,
        tireur_matricule: formData.drawerTaxId,
        tireur_adresse: formData.drawerAddress,
        nom_raison_sociale: formData.clientName,
        tire_nom: formData.clientName,
        tire_matricule: formData.clientTaxId,
        tire_adresse: formData.clientAddress,
        montant_total: parseFloat(formData.totalAmount),
        periode_str: formData.period,
        aval: formData.notice,
        acceptation: formData.acceptance,
        bank_name: formData.bankName,
        bank_address: formData.bankAddress,

        rip: formData.rip.replace(/\s/g, ''), // Enlever les espaces du RIP
        date_creation: formData.creationDate,
      };

      console.log("Submitting payload to addInstallment:", payload);

      // Appeler la fonction addInstallment du contexte
      const createdInstallment = await addInstallment(payload);

      console.log("Installment created successfully:", createdInstallment);

      // Préparer les données pour l'aperçu
      const previewInstallment = {
        ...formData,
        id: createdInstallment.id || Date.now(),
        totalAmount: parseFloat(formData.totalAmount),
        numberOfInstallments: parseInt(formData.numberOfInstallments),
        installmentDetails: installmentsList,
        status: "non_paye",
        createdAt: new Date().toISOString(),
      };

      // Afficher l'aperçu
      setPreviewData(previewInstallment);
      setShowPreview(true);

      // Rafraîchir la liste des traites dans le contexte
      if (refreshInstallments) {
        await refreshInstallments();
      }

      // Réinitialiser le formulaire après succès
      resetForm();

      // Notifier le succès
      setSuccessMessage("✅ Traite créée avec succès !");
      setTimeout(() => setSuccessMessage(""), 4000); // 4 seconds


      // Changer d'onglet vers "Voir traites" après un délai
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const event = new CustomEvent("switchInstallmentTab", {
            detail: { tab: "view" }
          });
          window.dispatchEvent(event);
        }
      }, 2000);

    } catch (error) {
      console.error("Error creating installment:", error);
      alert("Erreur lors de la création de la traite: " + (error.message || "Erreur inconnue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestionnaire d'événement pour changer d'onglet
  useEffect(() => {
    const handleTabSwitch = (e) => {
      const { tab } = e.detail;
      console.log("Changer d'onglet vers:", tab);
      // La logique de changement d'onglet sera gérée par le composant parent
    };

    window.addEventListener("switchInstallmentTab", handleTabSwitch);
    
    return () => {
      window.removeEventListener("switchInstallmentTab", handleTabSwitch);
    };
  }, []);

  return (
    <div className="installment-form">
      <h1 className="form-title">Créer des Traites</h1>
      {successMessage && (
  <div className="success-message">
    {successMessage}
  </div>
)}


      <form onSubmit={handleSubmit}>
        <div className="form-sections">
          {/* Section Informations du tireur (vendeur) */}
          <div className="form-section drawer-section">
            <h3 className="section-title">Informations du tireur (vendeur)</h3>
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

          {/* Section Informations du tiré (acheteur) */}
          <div className="form-section client-section">
            <h3 className="section-title">Informations du tiré (acheteur)</h3>
            <div className="section-content">
              <div className="form-group">
                <label>Nom/Raison sociale:</label>
                <select
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleClientSelect}
                  className={`form-input ${errors.clientName ? "error" : ""}`}
                >
                  <option value="">Sélectionner un client</option>
                  {clientsList.map((client) => (
                    <option key={client.id} value={client.name}>
                      {client.name}
                    </option>
                  ))}
                  <option value="nouveau">+ Nouveau client</option>
                </select>
                {errors.clientName && (
                  <p className="error-text">{errors.clientName}</p>
                )}
              </div>

              <div className="form-group">
                <label>Matricule fiscale:</label>
                <input
                  type="text"
                  name="clientTaxId"
                  value={formData.clientTaxId}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={
                    formData.clientName === "nouveau" ? "Saisir matricule" : ""
                  }
                />
              </div>

              <div className="form-group full-width">
                <label>Adresse:</label>
                <input
                  type="text"
                  name="clientAddress"
                  value={formData.clientAddress}
                  onChange={handleChange}
                  className="form-input"
                  placeholder={
                    formData.clientName === "nouveau" ? "Saisir adresse" : ""
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Informations principales */}
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
  disabled={!formData.clientName || formData.clientName === "nouveau"}
>
  <option value="">
    {formData.clientName
      ? "Sélectionner une facture"
      : "Sélectionner d'abord un client"}
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

        {/* Section Informations additionnelles et bancaires */}
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
                    <option value="BCT">
                      Banque Centrale de Tunisie (BCT)
                    </option>
                    <option value="STB">
                      Société Tunisienne de Banque (STB)
                    </option>
                    <option value="BNA">Banque Nationale Agricole (BNA)</option>
                    <option value="BIAT">
                      Banque Internationale Arabe de Tunisie (BIAT)
                    </option>
                    <option value="Attijari_Bank">Attijari Bank</option>
                    <option value="BT">Banque de Tunisie (BT)</option>
                    <option value="UIB">
                      Union Internationale de Banques (UIB)
                    </option>
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

        {/* Aperçu des traites */}
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
                      )}{" "}
                      DT
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

      {/* Modal d'aperçu avec impression */}
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

export default InstallmentForm;