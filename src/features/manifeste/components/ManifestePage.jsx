import React from 'react';
import { Button, Typography, Layout, Space, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title } = Typography;

const ManifestePage = () => {
  const navigate = useNavigate();

  const handleWorkManagement = () => {
    navigate('/travaux'); // Navigate to work management page
  };

  const handleGestionBons = () => {
    // Navigate to Gestion de bons page when it's implemented
    console.log('Gestion de bons clicked');
  };

  const handleInventaire = () => {
    // Navigate to Inventaire page when it's implemented
    console.log('Inventaire clicked');
  };

  const buttonStyle = {
    height: '60px',
    fontSize: '16px',
    width: '100%'
  };

  return (
    <Layout>
      <Content style={{ padding: '0 50px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <Title level={2}>Manifeste</Title>
          
          <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '32px' }}>
            <Button 
              type="primary"
              size="large"
              onClick={handleWorkManagement}
              style={buttonStyle}
            >
              Travaux
            </Button>
            
            <Button 
              type="primary"
              size="large"
              onClick={handleGestionBons}
              style={buttonStyle}
            >
              Gestion de Bons
            </Button>
            
            <Button 
              type="primary"
              size="large"
              onClick={handleInventaire}
              style={buttonStyle}
            >
              Inventaire
            </Button>
          </Space>
        </div>
      </Content>
    </Layout>
  );
};

export default ManifestePage;
