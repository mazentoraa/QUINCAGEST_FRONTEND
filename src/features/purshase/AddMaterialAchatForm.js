import {
  Col,
  DatePicker,
  Divider,
  Input,
  InputNumber,
  Row,
  Select,
  Form,
  Button,
  Typography,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import React, { useEffect } from "react";
import moment from "moment";

const { Option } = Select;

export default function AddMaterialForm(props) {
  const [form] = Form.useForm();

  function formatDateToYYYYMMDD(date) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const updateSurface = () => {
    const longueur = parseFloat(form.getFieldValue("longueur") || 0);
    const largeur = parseFloat(form.getFieldValue("largeur") || 0);
    const surface = longueur * largeur;
    form.setFieldsValue({ surface: isNaN(surface) ? 0 : surface });
  };

  useEffect(() => {
    if (props.initial_values) {
      form.setFieldsValue({
        ref: props.initial_values.ref || "",
        nom_matiere: props.initial_values.nom_matiere || "",
        categorie: props.initial_values.categorie || "",
        description: props.initial_values.description || "",
        unite_mesure: props.initial_values.unite_mesure || "",
        remaining_quantity: props.initial_values.remaining_quantity || 0,
        stock_minimum: props.initial_values.stock_minimum || 0,
        emplacement: props.initial_values.emplacement || "",
        fournisseur_principal: props.initial_values.fournisseur_principal || "",
        prix_unitaire: props.initial_values.prix_unitaire || 0,
        date_reception: props.initial_values.date_reception
          ? moment(props.initial_values.date_reception)
          : null,
        ref_fournisseur: props.initial_values.ref_fournisseur || "",
        longueur: props.initial_values.longueur || 0,
        largeur: props.initial_values.largeur || 0,
        epaisseur: props.initial_values.epaisseur || 0,
        surface: props.initial_values.surface || 0,
      });
    } else {
      form.resetFields();
    }
  }, [props.initial_values, form]);

  const handleSubmit = (values) => {
    const material_data = {
      ref: values.ref,
      nom_matiere: values.nom_matiere,
      categorie: values.categorie,
      description: values.description,
      unite_mesure: values.unite_mesure,
      remaining_quantity: values.remaining_quantity,
      stock_minimum: values.stock_minimum,
      emplacement: values.emplacement,
      fournisseur_principal: values.fournisseur_principal,
      prix_unitaire: values.prix_unitaire,
      date_reception: values.date_reception
        ? formatDateToYYYYMMDD(values.date_reception)
        : null,
      ref_fournisseur: values.ref_fournisseur,
      longueur: values.longueur,
      largeur: values.largeur,
      epaisseur: values.epaisseur,
      surface: values.surface,
    };

    props.on_finish(material_data);
  };

  const sharedInputStyle = {
    borderRadius: "10px",
    height: "42px",
    border: "1.5px solid #d1d5db",
  };

  const labelStyle = { color: "#374151", fontWeight: 600 };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{  padding: 24, borderRadius: 16 }}
    >
      <Divider />
      <Typography.Title level={5}>📦 Informations Générales</Typography.Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="ref" label={<span style={labelStyle}>Référence</span>}>
            <Input placeholder="🔖 MP-XXX-###" style={sharedInputStyle} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="nom_matiere" label={<span style={labelStyle}>Nom de la matière</span>}>
            <Input placeholder="🧱 Ex: Acier inoxydable 316L" style={sharedInputStyle} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="categorie" label={<span style={labelStyle}>Type de matériau</span>}>
            <Select placeholder="📂 Sélectionner un matériau" style={sharedInputStyle}>
              <Option value="acier">Acier</Option>
              <Option value="acier_inoxydable">Acier inoxydable</Option>
              <Option value="aluminium">Aluminium</Option>
              <Option value="laiton">Laiton</Option>
              <Option value="cuivre">Cuivre</Option>
              <Option value="acier_galvanise">Acier galvanisé</Option>
              <Option value="metaux">Métaux</Option>
              <Option value="autre">Autre</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="longueur" label={<span style={labelStyle}>Longueur (m)</span>}>
            <InputNumber
              style={{ width: "100%", ...sharedInputStyle }}
              min={0}
              onChange={updateSurface}
              placeholder="Ex: 2.5"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="largeur" label={<span style={labelStyle}>Largeur (m)</span>}>
            <InputNumber
              style={{ width: "100%", ...sharedInputStyle }}
              min={0}
              onChange={updateSurface}
              placeholder="Ex: 1.2"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="epaisseur" label={<span style={labelStyle}>Épaisseur (mm)</span>}>
            <InputNumber
              style={{ width: "100%", ...sharedInputStyle }}
              min={0}
              placeholder="Ex: 0.5"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="surface" label={<span style={labelStyle}>Surface (m²)</span>}>
            <InputNumber
              style={{ width: "100%", ...sharedInputStyle }}
              disabled
              placeholder="Calcul automatique"
            />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={5}>📦 Gestion de Stock</Typography.Title>
      <Row gutter={12}>
        <Col span={7}>
          <Form.Item name="remaining_quantity" label={<span style={labelStyle}>Stock actuel</span>}>
            <InputNumber style={{ width: "100%", ...sharedInputStyle }} min={0} placeholder="0" />
          </Form.Item>
        </Col>
        <Col span={7}>
          <Form.Item name="stock_minimum" label={<span style={labelStyle}>Stock minimum</span>}>
            <InputNumber style={{ width: "100%", ...sharedInputStyle }} min={0} placeholder="10" />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item name="emplacement" label={<span style={labelStyle}>Emplacement</span>}>
            <Input placeholder="📍 Zone de stockage" style={sharedInputStyle} />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={5}>🏷 Informations Fournisseur</Typography.Title>
      <Row gutter={12}>
        <Col span={9}>
          <Form.Item name="fournisseur_principal" label={<span style={labelStyle}>Fournisseur principal</span>}>
            <Input placeholder="🏢 Nom du fournisseur" style={sharedInputStyle} />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item name="prix_unitaire" label={<span style={labelStyle}>Prix unitaire</span>}>
            <InputNumber
              min={0}
              step={0.001}
              style={{ width: "100%", ...sharedInputStyle }}
              placeholder="0.000"
            />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item name="date_reception" label={<span style={labelStyle}>Date réception</span>}>
            <DatePicker
              placeholder="📅 Sélectionner une date"
              style={{ width: "100%", ...sharedInputStyle }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item name="ref_fournisseur" label={<span style={labelStyle}>Réf. fournisseur</span>}>
            <Input placeholder="📄 REF-FOURN" style={sharedInputStyle} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label={<span style={labelStyle}>Description</span>}>
        <TextArea
          placeholder="📝 Description détaillée de la matière première..."
          style={{ borderRadius: 12, resize: "none", fontSize: 14, border: "1.5px solid #d1d5db" }}
          rows={3}
        />
      </Form.Item>

      <Divider />
      <Form.Item>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button
            onClick={() => {
              props.setIsModalVisible(false);
              form.resetFields();
            }}
            style={{ borderRadius: 10, border: "1px solid #d1d5db", height: 40 }}
          >
            Annuler
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={props.loading}
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              border: "none",
              fontWeight: 600,
              borderRadius: 10,
              height: 40,
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
            }}
          >
            {props.isEditing ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
}
