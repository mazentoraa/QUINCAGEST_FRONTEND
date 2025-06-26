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

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Divider />
      <Typography.Title level={5}>Informations Générales</Typography.Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="ref" label="Référence">
            <Input placeholder="MP-XXX-###" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="nom_matiere" label="Nom de la matière">
            <Input placeholder="Ex: Acier inoxydable 316L" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="categorie" label="Type de matériau">
            <Select placeholder="Sélectionner un matériau">
              <Option value="acier">Acier</Option>
              <Option value="acier_inoxydable">Acier inoxydable</Option>
              <Option value="aluminium">Aluminium</Option>
              <Option value="laiton">Laiton</Option>
              <Option value="cuivre">Cuivre</Option>
              <Option value="acier_galvanise">Acier galvanisé</Option>
              <Option value="autre">Autre</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="longueur" label="Longueur (m)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              onChange={updateSurface}
              placeholder="Ex: 2.5"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="largeur" label="Largeur (m)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              onChange={updateSurface}
              placeholder="Ex: 1.2"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="epaisseur" label="Épaisseur (mm)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Ex: 0.5"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="surface" label="Surface (m²)">
            <InputNumber
              style={{ width: "100%" }}
              disabled
              placeholder="Calcul automatique"
            />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={5}>Gestion de Stock</Typography.Title>
      <Row gutter={12}>
        <Col span={7}>
          <Form.Item name="remaining_quantity" label="Stock actuel">
            <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
          </Form.Item>
        </Col>
        <Col span={7}>
          <Form.Item name="stock_minimum" label="Stock minimum">
            <InputNumber style={{ width: "100%" }} min={0} placeholder="10" />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item name="emplacement" label="Emplacement">
            <Input placeholder="Zone de stockage" />
          </Form.Item>
        </Col>
      </Row>

      <Typography.Title level={5}>Informations Fournisseur</Typography.Title>
      <Row gutter={12}>
        <Col span={9}>
          <Form.Item name="fournisseur_principal" label="Fournisseur principal">
            <Input placeholder="Saisir le fournisseur" />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item name="prix_unitaire" label="Prix unitaire">
            <InputNumber
              min={0}
              step={0.001}
              style={{ width: "100%" }}
              placeholder="0.000"
            />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item name="date_reception" label="Date réception">
            <DatePicker
              placeholder="Sélectionner une date"
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item name="ref_fournisseur" label="Réf. fournisseur">
            <Input placeholder="REF-FOURN" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="Description">
        <TextArea placeholder="Description détaillée de la matière première..." />
      </Form.Item>

      <Divider />
      <Form.Item>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button
            onClick={() => {
              props.setIsModalVisible(false);
              form.resetFields();
            }}
          >
            Annuler
          </Button>
          <Button type="primary" htmlType="submit" loading={props.loading}>
            {props.isEditing ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
}
