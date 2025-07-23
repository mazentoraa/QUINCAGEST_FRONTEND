import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Select,
  Input,
  Card,
  message,
  Popconfirm,
  Space,
  Empty,
} from "antd";
import {
  RollbackOutlined, // ← Remplace RestoreOutlined
  DeleteOutlined,
  ClearOutlined,
  LeftOutlined,
} from "@ant-design/icons";

import moment from "moment";
import AvoirService from "./Services/AvoirService";

const { Option } = Select;

export default function CorbeilleAvoirs({ onRetour }) {
  const [avoirsSupprimes, setAvoirsSupprimes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtres
  const [filterNumero, setFilterNumero] = useState("");
  const [filterFournisseur, setFilterFournisseur] = useState("");
  const [filterType, setFilterType] = useState("");

  const typeOptions = ["retour marchandise", "remise commerciale", "erreur facturation", "autres"];

  // Charger la corbeille
  const fetchCorbeille = async () => {
    setLoading(true);
    try {
      const data = await AvoirService.getCorbeille();
      let corbeilleList = [];
      if (data && Array.isArray(data.results)) {
        corbeilleList = data.results;
      } else if (Array.isArray(data)) {
        corbeilleList = data;
      } else if (data && typeof data === 'object') {
        corbeilleList = data.data || data.avoirs || [];
      }
      setAvoirsSupprimes(corbeilleList);
    } catch (error) {
      console.error("Erreur lors du chargement de la corbeille:", error);
      message.error("Erreur lors du chargement de la corbeille");
      setAvoirsSupprimes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorbeille();
  }, []);

  // Filtrer les avoirs supprimés
  const filteredAvoirs = avoirsSupprimes.filter((a) => {
    const avoirNumero = (a.numero || "").toLowerCase();
    const avoirFournisseur = (a.fournisseur || "").toLowerCase();
    const filterNum = (filterNumero || "").toLowerCase();
    const filterFourn = (filterFournisseur || "").toLowerCase();
    
    const matchNumero = !filterNum || avoirNumero.includes(filterNum);
    const matchFournisseur = !filterFourn || avoirFournisseur.includes(filterFourn);
    const matchType = !filterType || a.type_avoir === filterType;

    return matchNumero && matchFournisseur && matchType;
  });

  // Restaurer un avoir
  const handleRestaurer = async (id, numero) => {
    setLoading(true);
    try {
      await AvoirService.restaurer(id);
      message.success(`Avoir ${numero || `ID-${id}`} restauré avec succès`);
      await fetchCorbeille();
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      message.error("Erreur lors de la restauration");
    } finally {
      setLoading(false);
    }
  };

  // Suppression définitive
  const handleSupprimerDefinitivement = async (id, numero) => {
    setLoading(true);
    try {
      await AvoirService.supprimerDefinitivement(id);
      message.success(`Avoir ${numero || `ID-${id}`} supprimé définitivement`);
      await fetchCorbeille();
    } catch (error) {
      console.error("Erreur lors de la suppression définitive:", error);
      message.error("Erreur lors de la suppression définitive");
    } finally {
      setLoading(false);
    }
  };

  // Vider la corbeille
  const handleViderCorbeille = async () => {
    setLoading(true);
    try {
      const result = await AvoirService.viderCorbeille();
      message.success(result.message || "Corbeille vidée avec succès");
      await fetchCorbeille();
    } catch (error) {
      console.error("Erreur lors du vidage de la corbeille:", error);
      message.error("Erreur lors du vidage de la corbeille");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Numéro",
      dataIndex: "numero",
      key: "numero",
      width: 100,
      ellipsis: true,
    },
    {
      title: "Fournisseur",
      dataIndex: "fournisseur",
      key: "fournisseur",
      width: 140,
      ellipsis: true,
    },
    {
      title: "Article",
      key: "article_nom",
      width: 130,
      ellipsis: true,
      render: (_, record) =>
        record.articles && record.articles.length > 0 ? (
          <>
            {record.articles.map((a, i) => (
              <div
                key={i}
                style={{
                  borderBottom:
                    i !== record.articles.length - 1
                      ? "1px solid #f0f0f0"
                      : "none",
                  padding: "4px 0",
                }}
              >
                {a.nom}
              </div>
            ))}
          </>
        ) : (
          <em>Aucun article</em>
        ),
    },
    {
      title: "Date suppression",
      dataIndex: "deleted_at",
      key: "deleted_at",
      width: 140,
      ellipsis: true,
      render: (val) => (val ? moment(val).format("DD/MM/YYYY HH:mm") : "-"),
    },
    {
      title: "Montant Total",
      dataIndex: "montant_total",
      key: "montant_total",
      width: 110,
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            icon={<RollbackOutlined/>}
            type="primary"
            ghost
            onClick={() => handleRestaurer(record.id, record.numero)}
            title="Restaurer"
          >
            Restaurer
          </Button>
          <Popconfirm
            title="Supprimer définitivement cet avoir ?"
            description="Cette action est irréversible !"
            onConfirm={() => handleSupprimerDefinitivement(record.id, record.numero)}
            okText="Oui, supprimer"
            cancelText="Annuler"
            okType="danger"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              title="Supprimer définitivement"
            >
              Supprimer
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .custom-table .ant-table-container {
          border: none !important;
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 0.5px solid #e0e0e0 !important;
        }
        .custom-table .ant-table-cell {
          border-left: 0.2px solid #d9d9d9 !important;
          border-right: 0px solid #d9d9d9 !important;
        }
        .custom-table .ant-table-tbody > tr > td:first-child {
          border-left: none !important;
        }
        .custom-table .ant-table-tbody > tr > td:last-child {
          border-right: none !important;
        }
        .custom-table .ant-table-thead > tr > th {
          border-left: 0.2px solid #d9d9d9 !important;
          border-right: 0px solid #d9d9d9 !important;
          border-bottom: 0.2px solid #e0e0e0 !important;
        }
        .custom-table .ant-table-thead > tr > th:first-child {
          border-left: none !important;
        }
        .custom-table .ant-table-thead > tr > th:last-child {
          border-right: none !important;
        }
      `}</style>

      <Card
        title={
          <div
            style={{
              padding: "7px 20px 30px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            {/* Partie gauche : bouton retour + titre */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Button
                icon={<LeftOutlined />}
                onClick={onRetour}
                style={{
                  borderRadius: "12px",
                  height: "48px",
                  padding: "0 20px",
                  border: "2px solid #1890ff",
                  color: "#1890ff",
                  fontWeight: 600,
                  background: "#ffffff",
                }}
              >
                Retour
              </Button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "48px",
                  height: "48px",
                  borderRadius: "16px",
                  background: "#ff7875",
                  boxShadow: "0 6px 20px rgba(255, 120, 117, 0.25)",
                }}
              >
                <DeleteOutlined style={{ fontSize: "24px", color: "#ffffff" }} />
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    color: "#ff7875",
                    fontSize: "28px",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Corbeille des Avoirs
                </h2>
                <span style={{ color: "#64748b", fontSize: "14px" }}>
                  {avoirsSupprimes.length} avoir{avoirsSupprimes.length !== 1 ? "s" : ""} supprimé
                  {avoirsSupprimes.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Partie droite : bouton vider corbeille */}
            {avoirsSupprimes.length > 0 && (
              <Popconfirm
                title="Vider complètement la corbeille ?"
                description="Tous les avoirs seront supprimés définitivement !"
                onConfirm={handleViderCorbeille}
                okText="Oui, vider"
                cancelText="Annuler"
                okType="danger"
              >
                <Button
                  icon={<ClearOutlined />}
                  danger
                  size="large"
                  style={{
                    borderRadius: "12px",
                    height: "48px",
                    padding: "0 24px",
                    fontWeight: 600,
                    fontSize: "15px",
                  }}
                >
                  Vider la corbeille
                </Button>
              </Popconfirm>
            )}
          </div>
        }
      >
        {/* FILTRES */}
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <Input
            placeholder="Numéro"
            value={filterNumero}
            onChange={(e) => setFilterNumero(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />

          <Input
            placeholder="Fournisseur"
            value={filterFournisseur}
            onChange={(e) => setFilterFournisseur(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />

          <Select
            placeholder="Sélectionner un type"
            value={filterType || undefined}
            onChange={(value) => setFilterType(value)}
            allowClear
            style={{ width: 180 }}
          >
            {typeOptions.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
        </div>

        {/* TABLEAU OU MESSAGE VIDE */}
        {filteredAvoirs.length === 0 ? (
          <Empty
            description="Aucun avoir dans la corbeille"
            style={{ padding: "60px 0" }}
          />
        ) : (
          <Table
            className="custom-table"
            columns={columns}
            dataSource={filteredAvoirs}
            rowKey="id"
            loading={loading}
            bordered={false}
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10 }}
            style={{ width: "100%" }}
          />
        )}
      </Card>
    </>
  );
}