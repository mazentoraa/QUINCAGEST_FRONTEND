import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Button, Typography, Space, Avatar } from 'antd';
import { HomeOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import './Navigation.css';
import AuthService from '../services/AuthService';

const { Title } = Typography;

function Navigation() {
  const navigate = useNavigate();

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  return (
    <div className="navigation-container">
      <div className="logo">
        <Title level={3} style={{ margin: 0, color: '#fff' }}>MetalGest</Title>
      </div>
      
      <Menu theme="dark" mode="horizontal" className="nav-menu">
        <Menu.Item key="home" icon={<HomeOutlined />} onClick={() => navigate('/')}>
          Tableau de Bord
        </Menu.Item>
      </Menu>
      
      <div className="nav-right">
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span style={{ color: '#fff' }}>
            {AuthService.getCurrentUser()?.username || 'Utilisateur'}
          </span>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            style={{ color: '#fff' }}
          >
            Déconnexion
          </Button>
        </Space>
      </div>
    </div>
  );
}

export default Navigation;