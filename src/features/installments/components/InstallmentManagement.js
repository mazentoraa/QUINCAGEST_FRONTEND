import React, { useState, useContext, useEffect } from "react";
import { InstallmentContext } from "../contexts/InstallmentContext";
import InstallmentForm from "./InstallmentForm";
import InstallmentsPrinter from "./InstallmentsPrinter";
import InstallmentDetails from "./InstallmentDetails";
import "./InstallmentManagement.css";
import { softDeleteInstallment } from "../services/InstallmentService";
import { Popconfirm, message, Row, Col, Card, Typography } from "antd";
import {
  FileDoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Space, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const InstallmentManagement = () => {
  const { installments, updateInstallment, removeInstallment } = useContext(InstallmentContext);
  const [activeTab, setActiveTab] = useState("create");
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");

  const today = new Date();

  // Ajouter EN_RETARD si date dépassée et statut = NON_PAYEE
  const filteredInstallments = installments
    .map((installment) => {
      const dueDate = new Date(installment.date_premier_echeance);
      if (
        installment.status === "NON_PAYEE" &&
        installment.date_premier_echeance &&
        dueDate < today
      ) {
        return { ...installment, status: "EN_RETARD" };
      }
      return installment;
    })
    .filter((installment) => {
      const clientName = installment.client_nom || installment.clientName || "";
      const invoiceNumber = installment.numero_commande || installment.invoiceNumber || "";
      const matchesSearch =
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || installment.status === statusFilter;
      const matchesBank = bankFilter === "all" || installment.bankName === bankFilter;
      return matchesSearch && matchesStatus && matchesBank;
    });

  const handleClientClick = (installment) => {
    setSelectedInstallment(installment);
    setShowDetails(true);
  };

  const handleDelete = async (installmentId) => {
    try {
      await softDeleteInstallment(installmentId);
      removeInstallment(installmentId);
      message.success("Plan supprimé avec succès !");
    } catch (error) {
      message.error("Erreur lors de la suppression.");
      console.error(error);
    }
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedInstallment(null);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.tab === "view") {
        setActiveTab("view");
      }
    };
    window.addEventListener("switchInstallmentTab", handler);
    return () => window.removeEventListener("switchInstallmentTab", handler);
  }, []);

  const totalInstallments = installments.length;
  const totalAmount = installments.reduce(
    (sum, inst) => sum + (parseFloat(inst.montant_total) || 0),
    0
  );

  const countPayee = installments.filter(inst => inst.status === "PAYEE").length;
  const countNonPayee = installments.filter(inst => inst.status === "NON_PAYEE").length;
  const countPartiellementPayee = installments.filter(inst => inst.status === "PARTIELLEMENT_PAYEE").length;

  // Calcul du nombre de traites en retard
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

  if (showDetails && selectedInstallment) {
    return (
      <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <InstallmentDetails
          installment={selectedInstallment}
          onBack={handleBackToList}
          onUpdateInstallment={updateInstallment}
        />
      </div>
    );
  }

  return (
    <div className="installment-management" style={{ backgroundColor: "#ffffff", minHeight: "100vh", borderRadius: "15px" }}>
      <div className="installment-header">
       <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  }}
>
  <Space size="large" align="center">
    <div>
      <div
        style={{
          width: 48,
          height: 48,
          background: "#1890ff",
          borderRadius: 16,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <FileDoneOutlined style={{ fontSize: 24, color: "#fff" }} />
      </div>
    </div>

    <div>
      <Title
        level={2}
        style={{
          margin: 0,
          fontWeight: 700,
          color: "#1890ff",
          fontSize: "28px",
        }}
      >
        Gestion des Traites
      </Title>
      <Text type="secondary">
        Suivi complet des traites émises
        <span style={{ color: "#52c41a", marginLeft: 8 }}>●</span>
      </Text>
    </div>
  </Space>

</div>

{countEnRetard > 0 && (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {/* Bouton Corbeille - avec cadre et hover effect */}
    <div style={{
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      padding: "8px",
      backgroundColor: "#ffffff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    }}>
      <Button
        icon={<DeleteOutlined />}
        size="middle"
        style={{
          borderRadius: "8px",
          height: "36px",
          padding: "0 16px",
          border: "2px solid #ef4444",
          color: "#ef4444",
          fontWeight: 600,
          background: "#ffffff",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
          cursor: "pointer",
          width: "100%",
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#dc2626";
          e.target.style.color = "#ffffff";
          e.target.style.background = "#ef4444";
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "#ef4444";
          e.target.style.color = "#ef4444";
          e.target.style.background = "#ffffff";
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.15)";
        }}
        onClick={() => {
          message.info("Bouton Corbeille cliqué !");
        }}
      >
        Corbeille
      </Button>
    </div>

    {/* Alerte en retard (rouge) - avec cadre et hover effect */}
    <div
      style={{
        border: "2px solid #f5222d",
        backgroundColor: "#f5222d",
        color: "white",
        padding: "12px 20px",
        borderRadius: 8,
        fontWeight: "bold",
        fontSize: 16,
        transition: "all 0.3s ease",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(245, 34, 45, 0.2)",
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#cf1322";
        e.target.style.borderColor = "#cf1322";
        e.target.style.transform = "scale(1.02)";
        e.target.style.boxShadow = "0 4px 15px rgba(245, 34, 45, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "#f5222d";
        e.target.style.borderColor = "#f5222d";
        e.target.style.transform = "scale(1)";
        e.target.style.boxShadow = "0 2px 8px rgba(245, 34, 45, 0.2)";
      }}
    >
      ⚠️ {countEnRetard} traite{countEnRetard > 1 ? "s" : ""} en retard
    </div>
  </div>
)}

      </div>

      <Row gutter={16} style={{ marginBottom: 24, flexWrap: "nowrap", overflowX: "auto" }}>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card 
            bordered={true}
            style={{ 
              backgroundColor: "#ffffff", 
              transition: "all 0.3s ease", 
              cursor: "pointer",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.borderColor = "#1890ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Total Traites</Title>
            <Text style={{ fontSize: 20, fontWeight: "700", display: "flex", alignItems: "center" }}>
              <FileDoneOutlined style={{ marginRight: 8, color: "#1890ff" }} />
              {totalInstallments}
            </Text>
          </Card>
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card 
            bordered={true}
            style={{ 
              backgroundColor: "#ffffff", 
              transition: "all 0.3s ease", 
              cursor: "pointer",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.borderColor = "#1890ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Montant Total</Title>
            <Text style={{ fontSize: 20, fontWeight: "700" }}>{totalAmount.toFixed(3)}</Text>
          </Card>
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card 
            bordered={true}
            style={{ 
              backgroundColor: "#ffffff", 
              transition: "all 0.3s ease", 
              cursor: "pointer",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.borderColor = "#52c41a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Payées</Title>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#52c41a", display: "flex", alignItems: "center" }}>
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              {countPayee}
            </Text>
          </Card>
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card 
            bordered={true}
            style={{ 
              backgroundColor: "#ffffff", 
              transition: "all 0.3s ease", 
              cursor: "pointer",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.borderColor = "#fa8c16";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Non Payées</Title>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fa8c16", display: "flex", alignItems: "center" }}>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              {countNonPayee}
            </Text>
          </Card>
        </Col>
        <Col flex="1 1 0" style={{ minWidth: 140 }}>
          <Card 
            bordered={true}
            style={{ 
              backgroundColor: "#ffffff", 
              transition: "all 0.3s ease", 
              cursor: "pointer",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.borderColor = "#fa541c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <Title level={4} style={{ color: "#555", fontWeight: "600" }}>Partiel- Payées</Title>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fa541c", display: "flex", alignItems: "center" }}>
              <SyncOutlined style={{ marginRight: 8 }} />
              {countPartiellementPayee}
            </Text>
          </Card>
        </Col>
      </Row>

      <div className="tab-navigation">
        <button className={`tab-button ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>
          <i className="fas fa-plus-circle"></i> Créer des Traites
        </button>
        <button className={`tab-button ${activeTab === "view" ? "active" : ""}`} onClick={() => setActiveTab("view")}>
          <i className="fas fa-list-alt"></i> Voir les Traites
        </button>
        <button className={`tab-button ${activeTab === "print" ? "active" : ""}`} onClick={() => setActiveTab("print")}>
          <i className="fas fa-print"></i> Imprimer les Traites
        </button>
      </div>

      <div className="tab-content">
        <div className={`tab-panel ${activeTab === "create" ? "active" : ""}`}>
          {activeTab === "create" && <InstallmentForm />}
        </div>

        <div className={`tab-panel ${activeTab === "view" ? "active" : ""}`}>
          {activeTab === "view" && (
            <>
              <h2 className="panel-title">Traites Existantes</h2>

              <div className="filter-section">
                <div className="filter-row">
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Rechercher par client ou numéro de facture..."
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
                      <p>Aucune traite n'a été créée.</p>
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
                        <th>Client</th>
                        <th>Numéro de Facture</th>
                        <th>Montant Total</th>
                        <th>Nombre de Traites</th>
                        <th>Banque</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstallments.map((installment) => (
                        <tr key={installment.id}>
                          <td>
                            <button className="client-name-button" onClick={() => handleClientClick(installment)}>
                              {installment.client_nom || installment.clientName || "N/A"}
                            </button>
                          </td>
                          <td>{installment.numero_commande || installment.invoiceNumber || "N/A"}</td>
                          <td>{installment.montant_total ? parseFloat(installment.montant_total).toFixed(3) : "N/A"}</td>
                          <td>{installment.nombre_traite || installment.numberOfInstallments || "N/A"}</td>
                          <td>{installment.bankName || "N/A"}</td>
                          <td>
                            <span
                              className={`status-badge ${installment.status?.toLowerCase() || "unknown"}`}
                              style={
                                installment.status === "EN_RETARD"
                                  ? { backgroundColor: "#f5222d", color: "#fff" }
                                  : {}
                              }
                            >
                              {statusLabels[installment.status] || "Statut inconnu"}
                            </span>
                          </td>
                          <td className="action-buttons">
                            <button
                              className="action-button print-button"
                              onClick={() => {
                                setSelectedInstallment(installment);
                                setActiveTab("print");
                              }}
                            >
                              <i className="fas fa-print"></i> Imprimer
                            </button>
                            <Popconfirm
                              title="Êtes-vous sûr de vouloir supprimer cette traite ?"
                              onConfirm={() => handleDelete(installment.id)}
                              okText="Oui"
                              cancelText="Non"
                              okButtonProps={{ style: { backgroundColor: "#1890ff", color: "#fff" } }}
                            >
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
            <InstallmentsPrinter selectedInstallment={selectedInstallment} />
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallmentManagement;