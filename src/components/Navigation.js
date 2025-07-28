import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Button, Typography, Space, Avatar, Switch, Tooltip } from 'antd';
import { HomeOutlined, UserOutlined, LogoutOutlined, BulbOutlined } from '@ant-design/icons';
import './Navigation.css';
import AuthService from '../services/AuthService';
import  { useState, useEffect } from 'react';

const { Title } = Typography;

function Navigation() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(
  localStorage.getItem("theme") === "dark"
);

useEffect(() => {
  const theme = isDarkMode ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}, [isDarkMode]);


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
        <Menu.Item key="home" icon={<HomeOutlined />} onClick={() => navigate('/')}  >
        <span style={{ color: '#fff' }}> Tableau de Bord</span>
         
        </Menu.Item>
      </Menu>
      
      <div className="nav-right">
        <Space align="center" size="middle">
         
          <Avatar icon={<UserOutlined />} />
          <span style={{ color: '#fff' }}>
            {(AuthService.getCurrentUser()?.username).toUpperCase() || 'UTILISATEUR'}
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
