import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Spin,
  Alert,
  Divider,
  Avatar,
  List,
  Tooltip,
  Button,
  Badge,
  Skeleton,
} from "antd";
import {
  ShoppingOutlined,
  FileTextOutlined,
  AccountBookOutlined,
  UserOutlined,
  ToolOutlined,
  BankOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ThunderboltOutlined,
  StarOutlined,
  FireOutlined,
  RocketOutlined,
  TeamOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import "./Dashboard.css";

const { Title, Text, Paragraph } = Typography;
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

// API service functions
const dashboardAPI = {
  getMainInsights: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/main-insights/`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch dashboard data: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  },
  getRecentCommandes: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/recent-commandes/`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch recent commandes: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  },
  getRecentFactures: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/recent-factures/`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch recent factures: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  },
};

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentCommandes, setRecentCommandes] = useState([]);
  const [recentFactures, setRecentFactures] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [insights, commandes, factures] = await Promise.all([
        dashboardAPI.getMainInsights(),
        dashboardAPI.getRecentCommandes(),
        dashboardAPI.getRecentFactures(),
      ]);

      setDashboardData(insights);
      setRecentCommandes(commandes);
      setRecentFactures(factures);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-content">
          <div className="pulse-loader">
            <div className="pulse-circle"></div>
            <div className="pulse-circle"></div>
            <div className="pulse-circle"></div>
          </div>
          <Title level={3} className="loading-text">
            Chargement du tableau de bord...
          </Title>
          <Paragraph type="secondary">Analyse des données en cours</Paragraph>
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading dashboard data:", error);
    return null;
  }

  const { counts, financials, devis_by_status, commandes_by_status } =
    dashboardData;

  // Calculate collection rate
  const collectionRate =
    financials.total_invoiced_ttc > 0
      ? Math.round(
          (financials.total_paid_ttc / financials.total_invoiced_ttc) * 100
        )
      : 0;

  // Status color mapping with modern gradients
  const getStatusColor = (status) => {
    const colors = {
      en_attente: "linear-gradient(135deg, #ffa940, #ff7a00)",
      confirme: "linear-gradient(135deg, #1890ff, #096dd9)",
      en_cours: "linear-gradient(135deg, #13c2c2, #08979c)",
      termine: "linear-gradient(135deg, #52c41a, #389e0d)",
      annule: "linear-gradient(135deg, #ff4d4f, #cf1322)",
      paid: "linear-gradient(135deg, #52c41a, #389e0d)",
      pending: "linear-gradient(135deg, #ffa940, #ff7a00)",
      overdue: "linear-gradient(135deg, #ff4d4f, #cf1322)",
    };
    return colors[status] || "linear-gradient(135deg, #d9d9d9, #bfbfbf)";
  };

  const keyMetricCards = [
    {
      title: "Clients Actifs",
      value: counts.clients,
      icon: <UserOutlined />,
      gradient: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
      path: "/clients",
      change: "+12%",
      trend: "up",
      subtitle: "Base clients",
    },
    {
      title: "Fournisseurs Actifs",
      value: counts.fournisseurs , // Valeur par défaut si pas dans l'API
      icon: <ShopOutlined />,
      gradient: "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
      path: "/fournisseurs",
      change: "+5%",
      trend: "up",
      subtitle: "Partenaires",
    },
    {
      title: "Employés Actifs",
      value: counts.employes, // Valeur par défaut si pas dans l'API
      icon: <TeamOutlined />,
      gradient: "linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)",
      path: "/employes",
      change: "+3%",
      trend: "up",
      subtitle: "Équipe",
    },
    {
      title: "Projets en Cours",
      value: counts.traveaux,
      icon: <RocketOutlined />,
      gradient: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
      path: "/manifeste/travaux",
      change: "+8%",
      trend: "up",
      subtitle: "Projets actifs",
    },
    {
      title: "Devis Actifs",
      value: counts.devis,
      icon: <FileTextOutlined />,
      gradient: "linear-gradient(135deg, #faad14 0%, #d48806 100%)",
      path: "/bons/devis",
      change: "+15%",
      trend: "up",
      subtitle: "En attente",
    },
    {
      title: "Commandes",
      value: counts.commandes,
      icon: <ThunderboltOutlined />,
      gradient: "linear-gradient(135deg, #13c2c2 0%, #08979c 100%)",
      path: "/bons/commande",
      change: "+6%",
      trend: "up",
      subtitle: "Ce mois",
    },
  ];

  const financialCards = [
    {
      title: "Chiffre d'Affaires",
      value: financials.total_invoiced_ttc,
      suffix: "DT",
      icon: <DollarOutlined />,
      gradient: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
      progress: 100,
      change: "+18%",
      trend: "up",
    },
    {
      title: "Encaissements",
      value: financials.total_paid_ttc,
      suffix: "DT",
      icon: <BankOutlined />,
      gradient: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
      progress: collectionRate,
      change: "+12%",
      trend: "up",
    },
    {
      title: "Taux de Recouvrement",
      value: collectionRate,
      suffix: "%",
      icon: collectionRate >= 75 ? <RiseOutlined /> : <FallOutlined />,
      gradient:
        collectionRate >= 75
          ? "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)"
          : "linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)",
      progress: collectionRate,
      change: collectionRate >= 75 ? "+5%" : "-3%",
      trend: collectionRate >= 75 ? "up" : "down",
    },
  ];

  const commandesColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (text) => (
        <Badge count={text} style={{ backgroundColor: "#52c41a" }} />
      ),
    },
    {
      title: "Client",
      dataIndex: "nom_client",
      key: "client",
      render: (text) => (
        <div className="client-cell">
          <Text strong className="client-name">
            {text}
          </Text>
        </div>
      ),
    },
    {
      title: "Montant",
      dataIndex: "montant_ttc",
      key: "montant",
      render: (value) => (
        <Text className="amount-cell">
          {value?.toLocaleString()} <span className="currency">DT</span>
        </Text>
      ),
    },
    {
      title: "Statut",
      dataIndex: "statut",
      key: "statut",
      render: (status) => (
        <Tag
          className="modern-status-tag"
          style={{
            background: getStatusColor(status),
            border: "none",
            color: "white",
            fontWeight: "600",
            borderRadius: "12px",
            padding: "4px 12px",
          }}
        >
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "date_commande",
      key: "date",
      render: (date) => (
        <Text type="secondary" className="date-cell">
          {new Date(date).toLocaleDateString("fr-FR")}
        </Text>
      ),
    },
  ];

  return (
    <div className="dashboard-2025">
      {/* Hero Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <Title level={1} className="main-title">
              <DashboardOutlined className="title-icon" />
              Tableau de Bord Exécutif
            </Title>
            <Paragraph className="header-subtitle">
              Vue d'ensemble intelligente de votre activité en temps réel
            </Paragraph>
          </div>
          <div className="header-actions">
            <Button
              type="primary"
              className="action-btn"
              icon={<BarChartOutlined />}
            >
              Analyses
            </Button>
            <Button
              className="action-btn secondary"
              icon={<LineChartOutlined />}
            >
              Rapports
            </Button>
          </div>
        </div>
        <div className="header-decoration">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {keyMetricCards.map((metric, index) => (
          <Card
            key={index}
            className={`metric-card ${hoveredCard === index ? "hovered" : ""}`}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => navigate(metric.path)}
          >
            <div className="metric-content">
              <div className="metric-header">
                <div
                  className="metric-icon"
                  style={{ background: metric.gradient }}
                >
                  {metric.icon}
                </div>
                <div className="metric-trend">
                  {metric.trend === "up" ? (
                    <ArrowUpOutlined className="trend-up" />
                  ) : (
                    <ArrowDownOutlined className="trend-down" />
                  )}
                  <span className="trend-value">{metric.change}</span>
                </div>
              </div>
              <div className="metric-body">
                <Title level={2} className="metric-value">
                  {metric.value}
                </Title>
                <Text className="metric-title">{metric.title}</Text>
                <Text type="secondary" className="metric-subtitle">
                  {metric.subtitle}
                </Text>
              </div>
            </div>
            <div
              className="metric-glow"
              style={{ background: metric.gradient }}
            ></div>
          </Card>
        ))}
      </div>

      {/* Financial Overview */}
      <Row gutter={[24, 24]} className="financial-section">
        {financialCards.map((card, index) => (
          <Col key={index} xs={24} lg={8}>
            <Card className="financial-card">
              <div className="financial-header">
                <div
                  className="financial-icon"
                  style={{ background: card.gradient }}
                >
                  {card.icon}
                </div>
                <div className="financial-trend">
                  {card.trend === "up" ? (
                    <ArrowUpOutlined className="trend-up" />
                  ) : (
                    <ArrowDownOutlined className="trend-down" />
                  )}
                  <span>{card.change}</span>
                </div>
              </div>
              <Statistic
                title={card.title}
                value={card.value}
                precision={card.suffix === "DT" ? 2 : 0}
                suffix={card.suffix}
                className="financial-statistic"
              />
              <Progress
                percent={card.progress}
                strokeColor={card.gradient}
                trailColor="rgba(255,255,255,0.1)"
                strokeWidth={8}
                showInfo={false}
                className="financial-progress"
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Status Distribution */}
      <Row gutter={[24, 24]} className="status-section">
        <Col xs={24} lg={12}>
          <Card
            className="status-card"
            title={<div className="card-title">Distribution des Devis</div>}
          >
            <div className="status-list">
              {devis_by_status?.map((item, index) => (
                <div key={index} className="status-item">
                  <div className="status-info">
                    <div
                      className="status-indicator"
                      style={{ background: getStatusColor(item.statut) }}
                    ></div>
                    <Text className="status-label">
                      {item.statut?.toUpperCase()}
                    </Text>
                  </div>
                  <Badge count={item.count} className="status-count" />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            className="status-card"
            title={<div className="card-title">Distribution des Commandes</div>}
          >
            <div className="status-list">
              {commandes_by_status?.map((item, index) => (
                <div key={index} className="status-item">
                  <div className="status-info">
                    <div
                      className="status-indicator"
                      style={{ background: getStatusColor(item.statut) }}
                    ></div>
                    <Text className="status-label">
                      {item.statut?.toUpperCase()}
                    </Text>
                  </div>
                  <Badge count={item.count} className="status-count" />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
        <Row gutter={[24, 24]} className="activities-section">
          <Col xs={24} lg={12}>
            <Card
          className="activity-card"
          title={<div className="card-title">Commandes Récentes</div>}
          extra={
            <Button
              type="link"
              className="view-all-btn"
              onClick={() => navigate("bons/commande")}
              icon={<ArrowUpOutlined />}
            >
              Voir tout
            </Button>
          }
            >
          <Table
            dataSource={recentCommandes}
            columns={commandesColumns}
            pagination={false}
            size="small"
            rowKey="id"
            className="modern-table"
          />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
          className="activity-card"
          title={<div className="card-title">Factures Récentes</div>}
          extra={
            <Button
              type="link"
              className="view-all-btn"
              onClick={() => navigate("/reglements/factures")}
              icon={<ArrowUpOutlined />}
            >
              Voir tout
            </Button>
          }
            >
          <List
            dataSource={recentFactures}
            className="modern-list"
            renderItem={(item) => (
              <List.Item className="list-item">
            <List.Item.Meta
              avatar={
                <Avatar
              className="list-avatar"
              style={{
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
                >
              {item.nom_client?.charAt(0)?.toUpperCase()}
                </Avatar>
              }
              title={
                <Text strong className="list-title">
              Facture #{item.numero_facture} ({item.client_nom})
                </Text>
              }
              description={
                <Space className="list-meta">
              <Text className="list-amount">
                {item.total_ttc?.toLocaleString()} DT
              </Text>
              <Tag
                className="list-status"
                style={{
                  background: getStatusColor(item.statut),
                  border: "none",
                  color: "white",
                }}
              >
                {item.statut}
              </Tag>
                </Space>
              }
            />
            <div className="list-date">
              <ClockCircleOutlined />
              {new Date(item.date_creation).toLocaleDateString("fr-FR")}
            </div>
              </List.Item>
            )}
          />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions Grid */}
      <Card
        className="quick-actions-card"
        title={<div className="card-title">Actions Rapides</div>}
      >
        <div className="quick-actions-grid">
          {[
            {
              icon: <ShoppingOutlined />,
              label: "Produits",
              path: "/stock/produits",
              color: "#1890ff",
            },
            {
              icon: <ToolOutlined />,
              label: "Travaux",
              path: "/manifeste/travaux",
              color: "#52c41a",
            },
            {
              icon: <FileTextOutlined />,
              label: "Bons",
              path: "/bons/livraison-decoupe",
              color: "#faad14",
            },
            {
              icon: <AccountBookOutlined />,
              label: "Factures",
              path: "/reglements/factures",
              color: "#13c2c2",
            },
            {
              icon: <BankOutlined />,
              label: "Traites",
              path: "/reglements/traites",
              color: "#722ed1",
            },
            {
              icon: <UserOutlined />,
              label: "Clients",
              path: "/clients",
              color: "#eb2f96",
            },
            {
              icon: <ShopOutlined />,
              label: "Fournisseurs",
              path: "/fournisseurs",
              color: "#722ed1",
            },
            {
              icon: <TeamOutlined />,
              label: "Employés",
              path: "/employees",
              color: "#eb2f96",
            },
          ].map((action, index) => (
            <div
              key={index}
              className="quick-action-item"
              onClick={() => navigate(action.path)}
            >
              <div
                className="action-icon"
                style={{
                  background: `linear-gradient(135deg, ${action.color}, ${action.color}dd)`,
                }}
              >
                {action.icon}
              </div>
              <Text className="action-label">{action.label}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;