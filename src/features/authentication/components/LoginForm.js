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
        <div className="login-container">
            {/* Background avec effet de particules */}
            <div className="background-animation">
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
            </div>

            {/* Section gauche - Branding */}
            <div className="branding-section">
                <div className="brand-content">
                    <div className="logo-container">
                        {/* Nouveau logo image au-dessus du nom */}
                        <img
                            src="/images/logoyucca.png"
                            alt="Logo Yucca"
                            className="yucca-logo"
                            style={{
                                width: "100px",
                                height: "100px",
                                marginBottom: "10px",
                            }}
                        />

                        {/* Icône SVG existante (optionnelle — tu peux supprimer si tu ne veux plus de l'hexagone vert) */}
                        <div className="logo-icon" style={{ display: "none" }}>
                            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                                <path d="M30 5L45 15V35L30 45L15 35V15L30 5Z" fill="url(#gradient1)" stroke="#fff" strokeWidth="2"/>
                                <path d="M30 15L37.5 20V30L30 35L22.5 30V20L30 15Z" fill="url(#gradient2)"/>
                                <defs>
                                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#4ade80"/>
                                        <stop offset="100%" stopColor="#22c55e"/>
                                    </linearGradient>
                                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#86efac"/>
                                        <stop offset="100%" stopColor="#4ade80"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* Nom de la marque */}
                        <h1 className="brand-name">Yucca ERP</h1>
                    </div>

                    <div className="brand-description">
                        <h2>Gérez votre entreprise avec intelligence</h2>
                        <p>Une solution ERP moderne et intuitive pour optimiser tous vos processus métier</p>
                        <div className="features-list">
                            <div className="feature-item">
                                <div className="feature-icon">📊</div>
                                <span>Analytics avancés</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🔄</div>
                                <span>Automatisation intelligente</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🌐</div>
                                <span>Collaboration en temps réel</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section droite - Formulaire de connexion */}
            <div className="form-section">
                <div className="form-container">
                    <Card className="login-card">
                        <div className="card-header">
                            <Title level={2} className="login-title">Connexion</Title>
                            <Text className="login-subtitle">Accédez à votre espace de travail</Text>
                        </div>
                        
                        <Spin spinning={loading}>
                            <Form
                                name="normal_login"
                                initialValues={{ remember: true }}
                                onFinish={onFinish}
                                size="large"
                                className="login-form"
                            >
                                <Form.Item
                                    name="username"
                                    rules={[{ required: true, message: 'Veuillez saisir votre nom d\'utilisateur!' }]}
                                >
                                    <Input 
                                        prefix={<UserOutlined className="input-icon" />} 
                                        placeholder="Nom d'utilisateur" 
                                        className="custom-input"
                                    />
                                </Form.Item>
                                
                                <Form.Item
                                    name="password"
                                    rules={[{ required: true, message: 'Veuillez saisir votre mot de passe!' }]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="input-icon" />}
                                        placeholder="Mot de passe"
                                        className="custom-input"
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        className="login-button"
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

                    <div className="help-section">
                        <Text className="help-text">
                            Nouveau sur Yucca ERP ? 
                            <a href="#contact" className="contact-link" onClick={showContactModal}> Contactez notre équipe</a>
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
                className="contact-modal"
                closeIcon={<CloseOutlined style={{ color: '#666', fontSize: '16px' }} />}
            >
                <div className="contact-modal-content">
                    <div className="contact-header">
                        <div className="contact-logo">
                            <img
                                src="/images/logoyucca.png"
                                alt="Logo Yucca"
                                style={{ width: "60px", height: "60px" }}
                            />
                        </div>
                        <Title level={3} style={{ margin: '16px 0 8px 0', color: '#010d43' }}>
                            Yucca Info
                        </Title>
                        <Text style={{ color: '#666', fontSize: '14px' }}>
                            Solutions ERP innovantes
                        </Text>
                    </div>

                    <div className="contact-info">
                        <div className="contact-item">
                            <PhoneOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
                            <div className="contact-details">
                                <Text strong style={{ color: '#333' }}>Téléphone</Text>
                                <Text style={{ color: '#666' }}>+212 5 37 XX XX XX</Text>
                            </div>
                        </div>

                        <div className="contact-item">
                            <MailOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
                            <div className="contact-details">
                                <Text strong style={{ color: '#333' }}>Email</Text>
                                <Text style={{ color: '#666' }}>contact@yuccainfo.ma</Text>
                            </div>
                        </div>

                        <div className="contact-item">
                            <GlobalOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
                            <div className="contact-details">
                                <Text strong style={{ color: '#333' }}>Site Web</Text>
                                <Text style={{ color: '#666' }}>www.yuccainfo.ma</Text>
                            </div>
                        </div>

                        <div className="contact-item">
                            <EnvironmentOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
                            <div className="contact-details">
                                <Text strong style={{ color: '#333' }}>Adresse</Text>
                                <Text style={{ color: '#666' }}>
                                    Nabeul, Tunisie<br />
                                    Zone Technopolis
                                </Text>
                            </div>
                        </div>
                    </div>

                    <div className="contact-footer">
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