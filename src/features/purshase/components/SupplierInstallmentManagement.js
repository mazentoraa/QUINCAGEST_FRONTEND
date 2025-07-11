import React, { useState, useContext } from "react";
import { SupplierInstallmentContext } from "../contexts/SupplierInstallmentContext";
import SupplierInstallmentForm from "./SupplierInstallmentForm";
import SupplierInstallmentDetails from "./SupplierInstallmentDetails";
import SupplierInstallmentsPrinter from "./SupplierInstallmentsPrinter";
import { Popconfirm, message, Row, Col, Card, Typography } from "antd";
import {
  FileDoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import "../../installments/components/InstallmentManagement.css";
import SupplierInstallmentService from "../Services/SupplierInstallmentService";

const { Title, Text } = Typography;

const SupplierInstallmentManagement = () => {
  const { installments, refreshInstallments } = useContext(SupplierInstallmentContext);
  const [activeTab, setActiveTab] = useState("create");
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");

  const today = new Date();

  const filteredInstallments = installments
    .map((inst) => {
      const dueDate = new Date(inst.date_premier_echeance);
      if (
        inst.status === "NON_PAYEE" &&
        inst.date_premier_echeance &&
        dueDate < today
      ) {
        return { ...inst, status: "EN_RETARD" };
      }
      return inst;
    })
    .filter((inst) => {
      const supplierName = inst.nom_raison_sociale || inst.supplierName || "";
      const invoiceNumber = inst.numero_facture || inst.numero_commande || "";
      const matchesSearch =
        supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
      // Correction du filtre banque : tester tous les champs possibles
      const matchesBank =
        bankFilter === "all" ||
        inst.bankName === bankFilter ||
        inst.banque === bankFilter ||
        inst.bank_name === bankFilter ||
        inst.adresse_banque === bankFilter;
      return matchesSearch && matchesStatus && matchesBank;
    });

  // Statistiques
  const totalInstallments = installments.length;
  const totalAmount = installments.reduce(
    (sum, inst) => sum + (parseFloat(inst.montant_total) || 0),
    0
  );
  const countPayee = installments.filter(inst => inst.status === "PAYEE").length;
  const countNonPayee = installments.filter(inst => inst.status === "NON_PAYEE").length;
  const countPartiellementPayee = installments.filter(inst => inst.status === "PARTIELLEMENT_PAYEE").length;
  const countEnRetard = installments.filter(inst => {
    if (inst.status === "NON_PAYEE" && inst.date_premier_echeance) {
      const dueDate = new Date(inst.date_premier_echeance);
      return dueDate < today;
    }
    return false;
  }).length;

  const statusLabels = {
    PAYEE: "Payé",
    NON_PAYEE: "Non payé",
    PARTIELLEMENT_PAYEE: "Partiellement payé",
    EN_RETARD: "En retard",
  };

  const handleDelete = async (id) => {
    try {
      await SupplierInstallmentService.deletePlan(id);
      message.success("Plan de traites fournisseur supprimé avec succès !");
      if (refreshInstallments) await refreshInstallments();
    } catch (error) {
      message.error("Erreur lors de la suppression du plan de traites.");
      console.error(error);
    }
  };

  // Fonction de mise à jour harmonisée (mapping + appel API)
  const handleUpdateInstallment = async (updatedInstallment) => {
    const traitesPayload = (updatedInstallment.traites || [])
      .filter(detail => detail.id !== undefined && detail.id !== null)
      .map((detail) => ({
        id: detail.id,
        montant: Number(detail.amount),
        date_echeance: detail.dueDate,
        // Correction : status toujours PAYEE ou NON_PAYEE
        status: (detail.status === "PAYEE" ? "PAYEE" : "NON_PAYEE"),
      }));
    const globalStatus = updatedInstallment.status;
    try {
      await SupplierInstallmentService.updatePlan(updatedInstallment.id, {
        traites: traitesPayload,
        status: globalStatus,
      });
      if (refreshInstallments) await refreshInstallments();
      message.success("Statut des traites mis à jour avec succès.");
    } catch (e) {
      // Affiche le message d'erreur détaillé du backend si disponible
      const backendMsg = e?.response?.data ? JSON.stringify(e.response.data) : e.message;
      message.error("Erreur lors de la mise à jour des statuts : " + backendMsg);
      // Log complet pour debug
      // eslint-disable-next-line no-console
      console.error("Erreur API updatePlan:", e);
    }
  };

  React.useEffect(() => {
    window.refreshSupplierInstallments = refreshInstallments;
    return () => {
      delete window.refreshSupplierInstallments;
    };
  }, [refreshInstallments]);

  if (showDetails && selectedInstallment) {
    return (
      <SupplierInstallmentDetails
        installment={selectedInstallment}
        onBack={() => setShowDetails(false)}
        onUpdateInstallment={handleUpdateInstallment}
      />
    );
  }

  return (
    <div className="installment-management">
      <div className="installment-header">
        <h1>Gestion des Traites Fournisseur</h1>
        {countEnRetard > 0 && (
          <div style={{ backgroundColor: "#f5222d", color: "white", padding: "12px 20px", borderRadius: 6, marginTop: 10, fontWeight: "bold", fontSize: 16 }}>
            ⚠️ {countEnRetard} traite{countEnRetard > 1 ? "s" : ""} en retard
          </div>
        )}
      </div>
      <Row gutter={16} style={{ marginBottom: 24, flexWrap: "nowrap", overflowX: "auto" }}>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card bordered={false}>
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Total Traites</Title>
            <Text style={{ fontSize: 20, fontWeight: "700", display: "flex", alignItems: "center" }}>
              <FileDoneOutlined style={{ marginRight: 8, color: "#1890ff" }} />
              {totalInstallments}
            </Text>
          </Card>
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card bordered={false}>
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Montant Total</Title>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>{totalAmount.toFixed(3)}</Text>
          </Card>
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card bordered={false}>
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Payées</Title>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#52c41a", display: "flex", alignItems: "center" }}>
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              {countPayee}
            </Text>
          </Card>
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card bordered={false}>
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Non Payées</Title>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fa8c16", display: "flex", alignItems: "center" }}>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              {countNonPayee}
            </Text>
          </Card>
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card bordered={false}>
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Partiel- Payées</Title>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fa541c", display: "flex", alignItems: "center" }}>
              <SyncOutlined style={{ marginRight: 8 }} />
              {countPartiellementPayee}
            </Text>
          </Card>
        </Col>
      </Row>
      <div className="tab-navigation">
        <button className={`tab-button ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>Créer des Traites</button>
        <button className={`tab-button ${activeTab === "view" ? "active" : ""}`} onClick={() => setActiveTab("view")}>Voir les Traites</button>
        <button className={`tab-button ${activeTab === "print" ? "active" : ""}`} onClick={() => setActiveTab("print")}>Imprimer les Traites</button>
      </div>
      <div className="tab-content">
        <div className={`tab-panel ${activeTab === "create" ? "active" : ""}`}>
          {activeTab === "create" && <SupplierInstallmentForm />}
        </div>
        <div className={`tab-panel ${activeTab === "view" ? "active" : ""}`}>
          {activeTab === "view" && (
            <>
              <h2 className="panel-title">Traites Fournisseur Existantes</h2>
              <div className="filter-section">
                <div className="filter-row">
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Rechercher par fournisseur ou numéro de facture..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <i className="fas fa-search search-icon"></i>
                  </div>
                  <div className="status-filter">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="status-select"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="NON_PAYEE">Non payé</option>
                      <option value="PAYEE">Payé</option>
                      <option value="PARTIELLEMENT_PAYEE">Partiellement payé</option>
                      <option value="EN_RETARD">En retard</option>
                    </select>
                  </div>
                  <div className="bank-filter">
                    <select
                      value={bankFilter}
                      onChange={(e) => setBankFilter(e.target.value)}
                      className="bank-select"
                    >
                      <option value="all">Toutes les banques</option>
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
                    </select>
                  </div>
                </div>
              </div>
              {filteredInstallments.length === 0 ? (
                <div className="empty-state">
                  {installments.length === 0 ? (
                    <>
                      <p>Aucune traite fournisseur n'a été créée.</p>
                      <p>Utilisez l'onglet "Créer des Traites" pour ajouter de nouvelles traites.</p>
                    </>
                  ) : (
                    <p>Aucune traite ne correspond aux critères de recherche.</p>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="installments-table">
                    <thead>
                      <tr>
                        <th>Fournisseur</th>
                        <th>Numéro de Facture</th>
                        <th>Montant Total</th>
                        <th>Nombre de Traites</th>
                        <th>Banque</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstallments.map((inst) => (
                        <tr key={inst.id}>
                          <td>
                            <button className="client-name-button" onClick={() => { setSelectedInstallment(inst); setShowDetails(true); }}>
                              {inst.nom_raison_sociale || inst.supplierName || "N/A"}
                            </button>
                          </td>
                          <td>{inst.numero_facture || inst.numero_commande || "N/A"}</td>
                          <td>{inst.montant_total ? parseFloat(inst.montant_total).toFixed(3) : "N/A"}</td>
                          <td>{inst.nombre_traite || (inst.traites ? inst.traites.length : "N/A")}</td>
                          <td>{
                            inst.bankName || inst.banque || inst.bank_name || inst.adresse_banque || "N/A"
                          }</td>
                          <td>
                            <span className={`status-badge ${inst.status?.toLowerCase() || "unknown"}`}
                              style={
                                inst.status === "EN_RETARD"
                                  ? { backgroundColor: "#f5222d", color: "#fff" }
                                  : inst.status === "PARTIELLEMENT_PAYEE"
                                  ? { backgroundColor: "#fa541c", color: "#fff" }
                                  : {}
                              }>
                              {statusLabels[inst.status] || "Statut inconnu"}
                            </span>
                          </td>
                          <td className="action-buttons">
                            <button className="action-button print-button" onClick={() => { setSelectedInstallment(inst); setActiveTab("print"); }}>
                              <i className="fas fa-print"></i> Imprimer
                            </button>
                            <Popconfirm title="Êtes-vous sûr de vouloir supprimer cette traite ?" onConfirm={() => handleDelete(inst.id)} okText="Oui" cancelText="Non" okButtonProps={{ style: { backgroundColor: "#1890ff", color: "#fff" } }}>
                              <button className="action-button delete-button">
                                <i className="fas fa-trash-alt"></i> Supprimer
                              </button>
                            </Popconfirm>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
        <div className={`tab-panel ${activeTab === "print" ? "active" : ""}`}>
          {activeTab === "print" && (
            <SupplierInstallmentsPrinter selectedInstallment={selectedInstallment} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierInstallmentManagement;
