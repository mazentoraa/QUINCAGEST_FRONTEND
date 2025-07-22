import React, { useEffect } from 'react';
import { Form, Input, Button, Typography, Card, Row, Col, Space, Divider } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, IdcardOutlined, FileTextOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

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

  const SectionCard = ({ icon, title, description, color, children }) => (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      border: `2px solid ${color}15`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '20px' 
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          backgroundColor: color,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${color}25`
        }}>
          {React.cloneElement(icon, { 
            style: { color: '#ffffff', fontSize: '20px' } 
          })}
        </div>
        <div>
          <Text style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: '#1a1a1a',
            display: 'block',
            lineHeight: '1.2'
          }}>
            {title}
          </Text>
          {description && (
            <Text style={{ 
              fontSize: '13px', 
              color: '#6b7280',
              marginTop: '2px',
              display: 'block'
            }}>
              {description}
            </Text>
          )}
        </div>
      </div>
      {children}
    </div>
  );

  const StyledFormItem = ({ children, ...props }) => (
    <Form.Item {...props}>
      {React.cloneElement(children, {
        ...children.props,
        style: {
          borderRadius: '10px',
          height: '44px',
          border: '2px solid #e5e7eb',
          transition: 'all 0.3s ease',
          fontSize: '15px',
          ...children.props.style
        },
        onFocus: (e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        },
        onBlur: (e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
        }
      })}
    </Form.Item>
  );

  const RequiredLabel = ({ children }) => (
    <span style={{ fontWeight: '600', color: '#374151' }}>
      {children} <span style={{ color: '#ef4444' }}>*</span>
    </span>
  );

  const OptionalLabel = ({ children }) => (
    <span style={{ fontWeight: '500', color: '#374151' }}>
      {children}
    </span>
  );

  return (
    <div style={{ 
      maxHeight: '75vh', 
      overflowY: 'auto', 
      paddingRight: '12px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      margin: '-16px',
      padding: '24px'
    }}>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handle_finish}
      >


        {/* Section Informations générales */}
        <SectionCard
          icon={<IdcardOutlined />}
          title="Informations générales"
          description="Données essentielles du client"
          color="#3b82f6"
        >
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12}>
              <StyledFormItem name="code_client" label={<OptionalLabel>Code client</OptionalLabel>}>
                <Input 
                  readOnly 
                  disabled 
                  placeholder="🔢 Généré automatiquement"
                  style={{
                    backgroundColor: '#f8fafc',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}
                />
              </StyledFormItem>
            </Col>
            <Col xs={24} sm={12}>
              <StyledFormItem
                name="nom_client"
                label={<RequiredLabel>Nom du client</RequiredLabel>}
                rules={[{ required: true, message: 'Le nom du client est obligatoire' }]}
              >
                <Input 
                  placeholder="🏢 Entrez le nom du client"
                  prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
          </Row>

          <StyledFormItem
            name="numero_fiscal"
            label={<RequiredLabel>Numéro d'enregistrement fiscal</RequiredLabel>}
            rules={[
              { required: true, message: 'Le numéro d\'enregistrement fiscal est obligatoire' },
              { validator: validate_matricule_fiscal }
            ]}
          >
            <Input 
              placeholder="📋 Format: 000 0000X/X/X/000"
              style={{ fontFamily: 'monospace' }}
            />
          </StyledFormItem>

          <StyledFormItem name="adresse" label={<OptionalLabel>Adresse</OptionalLabel>}>
            <Input 
              placeholder="🏠 Entrez l'adresse complète du client"
              prefix={<HomeOutlined style={{ color: '#9ca3af' }} />}
            />
          </StyledFormItem>

          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12}>
              <StyledFormItem
                name="telephone"
                label={<OptionalLabel>Téléphone principal</OptionalLabel>}
                rules={[{ validator: validate_numeric }]}
              >
                <Input 
                  placeholder="📞 Numéro de téléphone"
                  prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
            <Col xs={24} sm={12}>
              <StyledFormItem
                name="email"
                label={<OptionalLabel>Email du client</OptionalLabel>}
                rules={[{ validator: validate_email }]}
              >
                <Input 
                  placeholder="✉️ adresse@email.com"
                  prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
          </Row>
        </SectionCard>

        {/* Section Responsable */}
        <SectionCard
          icon={<UserOutlined />}
          title="Informations du responsable"
          description="Coordonnées de la personne de contact"
          color="#10b981"
        >
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12}>
              <StyledFormItem name="nom_responsable" label={<OptionalLabel>Nom du responsable</OptionalLabel>}>
                <Input 
                  placeholder="👤 Nom du responsable ou gérant"
                  prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
            <Col xs={24} sm={12}>
              <StyledFormItem
                name="email_responsable"
                label={<OptionalLabel>Email du responsable</OptionalLabel>}
                rules={[{ validator: validate_email }]}
              >
                <Input 
                  placeholder="📧 Email professionnel"
                  prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
          </Row>

          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12}>
              <StyledFormItem
                name="telephone_responsable"
                label={<OptionalLabel>Téléphone du responsable</OptionalLabel>}
                rules={[{ validator: validate_numeric }]}
              >
                <Input 
                  placeholder="📱 Téléphone direct"
                  prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
            <Col xs={24} sm={12}>
              <StyledFormItem
                name="autre_numero"
                label={<OptionalLabel>Numéro alternatif</OptionalLabel>}
                rules={[{ validator: validate_numeric }]}
              >
                <Input 
                  placeholder="📞 Numéro de secours (optionnel)"
                  prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
                />
              </StyledFormItem>
            </Col>
          </Row>
        </SectionCard>

        {/* Section Notes */}
        <SectionCard
          icon={<FileTextOutlined />}
          title="Informations complémentaires"
          description="Notes et détails supplémentaires"
          color="#f59e0b"
        >
          <Form.Item name="informations_complementaires" label={<OptionalLabel>Notes et commentaires</OptionalLabel>}>
            <TextArea 
              rows={5} 
              placeholder="📝 Ajoutez des informations importantes, préférences du client, historique, etc..."
              style={{ 
                borderRadius: '12px',
                resize: 'none',
                border: '2px solid #e5e7eb',
                fontSize: '15px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>
        </SectionCard>

        {/* Actions */}
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            alignItems: 'center'
          }}>
            <Button 
              onClick={on_cancel}
              size="large"
              style={{
                borderRadius: '10px',
                height: '48px',
                padding: '0 28px',
                border: '2px solid #e5e7eb',
                color: '#6b7280',
                fontWeight: 600,
                fontSize: '15px',
                minWidth: '120px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#9ca3af';
                e.target.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.color = '#6b7280';
              }}
            >
              ❌ Annuler
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              style={{
                borderRadius: '10px',
                height: '48px',
                padding: '0 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.25)',
                minWidth: '140px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.25)';
              }}
            >
              {is_edit ? '✅ Mettre à jour' : '➕ Créer le client'}
            </Button>
          </div>
          
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
            fontStyle: 'italic'
          }}>
            💡 Les champs marqués d'un * sont obligatoires
          </div>
        </div>
      </Form>
    </div>
  );
};

export default ClientForm;