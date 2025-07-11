import React, { useState } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

const AvancePage = () => {
  const [isAvanceModalVisible, setIsAvanceModalVisible] = useState(false);
  const [avances, setAvances] = useState([]);
  const [employees, setEmployees] = useState([]); // This should be fetched from backend in real usage
  const [avanceForm] = Form.useForm();
  const [filters, setFilters] = useState({ search: '' });

  const updateStatut = (id, newStatut) => {
    setAvances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, statut: newStatut } : a))
    );
  };

  const avanceStats = {
    actives: avances.filter((a) => a.statut === 'Acceptée').length,
    pending: avances.filter((a) => a.statut === 'En attente').length,
    total: avances.reduce((sum, a) => sum + Number(a.montant || 0), 0),
    rembourse: avances.reduce((sum, a) => sum + ((a.montant || 0) * (a.progression / 100)), 0),
    reste: avances.reduce((sum, a) => sum + Number(a.reste || 0), 0),
  };

  const filteredAvances = avances.filter((a) =>
    a.employeeName?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', padding: 24 }}>
      <Title level={3}>💰 Gestion des Avances</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Title level={4}>Avances Actives</Title><p>{avanceStats.actives}</p></Card></Col>
        <Col span={6}><Card><Title level={4}>En Attente</Title><p>{avanceStats.pending}</p></Card></Col>
        <Col span={6}><Card><Title level={4}>Total Demandé</Title><p>{avanceStats.total} DH</p></Card></Col>
        <Col span={6}><Card><Title level={4}>Remboursé</Title><p>{avanceStats.rembourse.toFixed(0)} DH</p></Card></Col>
        <Col span={6}><Card><Title level={4}>Reste</Title><p>{avanceStats.reste} DH</p></Card></Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Input.Search
          placeholder="🔍 Rechercher avance par employé"
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ width: 300 }}
          allowClear
        />
        <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsAvanceModalVisible(true)}>
          Ajouter Avance
        </Button>
      </div>

      <Table
        dataSource={filteredAvances}
        rowKey="id"
        bordered
        pagination={{ pageSize: 8 }}
        columns={[
          { title: 'Employé', dataIndex: 'employeeName', key: 'employeeName' },
          { title: 'Montant', dataIndex: 'montant', key: 'montant', render: (m) => <span style={{ color: 'green', fontWeight: 600 }}>{m} DH</span> },
          { title: 'Date', dataIndex: 'dateDemande', key: 'dateDemande' },
          { title: 'Motif', dataIndex: 'motif', key: 'motif' },
          { title: 'Mensualité', dataIndex: 'mensualite', key: 'mensualite', render: (m) => `${m} DH` },
          {
            title: 'Progression',
            dataIndex: 'progression',
            key: 'progression',
            render: (p) => <Progress percent={p} size="small" />
          },
          {
            title: 'Reste',
            dataIndex: 'reste',
            key: 'reste',
            render: (r) => <span style={{ color: 'red' }}>{r} DH</span>
          },
          {
            title: 'Statut',
            dataIndex: 'statut',
            key: 'statut',
            render: (s) => <Tag color={s === 'Acceptée' ? 'green' : s === 'Refusée' ? 'red' : 'orange'}>{s}</Tag>
          },
          {
            title: 'Actions',
            render: (_, record) => (
              <Space>
                <Tooltip title="Accepter">
                  <Button icon={<CheckCircleOutlined />} type="text" style={{ color: 'green' }} onClick={() => updateStatut(record.id, 'Acceptée')} />
                </Tooltip>
                <Tooltip title="Refuser">
                  <Button icon={<CloseCircleOutlined />} type="text" danger onClick={() => updateStatut(record.id, 'Refusée')} />
                </Tooltip>
              </Space>
            )
          }
        ]}
      />

      <Modal
        open={isAvanceModalVisible}
        title="➕ Ajouter une Avance"
        onCancel={() => setIsAvanceModalVisible(false)}
        onOk={() => avanceForm.submit()}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={avanceForm} layout="vertical" onFinish={(values) => {
          const employee = employees.find(e => e.id === values.employeId);
          const montant = Number(values.montant);
          const mensualite = Math.round(montant / values.nbrMensualite);
          const newAvance = {
            id: Date.now(),
            employeeName: employee?.nom || 'Inconnu',
            employeId: values.employeId,
            montant,
            dateDemande: values.dateDemande.format('YYYY-MM-DD'),
            motif: values.motif,
            nbrMensualite: values.nbrMensualite,
            mensualite,
            progression: 0,
            reste: montant,
            statut: 'En attente',
          };
          setAvances([...avances, newAvance]);
          setIsAvanceModalVisible(false);
          avanceForm.resetFields();
        }}>
          <Divider orientation="left">👤 Employé</Divider>
          <Form.Item name="employeId" label="Employé" rules={[{ required: true }]}> 
            <Select placeholder="Sélectionnez un employé">
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.id}>{emp.nom}</Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">📋 Détails de la Demande</Divider>
          <Form.Item name="montant" label="Montant demandé (DH)" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="dateDemande" label="Date de demande" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="motif" label="Motif de la demande" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>

          <Divider orientation="left">💳 Plan de Remboursement</Divider>
          <Form.Item name="nbrMensualite" label="Nombre de mensualités" rules={[{ required: true }]}>
            <Select>
              {[6, 12, 18, 24].map((mois) => (
                <Option key={mois} value={mois}>{mois} mois</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AvancePage;
