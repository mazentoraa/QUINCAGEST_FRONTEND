import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Statistic } from 'antd';
import {
  ShoppingOutlined,
  FileTextOutlined,
  AccountBookOutlined,
  UserOutlined,
  ToolOutlined,
  BankOutlined
} from '@ant-design/icons';
import './Dashboard.css';

const { Title } = Typography;

function Dashboard() {
  const navigate = useNavigate();
  
  const cardStyle = {
    cursor: 'pointer',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const dashboardCards = [
    {
      title: 'Gestion des Stocks',
      icon: <ShoppingOutlined style={{ fontSize: 48 }} />,
      description: 'Gérez vos produits, matériaux et quantités',
      path: '/stock/produits',
      stat: '24',
      statLabel: 'Produits'
    },
    {
      title: 'Travaux',
      icon: <ToolOutlined style={{ fontSize: 48 }} />,
      description: 'Suivez vos travaux en cours',
      path: '/manifeste/travaux',
      stat: '8',
      statLabel: 'Actifs'
    },
    {
      title: 'Bons Livraison',
      icon: <FileTextOutlined style={{ fontSize: 48 }} />,
      description: 'Gérez vos livraisons et retours',
      path: '/manifeste/bons',
      stat: '12',
      statLabel: 'Bons'
    },
    {
      title: 'Facture',
      icon: <AccountBookOutlined style={{ fontSize: 48 }} />,
      description: 'Générez et suivez vos factures',
      path: '/reglements/factures',
      stat: '15',
      statLabel: 'Factures'
    },
    {
      title: 'Traites',
      icon: <BankOutlined style={{ fontSize: 48 }} />,
      description: 'Générez et imprimez les traites bancaires',
      path: '/reglements/traites',
      stat: '6',
      statLabel: 'En cours'
    },
    {
      title: 'Gestion des Clients',
      icon: <UserOutlined style={{ fontSize: 48 }} />,
      description: 'Gérez vos clients et leurs informations',
      path: '/clients',
      stat: '48',
      statLabel: 'Clients'
    }
  ];

  return (
    <div className="dashboard-container">
      <Title level={2}>Tableau de Bord</Title>
      
      <Row gutter={[24, 24]}>
        {dashboardCards.map((card, index) => (
          <Col key={index} xs={24} sm={12} lg={8}>
            <Card 
              style={cardStyle}
              hoverable
              onClick={() => navigate(card.path)}
            >
              <div className="card-content">
                <div className="card-icon">
                  {card.icon}
                </div>
                <div className="card-info">
                  <Title level={4}>{card.title}</Title>
                  <p>{card.description}</p>
                </div>
              </div>
              <Statistic title={card.statLabel} value={card.stat} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default Dashboard;