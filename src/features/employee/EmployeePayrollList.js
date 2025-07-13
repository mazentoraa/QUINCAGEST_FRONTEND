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

const { Title } = Typography;
const { Option } = Select;

const EmployeePayrollList = () => {
  const [employees, setEmployees] = useState([]);
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

  useEffect(() => {
    loadEmployees();
  }, []);

  const getFichesForDate = (fiches) =>
    (fiches || []).filter(fp => {
      const d = moment(fp.date);
      return d.month() + 1 === parseInt(month) && d.year() === parseInt(year);
    });

  // Fonction pour calculer le statut d'un employé selon ses fiches sur la période
  const getStatusForEmployee = (emp) => {
    const hasFiches = getFichesForDate(emp.fiches_paie).length > 0;
    return hasFiches ? 'Générée' : 'En attente';
  };

  // Filtrage avec recherche, date d'embauche, et statut dynamique
  const filteredEmployees = Array.isArray(employees)
    ? employees.filter(emp => {
        const matchesSearch = `${emp.nom} ${emp.prenom}`.toLowerCase().includes(search.toLowerCase());

        const embaucheDate = moment(emp.date_embauche);
        const matchesDate = embaucheDate.month() + 1 === parseInt(month) && embaucheDate.year() === parseInt(year);

        const status = getStatusForEmployee(emp);
        const matchesStatus = statusFilter === 'Tous' || status === statusFilter;

        return matchesSearch && matchesDate && matchesStatus;
      })
    : [];

  // Calcul des stats sur les employés filtrés
  const totalFiches = filteredEmployees.length;
  const fichesGenerees = filteredEmployees.filter(emp => getStatusForEmployee(emp) === 'Générée');
  const fichesEnAttente = totalFiches - fichesGenerees.length;
  const totalNet = fichesGenerees.reduce((acc, emp) => {
    const fiches = getFichesForDate(emp.fiches_paie);
    return acc + fiches.reduce((s, f) => s + (f.net_a_payer || 0), 0);
  }, 0);
  const totalDeductions = fichesGenerees.reduce((acc, emp) => {
    const fiches = getFichesForDate(emp.fiches_paie);
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
      render: (val) => `${val?.toLocaleString()}`,
    },
    {
      title: "Date d'Embauche",
      dataIndex: 'date_embauche',
      render: (val) => moment(val).format('DD/MM/YYYY'),
    },
    {
      title: 'Statut',
      key: 'statut',
      render: (_, record) => {
        const status = getStatusForEmployee(record);
        return (
          <Tag
            color={status === 'Générée' ? 'green' : 'orange'}
            icon={status === 'Générée' ? <FileDoneOutlined /> : <FileExclamationOutlined />}
          >
            {status}
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
    <div style={{ padding: 24, background: '#f0f5ff', minHeight: '100vh' }}>
      <Title level={3} style={{ color: '#1890ff' }}>📄 Fiches de Paie - Liste des Employés</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Fiches Générées"
              value={fichesGenerees.length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Fiches en Attente"
              value={fichesEnAttente}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
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
          <Card>
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

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="🔍 Rechercher employé"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select value={month} onChange={setMonth} style={{ width: '100%' }}>
              {months.map((m, i) => (
                <Option key={i + 1} value={i + 1}>{m}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select value={year} onChange={setYear} style={{ width: '100%' }}>
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
            >
              <Option value="Tous">Tous les statuts</Option>
              <Option value="Générée">Générée</Option>
              <Option value="En attente">En attente</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilters}
              style={{ width: '100%' }}
            >
              Effacer les filtres
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          dataSource={filteredEmployees}
          rowKey="id"
          columns={columns}
          loading={loading}
          bordered
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default EmployeePayrollList;
