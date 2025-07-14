import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Typography,
  Row,
  Col,
  Tag,
  Modal,
  Form,
  DatePicker,
  Divider,
  Tooltip,
  Space,
  Progress,
  Select,
  Avatar,
  message,
  Alert,
  Popconfirm,
  Spin,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LoadingOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { employeService, avanceService, handleApiError } from './AvanceService';

const { Title, Text } = Typography;
const { Option } = Select;

const colorList = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#108ee9', '#13c2c2', '#eb2f96'];

const statusColors = {
  'Acceptée': 'green',
  'En attente': 'orange',
  'Refusée': 'red',
};

const AvancePage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [avances, setAvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editingAvance, setEditingAvance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ search: '' });
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [mensualite, setMensualite] = useState(0);
  const [planRemboursement, setPlanRemboursement] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);
  const [statistics, setStatistics] = useState({});

  // Chargement des données au montage du composant
  useEffect(() => {
    loadEmployees();
    loadAvances();
    loadStatistics();
  }, []);

  // Rechargement des avances quand les filtres changent
  useEffect(() => {
    loadAvances();
  }, [filters, statusFilter]);

  // Chargement des employés
  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const data = await employeService.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Chargement des avances
  const loadAvances = async () => {
    setLoading(true);
    try {
      const filterData = {
        search: filters.search,
        statut: statusFilter !== 'Tous' ? statusFilter : undefined,
      };
      const data = await avanceService.getAllAvances(filterData);
      setAvances(data);
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Chargement des statistiques
  const loadStatistics = async () => {
    try {
      const data = await avanceService.getStatistics();
      setStatistics(data);
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  // Mise à jour des calculs de mensualité
  const updateMensualiteEtPlan = () => {
    const montant = form.getFieldValue('montant');
    const nbr = form.getFieldValue('nbr_mensualite');
    if (montant && nbr) {
      const mensualiteCalc = Math.round(montant / nbr);
      setMensualite(mensualiteCalc);
      const plan = Array.from({ length: nbr }, (_, i) => ({
        key: i,
        mois: `Mois ${i + 1}`,
        montant: mensualiteCalc,
      }));
      setPlanRemboursement(plan);
    } else {
      setMensualite(0);
      setPlanRemboursement([]);
    }
  };

  // Mise à jour du statut d'une avance
  const updateStatut = async (id, newStatut) => {
    try {
      await avanceService.updateStatus(id, newStatut);
      await loadAvances();
      await loadStatistics();
      message.success(`Statut mis à jour en "${newStatut}"`);
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  // Suppression d'une avance
  const deleteAvance = async (id) => {
    try {
      await avanceService.deleteAvance(id);
      await loadAvances();
      await loadStatistics();
      message.success('Avance supprimée avec succès');
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  // Rendu d'un employé
  const renderEmployee = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
      return <Text type="secondary">Employé non trouvé</Text>;
    }
    const colorList = [
  '#A3D5FF', // Bleu clair
  '#FFE0AC', // Orange pastel
  '#C8FACC', // Vert menthe
  '#FFD3E0', // Rose pâle
  '#FFFACD', // Jaune doux
  '#D8BFD8', // Lavande
  '#E0FFFF', // Aqua clair
  '#F0E68C', // Kaki clair
  '#E6E6FA', // Lavande claire
  '#FADADD', // Rose léger
];

    
    const name = `${employee.nom} ${employee.prenom || ''}`.trim();
    const index = employees.findIndex(e => e.id === employeeId);
    const color = colorList[index % colorList.length];
    
    return (
      <Space align="center">
        <Avatar 
          size="large" 
          style={{ backgroundColor: color, verticalAlign: 'middle' }} 
          icon={<UserOutlined />}
        >
          {name.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ fontSize: 16 }}>{name}</Text>
          <Tag color={color} style={{ marginTop: 4, fontWeight: 'bold', fontSize: 12 }}>
            {employee.poste || 'Employé'}
          </Tag>
        </div>
      </Space>
    );
  };

  // Ouverture du modal d'édition
  const openEditModal = (record) => {
    setEditingAvance(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      employee: record.employee,
      montant: record.montant,
      date_demande: moment(record.date_demande),
      motif: record.motif,
      nbr_mensualite: record.nbr_mensualite,
    });
    setTimeout(() => {
      updateMensualiteEtPlan();
    }, 100);
  };

  // Fermeture du modal
  const closeModal = () => {
    setIsModalVisible(false);
    setEditingAvance(null);
    form.resetFields();
    setMensualite(0);
    setPlanRemboursement([]);
  };

  // Soumission du formulaire
  const onFinish = async (values) => {
    try {
      const formData = {
        employee: values.employee,
        montant: Number(values.montant),
        date_demande: values.date_demande.format('YYYY-MM-DD'),
        motif: values.motif,
        nbr_mensualite: values.nbr_mensualite,
      };

      if (editingAvance) {
        // Mise à jour
        await avanceService.updateAvance(editingAvance.id, formData);
        message.success('Avance mise à jour avec succès');
        setSuccessMessage('Avance mise à jour');
      } else {
        // Création
        await avanceService.createAvance(formData);
        message.success('Avance créée avec succès');
        setSuccessMessage('Avance créée');
      }

      closeModal();
      await loadAvances();
      await loadStatistics();
    } catch (error) {
      message.error(handleApiError(error));
    }
  };

  // Actualisation des données
  const refreshData = async () => {
    await Promise.all([
      loadEmployees(),
      loadAvances(),
      loadStatistics()
    ]);
    message.success('Données actualisées');
  };

  // Calcul des statistiques affichées
  const displayStats = {
    actives: statistics.avances_actives || 0,
    pending: statistics.avances_pending || 0,
    total: statistics.total_montant || 0,
    rembourse: statistics.total_rembourse || 0,
    reste: statistics.total_reste || 0,
    totalAvances: statistics.total_avances || 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f0f5ff, #e6f7ff)', padding: 24 }}>
      <Title level={3} style={{ textAlign: 'left', color: '#1890ff', marginBottom: 24 }}>
        💰 Gestion des Avances
      </Title>

      {successMessage && (
        <Alert
          message={successMessage}
          type="success"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Statistiques */}
<Row 
  gutter={[16, 16]} 
  justify="space-between" 
  align="middle"
  style={{ marginBottom: 32, flexWrap: 'nowrap', overflowX: 'auto' }}
>
  {[{
    title: "Avances Actives", value: displayStats.actives, color: '#52c41a', icon: <CheckCircleOutlined />
  }, {
    title: "En Attente", value: displayStats.pending, color: '#faad14', icon: <ClockCircleOutlined />
  }, {
    title: "Montant Total", value: displayStats.total, color: '#1890ff', icon: <DollarOutlined />
  }, {
    title: "Remboursé", value: displayStats.rembourse, color: '#52c41a', icon: <DollarOutlined />
  }, {
    title: "Reste à Rembourser", value: displayStats.reste, color: '#cf1322', icon: <DollarOutlined />
  }].map((item, index) => (
    <Col key={index} style={{ flex: 1, minWidth: 200 }}>
      <Card bordered hoverable>
        <Statistic
          title={item.title}
          value={item.value}
          valueStyle={{ color: item.color }}
          prefix={item.icon}
          suffix={item.suffix}
        />
      </Card>
    </Col>
  ))}
</Row>


      {/* Filtres + boutons */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} wrap align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="🔍 Rechercher par employé"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              allowClear
            />
          </Col>

          <Col xs={24} sm={8} md={6}>
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="Tous">Tous les statuts</Option>
              <Option value="En attente">En attente</Option>
              <Option value="Acceptée">Acceptée</Option>
              <Option value="Refusée">Refusée</Option>
            </Select>
          </Col>

          <Col xs={24} sm={8} md={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({ search: '' });
                setStatusFilter('Tous');
              }}
              style={{ width: '100%' }}
            >
              Réinitialiser
            </Button>
          </Col>

          <Col xs={24} sm={8} md={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshData}
              style={{ width: '100%' }}
              loading={loading}
            >
              Actualiser
            </Button>
          </Col>

          <Col xs={24} sm={8} md={4}>
            <Button 
              icon={<PlusOutlined />} 
              type="primary" 
              onClick={() => setIsModalVisible(true)}
              style={{ width: '100%' }}
            >
              Nouvelle Avance
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table des avances */}
      <Card>
      <Table
  dataSource={avances}
  rowKey="id"
  bordered
  size="small"
  loading={loading}
  pagination={{ 
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} avances`,
  }}
  columns={[
    {
      title: 'Employé',
      dataIndex: 'employee',
      key: 'employee',
      render: (employeeId) => renderEmployee(employeeId),
      width: 160,
    },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      render: (montant) => (
        <Text style={{ color: '#1890ff', fontSize: 12, fontWeight: 600 }}>
          {Number(montant).toLocaleString()} 
        </Text>
      ),
      sorter: (a, b) => Number(a.montant) - Number(b.montant),
      width: 100,
    },
    { 
      title: 'Date', 
      dataIndex: 'date_demande', 
      key: 'date_demande',
      render: (date) => (
        <Text style={{ fontSize: 12 }}>
          {moment(date).format('DD/MM/YYYY')}
        </Text>
      ),
      sorter: (a, b) => moment(a.date_demande) - moment(b.date_demande),
      width: 100,
    },
    { 
      title: 'Motif', 
      dataIndex: 'motif', 
      key: 'motif',
      ellipsis: true,
      render: (motif) => (
        <Tooltip title={motif}>
          <Text style={{ fontSize: 12 }}>{motif}</Text>
        </Tooltip>
      ),
      width: 140,
    },
    {
      title: 'Mensualités',
      dataIndex: 'nbr_mensualite',
      key: 'nbr_mensualite',
      render: (nbr, record) => (
        <div style={{ fontSize: 12 }}>
          <Text strong>{nbr} mois</Text><br />
          <Text type="secondary">
            {Number(record.mensualite).toLocaleString()} /mois
          </Text>
        </div>
      ),
      width: 100,
    },
    {
      title: 'Progression',
      dataIndex: 'progression',
      key: 'progression',
      render: (progression) => (
        <Progress 
          percent={Number(progression).toFixed(1)} 
          size="small"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      ),
      width: 120,
    },
    {
      title: 'Reste',
      dataIndex: 'reste',
      key: 'reste',
      render: (reste) => (
        <Text type="danger" style={{ fontSize: 12, fontWeight: 'bold' }}>
          {Number(reste).toLocaleString()} 
        </Text>
      ),
      sorter: (a, b) => Number(a.reste) - Number(b.reste),
      width: 100,
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => (
        <Tag color={statusColors[statut] || 'default'} style={{ fontSize: 11, fontWeight: 'bold' }}>
          {statut}
        </Tag>
      ),
      filters: [
        { text: 'En attente', value: 'En attente' },
        { text: 'Acceptée', value: 'Acceptée' },
        { text: 'Refusée', value: 'Refusée' },
      ],
      onFilter: (value, record) => record.statut === value,
      width: 90,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {record.statut === 'En attente' && (
            <>
              <Tooltip title="Accepter">
                <Button
                  icon={<CheckCircleOutlined />}
                  type="text"
                  style={{ color: '#52c41a', fontSize: 12 }}
                  onClick={() => updateStatut(record.id, 'Acceptée')}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Refuser">
                <Button
                  icon={<CloseCircleOutlined />}
                  type="text"
                  danger
                  onClick={() => updateStatut(record.id, 'Refusée')}
                  size="small"
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              type="text"
              onClick={() => openEditModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title="Êtes-vous sûr de supprimer cette avance ?"
              onConfirm={() => deleteAvance(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button 
                icon={<DeleteOutlined />} 
                type="text" 
                danger 
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]}
/>

      </Card>

      {/* Modal ajout/modification */}
      <Modal
        open={isModalVisible}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {editingAvance ? '✏️ Modifier l\'Avance' : '➕ Nouvelle Avance'}
          </div>
        }
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingAvance ? "Modifier" : "Enregistrer"}
        cancelText="Annuler"
        width={800}
        destroyOnClose
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={updateMensualiteEtPlan}
          onFinish={onFinish}
          scrollToFirstError
        >
          <Divider orientation="left">👤 Informations Employé</Divider>
          <Form.Item
            name="employee"
            label="Employé"
            rules={[{ required: true, message: "Veuillez sélectionner un employé" }]}
          >
            <Select 
              placeholder="Sélectionnez un employé" 
              showSearch 
              optionFilterProp="children"
              loading={employeesLoading}
              notFoundContent={employeesLoading ? <Spin size="small" /> : 'Aucun employé trouvé'}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.id}>
                  {emp.nom} {emp.prenom} - {emp.poste}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">💰 Détails de l'Avance</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="montant"
                label="Montant demandé"
                rules={[
                  { required: true, message: 'Veuillez saisir le montant' },
                  {
                    validator: (_, value) => {
                      if (value && value > 0) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Le montant doit être supérieur à 0'));
                    },
                  },
                ]}
              >
                <Input 
                  type="number" 
                  min={1}
                  
                  placeholder="Ex: 10000"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="date_demande"
                label="Date de demande"
                rules={[{ required: true, message: "Veuillez choisir une date" }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder="Sélectionnez une date"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="motif"
            label="Motif de la demande"
            rules={[{ required: false, message: "Veuillez saisir un motif" }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Décrivez la raison de cette demande d'avance..."
            />
          </Form.Item>

          <Divider orientation="left">📅 Plan de Remboursement</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="nbr_mensualite"
                label="Nombre de mensualités"
                rules={[{ required: true, message: "Veuillez choisir le nombre de mensualités" }]}
              >
                <Select placeholder="Choisissez la durée">
                  {[1, 3, 6, 12, 18, 24, 36].map((mois) => (
                    <Option key={mois} value={mois}>
                      {mois} {mois === 1 ? 'mois' : 'mois'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Mensualité calculée">
                <Input 
                  value={`${mensualite.toLocaleString()} `} 
                  readOnly 
                  style={{ 
                    background: '#C4E1E6', 
                    borderColor: '#6EACDA',
                    color: '#000000',
                    fontWeight: 'bold'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {planRemboursement.length > 0 && (
            <>
              <Divider orientation="left">🗓️ Détail des Mensualités</Divider>
              <Table
                dataSource={planRemboursement}
                rowKey="key"
                pagination={false}
                size="small"
                bordered
                columns={[
                  { 
                    title: 'Période', 
                    dataIndex: 'mois',
                    width: '50%',
                  },
                  {
                    title: 'Montant à rembourser',
                    dataIndex: 'montant',
                    width: '50%',
                    render: (montant) => (
                      <Text strong style={{ color: '#1890ff' }}>
                        {montant.toLocaleString()}
                      </Text>
                    ),
                  },
                ]}
              />
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AvancePage;
       