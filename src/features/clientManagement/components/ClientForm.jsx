import React, { useEffect } from 'react';
import { Form, Input, Button, Typography, Card } from 'antd';

const { TextArea } = Input;

const ClientForm = ({ initial_values, on_finish, on_cancel, loading, is_edit }) => {
  const [form] = Form.useForm();

  // Générer un code client unique local (exemple simple)
  const generateCodeClient = () => {
    return `CLT-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  // Remplir automatiquement le code client lors de l'ouverture du formulaire
  useEffect(() => {
    if (initial_values) {
      form.setFieldsValue({
        code_client: initial_values.code_client || '',
        nom_client: initial_values.nom_client || '',
        numero_fiscal: initial_values.numero_fiscal || '',
        adresse: initial_values.adresse || '',
        telephone: initial_values.telephone || '',
        nom_responsable: initial_values.nom_responsable || '',
        email: initial_values.email || '',
        email_responsable: initial_values.email_responsable || '',
        telephone_responsable: initial_values.telephone_responsable || '',
        autre_numero: initial_values.autre_numero || '',
        informations_complementaires: initial_values.informations_complementaires || '',
      });
    } else {
      // Si ajout, générer automatiquement le code client
      form.setFieldsValue({
        code_client: generateCodeClient()
      });
    }
  }, [initial_values, form]);

  const validate_numeric = (_, value) => {
    if (value && !/^\d+$/.test(value)) {
      return Promise.reject(new Error('Veuillez entrer uniquement des chiffres'));
    }
    return Promise.resolve();
  };

  const validate_email = (_, value) => {
    if (value && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
      return Promise.reject(new Error('Format d\'email invalide'));
    }
    return Promise.resolve();
  };

  const validate_matricule_fiscal = (_, value) => {
    const regex = /^\d{3}\s\d{4}[A-Z]\/[A-Z]\/[A-Z]\/\d{3}$/;
    if (value && !regex.test(value)) {
      return Promise.reject(new Error("Format attendu : 000 0000X/X/X/000"));
    }
    return Promise.resolve();
  };

  const handle_finish = (values) => {
    const client_data = {
      code_client: values.code_client,
      nom_client: values.nom_client,
      numero_fiscal: values.numero_fiscal,
      adresse: values.adresse,
      telephone: values.telephone,
      nom_responsable: values.nom_responsable,
      email: values.email,
      email_responsable: values.email_responsable,
      telephone_responsable: values.telephone_responsable,
      autre_numero: values.autre_numero,
      informations_complementaires: values.informations_complementaires
    };

    if (initial_values && initial_values.id) {
      client_data.id = initial_values.id;
    }

    on_finish(client_data);
  };

  return (
    <Card>
      <Typography.Title level={4}>
        {is_edit ? 'Modifier un client' : 'Ajouter un nouveau client'}
      </Typography.Title>
      <Form form={form} layout="vertical" onFinish={handle_finish}>
        <Form.Item name="code_client" label="Code client">
          <Input readOnly disabled placeholder="Généré automatiquement" />
        </Form.Item>

        <Form.Item
          name="nom_client"
          label="Nom du client"
          rules={[{ required: true, message: 'Le nom du client est obligatoire' }]}
        >
          <Input placeholder="Entrez le nom du client" />
        </Form.Item>

        <Form.Item
          name="numero_fiscal"
          label="Numéro d'enregistrement fiscal"
          rules={[
            { required: true, message: 'Le numéro d\'enregistrement fiscal est obligatoire' },
            { validator: validate_matricule_fiscal }
          ]}
        >
          <Input placeholder="000 0000X/X/X/000" />
        </Form.Item>

        <Form.Item name="adresse" label="Adresse">
          <Input placeholder="Entrez l'adresse du client" />
        </Form.Item>

        <Form.Item
          name="telephone"
          label="Numéro de téléphone"
          rules={[{ validator: validate_numeric }]}
        >
          <Input placeholder="Entrez le numéro de téléphone" />
        </Form.Item>

        <Form.Item name="nom_responsable" label="Nom du responsable">
          <Input placeholder="Entrez le nom du responsable ou gérant" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email du client"
          rules={[{ validator: validate_email }]}
        >
          <Input placeholder="Entrez l'email du client" />
        </Form.Item>

        <Form.Item
          name="email_responsable"
          label="Email du responsable"
          rules={[{ validator: validate_email }]}
        >
          <Input placeholder="Entrez l'email du responsable" />
        </Form.Item>

        <Form.Item
          name="telephone_responsable"
          label="Téléphone du responsable"
          rules={[{ validator: validate_numeric }]}
        >
          <Input placeholder="Entrez le numéro de téléphone du responsable" />
        </Form.Item>

        <Form.Item
          name="autre_numero"
          label="Autre numéro (optionnel)"
          rules={[{ validator: validate_numeric }]}
        >
          <Input placeholder="Entrez un autre numéro (optionnel)" />
        </Form.Item>

        <Form.Item name="informations_complementaires" label="Informations complémentaires">
          <TextArea rows={4} placeholder="Entrez des informations complémentaires" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: '10px' }}>
            {is_edit ? 'Mettre à jour' : 'Ajouter'}
          </Button>
          <Button onClick={on_cancel}>Annuler</Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ClientForm;
