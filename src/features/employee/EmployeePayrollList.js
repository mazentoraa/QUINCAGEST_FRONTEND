import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Typography,
  Tooltip,
  message,
  Row,
  Col,
  Input,
  Select,
  Tag,
  Statistic,
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  FileDoneOutlined,
  FileExclamationOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EmployeeService from './EmployeeService';
import moment from 'moment';
import { Space } from "antd";
import {
  FileTextOutlined,
  DeleteOutlined
} from "@ant-design/icons";

const { Text } = Typography;

const { Title } = Typography;
const { Option } = Select;

const EmployeePayrollList = () => {
  const [employees, setEmployees] = useState([]);
  const [fichesPaie, setFichesPaie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(moment().year());
  const [month, setMonth] = useState(moment().month() + 1);
  const [statusFilter, setStatusFilter] = useState('Tous');
  const navigate = useNavigate();

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await EmployeeService.getAll();
      if (response.data && Array.isArray(response.data.results)) {
        setEmployees(response.data.results);
      } else {
        console.error('Les données des employés ne sont pas un tableau :', response.data);
        setEmployees([]);
      }
    } catch (error) {
      message.error("Erreur lors du chargement des employés.");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFichesPaie = async () => {
    try {
      // Supposons que vous avez un endpoint pour récupérer toutes les fiches de paie
      const response = await EmployeeService.getAllFichesPaie();
      if (response.data && Array.isArray(response.data.results)) {
        setFichesPaie(response.data.results);
      } else {
        setFichesPaie([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des fiches de paie:", error);
      setFichesPaie([]);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadFichesPaie();
  }, []);

  const getFichesForEmployee = (employeeId) => {
    return fichesPaie.filter(fp => 
      fp.employe === employeeId && 
      fp.mois === parseInt(month) && 
      fp.annee === parseInt(year)
    );
  };

  // Fonction pour calculer le statut d'un employé selon ses fiches sur la période SÉLECTIONNÉE
  const getStatusForEmployee = (emp) => {
    const fichesForPeriod = getFichesForEmployee(emp.id);
    return fichesForPeriod.length > 0 ? 'Générée' : 'En attente';
  };

  // Filtrage avec recherche et statut dynamique
  const filteredEmployees = Array.isArray(employees)
    ? employees.filter(emp => {
        const matchesSearch = `${emp.nom} ${emp.prenom || ''}`.toLowerCase().includes(search.toLowerCase());

        // Vérifier si l'employé était déjà embauché pendant la période sélectionnée
        const embaucheDate = moment(emp.date_embauche);
        const selectedPeriod = moment().year(year).month(month - 1).endOf('month');
        const wasHiredByThen = embaucheDate.isSameOrBefore(selectedPeriod);

        const status = getStatusForEmployee(emp);
        const matchesStatus = statusFilter === 'Tous' || status === statusFilter;

        return matchesSearch && wasHiredByThen && matchesStatus;
      })
    : [];

  // Calcul des stats sur les employés filtrés
  const totalFiches = filteredEmployees.length;
  const fichesGenerees = filteredEmployees.filter(emp => getStatusForEmployee(emp) === 'Générée');
  const fichesEnAttente = totalFiches - fichesGenerees.length;
  
  const totalNet = fichesGenerees.reduce((acc, emp) => {
    const fiches = getFichesForEmployee(emp.id);
    return acc + fiches.reduce((s, f) => s + (f.net_a_payer || 0), 0);
  }, 0);
  
  const totalDeductions = fichesGenerees.reduce((acc, emp) => {
    const fiches = getFichesForEmployee(emp.id);
    return acc + fiches.reduce((s, f) => s + (f.deduction_totale || 0), 0);
  }, 0);

  const columns = [
    { title: 'ID', dataIndex: 'id_employe', width: 80 },
    { title: 'Nom', dataIndex: 'nom' },
    { title: 'Poste', dataIndex: 'poste' },
    { title: 'Département', dataIndex: 'departement' },
    {
      title: 'Salaire de Base',
      dataIndex: 'salaire',
      render: (val) => `${val?.toLocaleString()} `,
    },
    {
      title: "Date d'Embauche",
      dataIndex: 'date_embauche',
      render: (val) => moment(val).format('DD/MM/YYYY'),
    },
    {
      title: 'Avance',
      key: 'avance',
      render: (_, record) => {
        const avancesAcceptees = record.avances?.filter(a => a.statut === 'Acceptée') || [];
        if (avancesAcceptees.length > 0) {
          const total = avancesAcceptees.reduce((sum, a) => sum + (a.montant || 0), 0);
          return <Tag color="blue">Oui ({total.toLocaleString()})</Tag>;
        }
        return <Tag color="default">Non</Tag>;
      }
    },
    {
      title: 'Statut',
      key: 'statut',
      render: (_, record) => {
        const status = getStatusForEmployee(record);
        const fichesCount = getFichesForEmployee(record.id).length;
        return (
          <Tag
            color={status === 'Générée' ? 'green' : 'orange'}
            icon={status === 'Générée' ? <FileDoneOutlined /> : <FileExclamationOutlined />}
          >
            {status} {fichesCount > 0 && `(${fichesCount})`}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Tooltip title="Voir fiches de paie">
          <Button
            icon={<EyeOutlined />}
            type="primary"
            size="small"
            onClick={() => navigate(`/employes/${record.id}/fiches-paie`)}
          >
            Voir
          </Button>
        </Tooltip>
      ),
    },
  ];

  const years = Array.from({ length: 5 }, (_, i) => moment().year() - i);
  const months = moment.months();

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setSearch('');
    setYear(moment().year());
    setMonth(moment().month() + 1);
    setStatusFilter('Tous');
  };

  return (
    <div style={{ 
      padding: 24, 
      background: '#ffffff', 
      minHeight: '100vh',
      backgroundColor: '#ffffff' // Assurance supplémentaire pour l'arrière-plan blanc
    }}>
      <div
        style={{
          padding: "40px 40px 30px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          backgroundColor: '#ffffff' // Arrière-plan blanc pour l'en-tête
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #52c41a 0%, #52c41a 100%)",
              boxShadow: "0 6px 20px rgba(24, 144, 255, 0.25)",
              position: "relative",
            }}
          >
            <FileTextOutlined style={{ fontSize: "24px", color: "#ffffff" }} />
            <div
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "18px",
                height: "18px",
                borderRadius: "10px",
                backgroundColor: "#1890ff",
                border: "2px solid #ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "#ffffff",
                  fontSize: "9px",
                  fontWeight: "bold",
                }}
              >
                {employees.length}
              </span>
            </div>
          </div>

          <div>
            <Title
              level={2}
              style={{
                margin: 0,
                fontWeight: 600,
                color: "#52c41a",
                fontSize: "24px",
                letterSpacing: "-0.5px",
              }}
            >
              Fiches de Paie - Liste des Employés
            </Title>
            <Text
              style={{
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              {employees.length} employé{employees.length !== 1 ? "s" : ""} avec fiche{employees.length !== 1 ? "s" : ""}
            </Text>
          </div>
        </div>

        <Space size="large">
          <Button
            icon={<DeleteOutlined />}
            onClick={() => {
              message.info("Fonction Corbeille à implémenter");
            }}
            style={{
              borderRadius: "8px",
              height: "40px",
              padding: "0 16px",
              border: "1px solid #ef4444",
              color: "#ef4444",
              fontWeight: 500,
              background: "#ffffff",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#dc2626";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "#ef4444";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Corbeille
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card style={{ backgroundColor: '#ffffff' }}>
            <Statistic
              title="Fiches Générées"
              value={fichesGenerees.length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ backgroundColor: '#ffffff' }}>
            <Statistic
              title="Fiches en Attente"
              value={fichesEnAttente}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ backgroundColor: '#ffffff' }}>
            <Statistic
              title="Total Net à Payer"
              value={totalNet}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ backgroundColor: '#ffffff' }}>
            <Statistic
              title="Déductions Totales"
              value={totalDeductions}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<MinusCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24, backgroundColor: '#ffffff' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="🔍 Rechercher employé"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ backgroundColor: '#ffffff' }}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select 
              value={month} 
              onChange={setMonth} 
              style={{ width: '100%' }}
              dropdownStyle={{ backgroundColor: '#ffffff' }}
            >
              {months.map((m, i) => (
                <Option key={i + 1} value={i + 1}>{m}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select 
              value={year} 
              onChange={setYear} 
              style={{ width: '100%' }}
              dropdownStyle={{ backgroundColor: '#ffffff' }}
            >
              {years.map(y => (
                <Option key={y} value={y}>{y}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
              dropdownStyle={{ backgroundColor: '#ffffff' }}
            >
              <Option value="Tous">Tous les statuts</Option>
              <Option value="Générée">Générée</Option>
              <Option value="En attente">En attente</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Button
              onClick={resetFilters}
              style={{ width: '100%', backgroundColor: '#ffffff' }}
            >
              Effacer les filtres
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ backgroundColor: '#ffffff' }}>
        <Table
          dataSource={filteredEmployees}
          rowKey="id"
          columns={columns}
          loading={loading}
          bordered
          pagination={{ pageSize: 10 }}
          style={{ backgroundColor: '#ffffff' }}
        />
      </Card>
    </div>
  );
};

export default EmployeePayrollList;