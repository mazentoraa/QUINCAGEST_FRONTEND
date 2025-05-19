import React from 'react';
import { Menu } from 'antd';
import { 
  ShoppingOutlined, 
  FileTextOutlined,
  AccountBookOutlined,
  ToolOutlined,
  CarOutlined,
  DatabaseOutlined,
  FileOutlined,
  BankOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { SubMenu } = Menu;

function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleMenuClick = (path) => {
    navigate(path);
  };

  // Get the current open submenu keys based on path
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.includes('/stock')) return ['stock'];
    if (path.includes('/manifeste')) return ['manifeste'];
    if (path.includes('/reglements')) return ['reglements'];
    return [];
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Menu</h2>
      </div>
      <Menu
        mode="inline"
        defaultOpenKeys={getOpenKeys()}
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
      >
        <SubMenu key="stock" icon={<ShoppingOutlined />} title="Gestion de Stock">
          <Menu.Item key="/stock/produits" onClick={() => handleMenuClick('/stock/produits')}>
            Produits Finis
          </Menu.Item>
          <Menu.Item key="/stock/matieres" onClick={() => handleMenuClick('/stock/matieres')}>
            Matières Premières
          </Menu.Item>
        </SubMenu>
        
        <SubMenu key="manifeste" icon={<FileTextOutlined />} title="Manifeste">
          <Menu.Item key="/manifeste/travaux" icon={<ToolOutlined />} onClick={() => handleMenuClick('/manifeste/travaux')}>
            Travaux
          </Menu.Item>
          <Menu.Item key="/manifeste/bons" icon={<CarOutlined />} onClick={() => handleMenuClick('/manifeste/bons')}>
            Bons livraison
          </Menu.Item>
          <Menu.Item key="/manifeste/inventaire" icon={<DatabaseOutlined />} onClick={() => handleMenuClick('/manifeste/inventaire')}>
            Inventaire
          </Menu.Item>
        </SubMenu>
        
        <SubMenu key="reglements" icon={<AccountBookOutlined />} title="Règlements">
          <Menu.Item key="/reglements/factures" icon={<FileOutlined />} onClick={() => handleMenuClick('/reglements/factures')}>
            Facture
          </Menu.Item>
          <Menu.Item key="/reglements/traites" icon={<BankOutlined />} onClick={() => handleMenuClick('/reglements/traites')}>
            Traites
          </Menu.Item>
          <Menu.Item key="/reglements/rapport" icon={<BarChartOutlined />} onClick={() => handleMenuClick('/reglements/rapport')}>
            Rapport
          </Menu.Item>
        </SubMenu>

        <Menu.Item key="/clients" onClick={() => handleMenuClick('/clients')}>
          Clients
        </Menu.Item>
      </Menu>
    </div>
  );
}

export default SideMenu;
