import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Spin, Modal } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined, GlobalOutlined, EnvironmentOutlined, CloseOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './LoginForm.css';

const { Title, Text } = Typography;

const LoginForm = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [contactModalVisible, setContactModalVisible] = useState(false);
    const { login } = useAuth();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const success = await login(values.username, values.password);
            if (success && onSuccess) {
                onSuccess();
            }
        } finally {
            setLoading(false);
        }
    };

    const showContactModal = (e) => {
        e.preventDefault();
        setContactModalVisible(true);
    };

    const handleContactModalClose = () => {
        setContactModalVisible(false);
    };

    return (
        <div className="yucca-login-wrapper">
            {/* Arrière-plan animé */}
            <div className="yucca-bg-animation">
                <div className="yucca-floating-element yucca-element-1"></div>
                <div className="yucca-floating-element yucca-element-2"></div>
                <div className="yucca-floating-element yucca-element-3"></div>
                <div className="yucca-floating-element yucca-element-4"></div>
                <div className="yucca-floating-element yucca-element-5"></div>
                <div className="yucca-floating-element yucca-element-6"></div>
            </div>

            {/* Section gauche - Branding */}
            <div className="yucca-brand-panel">
                <div className="yucca-brand-inner">
                    <div className="yucca-logo-section">
                        <img
                            src="/images/logoyucca.png"
                            alt="Logo Yucca"
                            className="yucca-brand-logo"
                        />
                        <h1 className="yucca-brand-title">YUCCA ERP</h1>
                    </div>

                    <div className="yucca-brand-info">
                        <h2 className="yucca-brand-heading">Gérez votre entreprise avec intelligence</h2>
                        <p className="yucca-brand-description">Une solution ERP moderne et intuitive pour optimiser tous vos processus métier</p>
                        
                        <div className="yucca-features-grid">
                            <div className="yucca-feature-card">
                                <div className="yucca-feature-icon">📊</div>
                                <span className="yucca-feature-text">Analytics avancés</span>
                            </div>
                            <div className="yucca-feature-card">
                                <div className="yucca-feature-icon">🔄</div>
                                <span className="yucca-feature-text">Automatisation intelligente</span>
                            </div>
                            <div className="yucca-feature-card">
                                <div className="yucca-feature-icon">🌐</div>
                                <span className="yucca-feature-text">Collaboration en temps réel</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section droite - Formulaire */}
            <div className="yucca-form-panel">
                <div className="yucca-form-container">
                    <Card className="yucca-login-card">
                        <div className="yucca-card-header">
                            <Title level={2} className="yucca-login-title">Connexion</Title>
                            <Text className="yucca-login-subtitle">Accédez à votre espace de travail</Text>
                        </div>
                        
                        <Spin spinning={loading}>
                            <Form
                                name="yucca_login_form"
                                initialValues={{ remember: true }}
                                onFinish={onFinish}
                                size="large"
                                className="yucca-auth-form"
                            >
                                <Form.Item
                                    name="username"
                                    rules={[{ required: true, message: 'Veuillez saisir votre nom d\'utilisateur!' }]}
                                >
                                    <Input 
                                        prefix={<UserOutlined className="yucca-input-icon" />} 
                                        placeholder="Nom d'utilisateur" 
                                        className="yucca-form-input"
                                    />
                                </Form.Item>
                                
                                <Form.Item
                                    name="password"
                                    rules={[{ required: true, message: 'Veuillez saisir votre mot de passe!' }]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="yucca-input-icon" />}
                                        placeholder="Mot de passe"
                                        className="yucca-form-input"
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        className="yucca-submit-btn"
                                        size="large"
                                    >
                                        <span>Se connecter</span>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 1L15 8L8 15M15 8H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Spin>
                    </Card>

                    <div className="yucca-help-section">
                        <Text className="yucca-help-text">
                            Nouveau sur YUCCA ERP ? 
                            <a href="#contact" className="yucca-contact-link" onClick={showContactModal}> Contactez notre équipe</a>
                        </Text>
                    </div>
                </div>
            </div>

            {/* Modal de contact */}
            <Modal
                open={contactModalVisible}
                onCancel={handleContactModalClose}
                footer={null}
                width={500}
                centered
                className="yucca-contact-modal"
                closeIcon={<CloseOutlined style={{ color: '#666', fontSize: '16px' }} />}
            >
                <div className="yucca-modal-content">
                    <div className="yucca-modal-header">
                        <div className="yucca-modal-logo">
                            <img
                                src="/images/logoyucca.png"
                                alt="Logo Yucca"
                                style={{ width: "60px", height: "60px" }}
                            />
                        </div>
                        <Title level={3} style={{ margin: '16px 0 8px 0', color: '#010d43' }}>
                            YUCCA Info
                        </Title>
                        <Text style={{ color: '#666', fontSize: '14px' }}>
                            Solutions ERP innovantes
                        </Text>
                    </div>

                    <div className="yucca-contact-info">
                        <div className="yucca-contact-item">
                            <PhoneOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
                            <div className="yucca-contact-details">
                                <Text strong style={{ color: '#333' }}>Téléphone</Text>
                                <Text style={{ color: '#666' }}>+21697131795 / +21623198524</Text>
                            </div>
                        </div>

                        <div className="yucca-contact-item">
                            <MailOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
                            <div className="yucca-contact-details">
                                <Text strong style={{ color: '#333' }}>Email</Text>
                                <Text style={{ color: '#666' }}>contact@yuccainfo.com.tn</Text>
                            </div>
                        </div>

                        <div className="yucca-contact-item">
                            <GlobalOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
                            <div className="yucca-contact-details">
                                <Text strong style={{ color: '#333' }}>Site Web</Text>
                                <Text style={{ color: '#666' }}>http://www.yuccainfo.com.tn</Text>
                            </div>
                        </div>

                        <div className="yucca-contact-item">
                            <EnvironmentOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
                            <div className="yucca-contact-details">
                                <Text strong style={{ color: '#333' }}>Adresse</Text>
                                <Text style={{ color: '#666' }}>
                                   Dar Chaabane Fehri, Nabeul, Tunisia
<br />
                                    Technopole Sousse, Tunisia
                                </Text>
                            </div>
                        </div>
                    </div>

                    <div className="yucca-contact-footer">
                        <Text style={{ color: '#999', fontSize: '12px', textAlign: 'center', display: 'block' }}>
                            Notre équipe est disponible du lundi au vendredi de 9h à 18h
                        </Text>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LoginForm;