import React, { useEffect } from 'react';
import { Form, Input, Button, Typography, Card } from 'antd';
import ClientModel from '../models/ClientModel';

const { TextArea } = Input;

const ClientForm = ({ initialValues, onFinish, onCancel, loading, isEdit }) => {
  const [form] = Form.useForm();
  
  // Reset form with initial values when they change
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        nomClient: initialValues.nomClient || '',
        numeroFiscal: initialValues.numeroFiscal || '',
        adresse: initialValues.adresse || '',
        telephone: initialValues.telephone || '',
        nomResponsable: initialValues.nomResponsable || '',
        email: initialValues.email || '',
        emailResponsable: initialValues.emailResponsable || '',
        telephoneResponsable: initialValues.telephoneResponsable || '',
        autreNumero: initialValues.autreNumero || '',
        informationsComplementaires: initialValues.informationsComplementaires || '',
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  // Validate if input is numeric
  const validateNumeric = (_, value) => {
    if (value && !/^\d+$/.test(value)) {
      return Promise.reject(new Error('Veuillez entrer uniquement des chiffres'));
    }
    return Promise.resolve();
  };

  // Validate email format
  const validateEmail = (_, value) => {
    if (value && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
      return Promise.reject(new Error('Format d\'email invalide'));
    }
    return Promise.resolve();
  };

  return (
    <Card>
      <Typography.Title level={4}>
        {isEdit ? 'Modifier un client' : 'Ajouter un nouveau client'}
      </Typography.Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="nomClient"
          label="Nom du client"
          rules={[{ required: true, message: 'Le nom du client est obligatoire' }]}
        >
          <Input placeholder="Entrez le nom du client" />
        </Form.Item>

        <Form.Item
          name="numeroFiscal"
          label="Numéro d'enregistrement fiscal"
          rules={[{ required: true, message: 'Le numéro d\'enregistrement fiscal est obligatoire' }]}
        >
          <Input placeholder="Entrez le numéro d'enregistrement fiscal" />
        </Form.Item>

        <Form.Item
          name="adresse"
          label="Adresse"
        >
          <Input placeholder="Entrez l'adresse du client" />
        </Form.Item>

        <Form.Item
          name="telephone"
          label="Numéro de téléphone"
          rules={[{ validator: validateNumeric }]}
        >
          <Input placeholder="Entrez le numéro de téléphone" />
        </Form.Item>

        <Form.Item
          name="nomResponsable"
          label="Nom du responsable"
        >
          <Input placeholder="Entrez le nom du responsable ou gérant" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email du client"
          rules={[{ validator: validateEmail }]}
        >
          <Input placeholder="Entrez l'email du client" />
        </Form.Item>

        <Form.Item
          name="emailResponsable"
          label="Email du responsable"
          rules={[{ validator: validateEmail }]}
        >
          <Input placeholder="Entrez l'email du responsable" />
        </Form.Item>

        <Form.Item
          name="telephoneResponsable"
          label="Téléphone du responsable"
          rules={[{ validator: validateNumeric }]}
        >
          <Input placeholder="Entrez le numéro de téléphone du responsable" />
        </Form.Item>

        <Form.Item
          name="autreNumero"
          label="Autre numéro (optionnel)"
          rules={[{ validator: validateNumeric }]}
        >
          <Input placeholder="Entrez un autre numéro (optionnel)" />
        </Form.Item>

        <Form.Item
          name="informationsComplementaires"
          label="Informations complémentaires"
        >
          <TextArea rows={4} placeholder="Entrez des informations complémentaires" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: '10px' }}>
            {isEdit ? 'Mettre à jour' : 'Ajouter'}
          </Button>
          <Button onClick={onCancel}>
            Annuler
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ClientForm;
