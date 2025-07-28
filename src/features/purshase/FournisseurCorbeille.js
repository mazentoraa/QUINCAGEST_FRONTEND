import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Input,
  Tooltip,
} from "antd";
import { 
  UndoOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  DeleteFilled
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import FournisseurService from "./Services/FournisseurService";

export default function FournisseurCorbeille() {
  const navigate = useNavigate();
  const [trashedFournisseurs, setTrashedFournisseurs] = useState([]);
  const [filteredTrashedFournisseurs, setFilteredTrashedFournisseurs] = useState([]);
  const [loading, setLoading] = useState(false);

  // États pour les filtres
  const [searchNom, setSearchNom] = useState("");
  const [searchNumRegFiscal, setSearchNumRegFiscal] = useState("");

  const fetchTrashedFournisseurs = async () => {
    setLoading(true);
    try {
      const data = await FournisseurService.getTrash();
      let list = [];
      if (data && Array.isArray(data.results)) {
        list = data.results;
      } else if (Array.isArray(data)) {
        list = data;
      }
      setTrashedFournisseurs(list);
      setFilteredTrashedFournisseurs(list);
    } catch (error) {
      message.error("Erreur lors du chargement de la corbeille");
      setTrashedFournisseurs([]);
      setFilteredTrashedFournisseurs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashedFournisseurs();
  }, []);

  // Filtrer fournisseurs dans la corbeille
  useEffect(() => {
    let filtered = trashedFournisseurs;

    if (searchNom) {
      filtered = filtered.filter((f) =>
        f.nom.toLowerCase().includes(searchNom.toLowerCase())
      );
    }
    if (searchNumRegFiscal) {
      filtered = filtered.filter((f) =>
        f.num_reg_fiscal
          ? f.num_reg_fiscal.toLowerCase().includes(searchNumRegFiscal.toLowerCase())
          : false
      );
    }
    setFilteredTrashedFournisseurs(filtered);
  }, [searchNom, searchNumRegFiscal, trashedFournisseurs]);

  const onSearchNomChange = (e) => {
    setSearchNom(e.target.value);
  };

  const onSearchNumRegFiscalChange = (e) => {
    setSearchNumRegFiscal(e.target.value);
  };

  const clearFilters = () => {
    setSearchNom("");
    setSearchNumRegFiscal("");
  };

  const handleRestore = async (id) => {
    setLoading(true);
    try {
      await FournisseurService.restore(id);
      message.success("Fournisseur restauré avec succès");
      await fetchTrashedFournisseurs();
      clearFilters();
    } catch (error) {
      message.error("Erreur lors de la restauration");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (id) => {
    setLoading(true);
    try {
      await FournisseurService.permanentDelete(id);
      message.success("Fournisseur supprimé définitivement");
      await fetchTrashedFournisseurs();
      clearFilters();
    } catch (error) {
      message.error("Erreur lors de la suppression définitive");
    } finally {
      setLoading(false);
    }
  };

  // Colonnes pour les fournisseurs dans la corbeille
  const columns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      width: 200,
    },
    {
      title: "Numéro d'enregistrement fiscal",
      dataIndex: "num_reg_fiscal",
      key: "num_reg_fiscal",
      width: 200,
    },
    {
      title: "Adresse",
      dataIndex: "adresse",
      key: "adresse",
      width: 250,
    },
    {
      title: "Numéro de téléphone",
      dataIndex: "telephone",
      key: "telephone",
      width: 150,
    },
    {
      title: "Informations complémentaires",
      dataIndex: "infos_complementaires",
      key: "infos_complementaires",
      width: 300,
      render: (text) => text || <em>Aucune info</em>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title="Restaurer">
            <Button
              icon={<UndoOutlined />}
              type="primary"
              onClick={() => handleRestore(record.id)}
              disabled={loading}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            />
          </Tooltip>
          <Popconfirm
            title="Supprimer définitivement ?"
            description="Cette action est irréversible !"
            onConfirm={() => handlePermanentDelete(record.id)}
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Tooltip title="Supprimer définitivement">
              <Button 
                icon={<DeleteOutlined />} 
                danger 
                disabled={loading}
                style={{ backgroundColor: '#ff4d4f' }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{ margin: 24 }}
      bodyStyle={{ padding: 24 }}
      title={null}
    >
      <div style={{
        padding: '7px 20px 30px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%)',
            boxShadow: '0 6px 20px rgba(255, 77, 79, 0.25)',
            position: 'relative'
          }}>
            <DeleteFilled style={{ fontSize: '24px', color: '#ffffff' }} />
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '18px',
              height: '18px',
              borderRadius: '10px',
              backgroundColor: '#faad14',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 'bold'
              }}>
                {trashedFournisseurs.length}
              </span>
            </div>
          </div>

          <div>
            <h2 style={{
              margin: 0,
              fontWeight: 600,
              color: '#ff4d4f',
              fontSize: "28px",
              letterSpacing: '-0.5px'
            }}>
              Corbeille des Fournisseurs
            </h2>
            <span style={{
              color: '#64748b',
              fontSize: '14px'
            }}>
              {trashedFournisseurs.length} fournisseur{trashedFournisseurs.length !== 1 ? 's' : ''} supprimé{trashedFournisseurs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/fournisseurs')}
          style={{
            borderRadius: '8px',
            height: 36,
            padding: '0 16px',
            background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
            border: 'none',
            fontWeight: 500,
            color: '#fff',
            boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
          }}
        >
          Retour à la liste
        </Button>
      </div>

      <Row justify="space-between" align="middle" style={{ marginBottom: 16, width: "100%" }}>
        <Col>
          <Row gutter={16} align="middle">
            <Col>
              <Input
                placeholder="Filtrer par nom"
                value={searchNom}
                onChange={onSearchNomChange}
                allowClear
                style={{ width: 240, height: 32 }}
              />
            </Col>
            <Col>
              <Input
                placeholder="Filtrer par numéro d'enregistrement fiscal"
                value={searchNumRegFiscal}
                onChange={onSearchNumRegFiscalChange}
                allowClear
                style={{ width: 280, height: 32 }}
              />
            </Col>
            <Col style={{ display: "flex", alignItems: "center" }}>
              <Button onClick={clearFilters} style={{ height: 32 }}>
                Effacer filtres
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredTrashedFournisseurs}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
        loading={loading}
        locale={{
          emptyText: "Aucun fournisseur dans la corbeille"
        }}
      />
    </Card>
  );
}