import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Select, Input, Typography, Row, Col,
  Tag, Modal, Form, DatePicker, Divider, Tooltip, message, Popconfirm, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, TeamOutlined, ScheduleOutlined, DollarOutlined
} from '@ant-design/icons';
import moment from 'moment';
import EmployeeService from './EmployeeService';

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
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

const fetchEmployees = async () => {
  try {
    const res = await EmployeeService.getAll();
    const rawData = Array.isArray(res.data) ? res.data : (res.data.results || []);
    const data = rawData.map((emp) => ({
      ...emp,
      date_naissance: emp.date_naissance ? moment(emp.date_naissance) : null,
      date_embauche: emp.date_embauche ? moment(emp.date_embauche) : null,
      date: emp.created_at ? moment(emp.created_at).format('YYYY-MM-DD') : '',
    }));
    setEmployees(data);
  } catch (err) {
    console.error("Erreur fetchEmployees:", err);
    message.error("Erreur lors du chargement des employés.");
  }
};


  const openAddModal = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    form.setFieldsValue({
      ...employee,
      id_employe: employee.id_employe || '',
      date_naissance: employee.date_naissance || null,
      date_embauche: employee.date_embauche || null,
    });
    setIsModalVisible(true);
  };

const handleSubmit = async (values) => {
  const payload = {
    ...values,
    date_naissance: values.date_naissance?.format('YYYY-MM-DD'),
    date_embauche: values.date_embauche?.format('YYYY-MM-DD'),
  };

  // Vérifie si le code employé est déjà utilisé (hors mode édition)
  const isDuplicate = employees.some(
    (e) => e.id_employe === values.id_employe && (!editingEmployee || e.id !== editingEmployee.id)
  );

  if (isDuplicate) {
    // Affiche un message d'erreur directement sous le champ concerné
    form.setFields([
      {
        name: 'id_employe',
        errors: ['❌ Ce code employé existe déjà. Veuillez en choisir un autre.'],
      },
    ]);
    return;
  }

  try {
    if (editingEmployee) {
      await EmployeeService.update(editingEmployee.id, payload);
      setSuccessMessage("✅ Employé modifié avec succès.");
      message.success("✅ Employé modifié avec succès.");
    } else {
      await EmployeeService.create(payload);
      setSuccessMessage("✅ Employé ajouté avec succès.");
      message.success("✅ Employé ajouté avec succès.");
    }

    setIsModalVisible(false);
    form.resetFields();
    fetchEmployees();
    setEditingEmployee(null);
  } catch (err) {
    console.error(err);
    message.error(editingEmployee ? "❌ Erreur lors de la modification." : "❌ Erreur lors de l'ajout.");
  }
};


  const handleDelete = async (record) => {
    try {
      await EmployeeService.delete(record.id);
      message.success(`✅ Employé ${record.nom} supprimé avec succès.`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      message.error("❌ Erreur lors de la suppression.");
    }
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
    {
      title: 'Code Employé',
      dataIndex: 'id_employe',
      key: 'id_employe',
      render: (code) => `EMP-${code}`,
    },
    { title: 'Nom Complet', dataIndex: 'nom', key: 'nom' },
    { title: 'Poste', dataIndex: 'poste', key: 'poste' },
    { title: 'Département', dataIndex: 'departement', key: 'departement' },
    {
      title: 'Salaire',
      dataIndex: 'salaire',
      key: 'salaire',
      render: (s) => `${s} `,
    },
  {
  title: 'Date Embauche',
  dataIndex: 'date_embauche',
  key: 'date_embauche',
  render: (date) => date ? moment(date).format('DD/MM/YYYY') : '—',
},

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
      render: (_, record) => (
        <>
          <Tooltip title="Modifier">
            <Button
              icon={<EditOutlined />}
              type="text"
              style={{ color: '#1890ff' }}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title={`Voulez-vous vraiment supprimer l'employé ${record.nom} ?`}
              onConfirm={() => handleDelete(record)}
              okText="Oui"
              cancelText="Non"
            >
              <Button
                icon={<DeleteOutlined />}
                type="text"
                danger
                style={{ marginLeft: 8 }}
              />
            </Popconfirm>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'white', padding: 24 }}>
      <Title level={3} style={{ textAlign: 'left', color: '#1890ff', marginBottom: 24 }}>
        👨‍💼 Gestion des Employés
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
            <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.masse} </p>
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
                <Option key={status} value={status}>{status}</Option>
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
                <Option key={dep} value={dep}>{dep}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tableau */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4}>👥 Liste des Employés</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
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
        title={editingEmployee ? "✏️ Modifier un Employé" : "➕ Ajouter un Employé"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingEmployee(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
        width={800}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Divider orientation="left">📋 Informations personnelles</Divider>
          <Row gutter={16}>
            <Col span={12}>
            <Form.Item
  name="id_employe"
  label="Code Employé"
  rules={[{ required: true, message: "Veuillez saisir le code employé" }]}
>
  <Input
    placeholder="Ex: 1234"
    readOnly={!!editingEmployee}
/>
</Form.Item>

            </Col>
            <Col span={12}>
              <Form.Item
                name="nom"
                label="Nom Complet"
                rules={[{ required: true, message: "Veuillez entrer le nom complet" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="cin" label="CIN"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="telephone" label="Téléphone"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email"><Input type="email" /></Form.Item></Col>
            <Col span={12}><Form.Item name="date_naissance" label="Date de naissance"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="adresse" label="Adresse"><Input /></Form.Item></Col>
          </Row>
<Divider orientation="left">👨‍👩‍👧 Informations complémentaires</Divider>
<Row gutter={16}>
  <Col span={12}>
    <Form.Item name="numero_cnss" label="N° CNSS">
      <Input />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item name="situation_familiale" label="Situation familiale">
      <Select>
        <Option value="Célibataire">Célibataire</Option>
        <Option value="Marié(e)">Marié(e)</Option>
        <Option value="Divorcé(e)">Divorcé(e)</Option>
        <Option value="Veuf(ve)">Veuf(ve)</Option>
      </Select>
    </Form.Item>
  </Col>
   <Col span={12}>
    <Form.Item name="nombre_enfants" label="Nombre d'enfants">
      <Input type="number" min={0} />
    </Form.Item>
  </Col>
  <Col span={12}>
    <Form.Item name="enfants_a_charge" label="Enfants à charge">
     <Input type="number" min={0} />
    </Form.Item>
  </Col>
 

</Row>

          <Divider orientation="left">💼 Informations professionnelles</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="poste" label="Poste">
                <Select style={{ width: '100%' }}>
                  {['Chef d\'équipe', 'Comptable', 'Vendeur', 'Secrétaire', 'Technicien'].map(p => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="departement" label="Département">
                <Select style={{ width: '100%' }}>
                  {['Production', 'Administration', 'Ventes', 'IT', 'RH'].map(d => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_embauche" label="Date d'embauche">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="statut" label="Statut">
                <Select style={{ width: '100%' }}>
                  {Object.keys(statusColors).map(s => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="code_contrat" label="Code contrat"><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="type_contrat" label="Type de contrat">
                <Select style={{ width: '100%' }}>
                  {['CDD', 'CDI', 'Stage'].map(t => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="responsable" label="Responsable direct"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="salaire" label="Salaire de base"><Input type="number" /></Form.Item></Col>
              <Col span={24}>
    <Form.Item name="categorie" label="Catégorie">
      <Select>
        <Option value="Cadre">Cadre</Option>
        <Option value="Non Cadre">Non Cadre</Option>
      </Select>
    </Form.Item>
  </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
