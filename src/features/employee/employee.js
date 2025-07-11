// ... (imports identiques)
import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  ScheduleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const statusColors = {
  Actif: 'green',
  'En congé': 'orange',
  Suspendu: 'red',
  Inactif: 'gray',
};

const EmployeeManagement = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', department: '' });

  const handleAddEmployee = (values) => {
    const newEmployee = {
      ...values,
      id: Math.floor(Math.random() * 100000),
      date: moment().format('YYYY-MM-DD'),
    };
    setEmployees([...employees, newEmployee]);
    setIsModalVisible(false);
    form.resetFields();
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchMatch = emp.nom?.toLowerCase().includes(filters.search.toLowerCase());
    const statusMatch = filters.status ? emp.statut === filters.status : true;
    const deptMatch = filters.department ? emp.departement === filters.department : true;
    return searchMatch && statusMatch && deptMatch;
  });

  const stats = {
    total: employees.length,
    actifs: employees.filter((e) => e.statut === 'Actif').length,
    conges: employees.filter((e) => e.statut === 'En congé').length,
    suspendus: employees.filter((e) => e.statut === 'Suspendu').length,
    inactifs: employees.filter((e) => e.statut === 'Inactif').length,
    masse: employees.reduce((sum, e) => sum + Number(e.salaire || 0), 0),
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Nom Complet', dataIndex: 'nom', key: 'nom' },
    { title: 'Poste', dataIndex: 'poste', key: 'poste' },
    { title: 'Département', dataIndex: 'departement', key: 'departement' },
    {
      title: 'Salaire',
      dataIndex: 'salaire',
      key: 'salaire',
      render: (s) => `${s}`,
    },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (statut) => {
        const color = statusColors[statut] || 'default';
        return <Tag color={color}>{statut}</Tag>;
      },
    },
    {
      title: 'Actions',
      render: () => (
        <>
          <Tooltip title="Modifier">
            <Button icon={<EditOutlined />} type="text" style={{ color: '#1890ff' }} />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button icon={<DeleteOutlined />} type="text" danger style={{ marginLeft: 8 }} />
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #f0f5ff, #e6f7ff)',
        padding: 24,
      }}
    >
      <Title level={3} style={{ textAlign: 'left', color: '#1890ff', marginBottom: 24 }}>
        👨‍💼 Gestion des Employés
      </Title>

      {/* Statistiques */}
      <Row gutter={16} style={{ marginBottom: 32 }}>
        <Col span={6}>
          <Card bordered hoverable>
            <UserOutlined style={{ fontSize: 28, color: '#1890ff' }} />
            <Title level={4}>Total Employés</Title>
            <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.total}</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered hoverable>
            <TeamOutlined style={{ fontSize: 28, color: 'green' }} />
            <Title level={4}>Actifs</Title>
            <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.actifs}</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered hoverable>
            <ScheduleOutlined style={{ fontSize: 28, color: 'orange' }} />
            <Title level={4}>En Congé</Title>
            <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.conges}</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered hoverable>
            <DollarOutlined style={{ fontSize: 28, color: '#faad14' }} />
            <Title level={4}>Masse Salariale</Title>
            <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.masse}</p>
          </Card>
        </Col>
      </Row>

      {/* Filtres */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Input
              placeholder="🔍 Rechercher employé"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="🟢 Statut"
              onChange={(val) => setFilters({ ...filters, status: val })}
              allowClear
              style={{ width: '100%' }}
            >
              {Object.keys(statusColors).map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="🏢 Département"
              onChange={(val) => setFilters({ ...filters, department: val })}
              allowClear
              style={{ width: '100%' }}
            >
              {['Production', 'Administration', 'Ventes', 'IT', 'RH'].map((dep) => (
                <Option key={dep} value={dep}>
                  {dep}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tableau */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4}>👥 Liste des Employés</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Ajouter Employé
          </Button>
        </div>
        <Table
          dataSource={filteredEmployees}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title="➕ Ajouter un Employé"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
        width={800}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleAddEmployee}>
          <Divider orientation="left">📋 Informations personnelles</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="nom" label="Nom Complet" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="id_employe" label="ID"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="cin" label="CIN"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="telephone" label="Téléphone"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email"><Input type="email" /></Form.Item></Col>
            <Col span={12}><Form.Item name="date_naissance" label="Date de naissance"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="adresse" label="Adresse"><Input /></Form.Item></Col>
          </Row>

          <Divider orientation="left">💼 Informations professionnelles</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="poste" label="Poste"><Select>{['Chef d\'équipe', 'Comptable', 'Vendeur', 'Secrétaire', 'Technicien'].map(p => <Option key={p} value={p}>{p}</Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="departement" label="Département"><Select>{['Production', 'Administration', 'Ventes', 'IT', 'RH'].map(d => <Option key={d} value={d}>{d}</Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="date_embauche" label="Date d'embauche"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="statut" label="Statut"><Select>{Object.keys(statusColors).map((s) => <Option key={s} value={s}>{s}</Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="salaire" label="Salaire de base"><Input type="number" /></Form.Item></Col>
            <Col span={12}><Form.Item name="type_contrat" label="Type de contrat"><Select>{['CDD', 'CDI', 'Stage'].map((t) => <Option key={t} value={t}>{t}</Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="responsable" label="Responsable direct"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="code_contrat" label="Code contrat"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
