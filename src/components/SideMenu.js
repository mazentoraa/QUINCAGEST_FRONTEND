import React from 'react';
import { Menu } from 'antd';
import {
  ShoppingOutlined,
  FileTextOutlined,
  AccountBookOutlined,
  UserOutlined,
  ToolOutlined,
  FileOutlined,
  BankOutlined,
  BarChartOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { SubMenu } = Menu;

function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.includes('/stock')) return ['stock'];
    if (path.includes('/achats') && !path.includes('/bon-livraison') && !path.includes('/factures')) return ['achats'];
    if (path.includes('/manifeste')) return ['manifeste'];
    if (path.includes('/reglements')) return ['reglements'];
    if (path.includes('/bons')) return ['bons_devis'];
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
        <Menu.Item key="/clients" icon={<UserOutlined />} onClick={() => handleMenuClick('/clients')}>
          Clients
        </Menu.Item>

        <SubMenu key="stock" icon={<ShoppingOutlined />} title="Gestion de Stock">
          <Menu.Item key="/stock/produits" onClick={() => handleMenuClick('/stock/produits')}>
            Produits Finis
          </Menu.Item>
          <Menu.Item key="/stock/matieres" onClick={() => handleMenuClick('/stock/matieres')}>
            Matières Premières Client
          </Menu.Item>
        </SubMenu>

        <SubMenu key="manifeste" icon={<FileTextOutlined />} title="Manifeste">
          <Menu.Item key="/manifeste/travaux" icon={<ToolOutlined />} onClick={() => handleMenuClick('/manifeste/travaux')}>
            Travaux
          </Menu.Item>
          <SubMenu key="bons_devis" icon={<FileTextOutlined />} title="Bons et Devis">
            <Menu.Item key="/bons/livraison-reception" onClick={() => handleMenuClick('/bons/livraison-reception')}>
              Bons de Livraison (Réception)
            </Menu.Item>
            <Menu.Item key="/bons/livraison-decoupe" onClick={() => handleMenuClick('/bons/livraison-decoupe')}>
              Bons de Livraison (Découpe)
            </Menu.Item>
            <Menu.Item key="/bons/devis" onClick={() => handleMenuClick('/bons/devis')}>
              Devis
            </Menu.Item>
            <Menu.Item key="/bons/commande" onClick={() => handleMenuClick('/bons/commande')}>
              Bons de Commande
            </Menu.Item>
            <Menu.Item key="/bons/retour" onClick={() => handleMenuClick('/bons/retour')}>
              Bons de Retour
            </Menu.Item>
          </SubMenu>
        </SubMenu>

        <SubMenu key="reglements" icon={<AccountBookOutlined />} title="Règlements">
          <Menu.Item key="/reglements/factures" icon={<FileOutlined />} onClick={() => handleMenuClick('/reglements/factures')}>
            Factures
          </Menu.Item>
          <Menu.Item key="/reglements/traites" icon={<BankOutlined />} onClick={() => handleMenuClick('/reglements/traites')}>
            Traites
          </Menu.Item>
        </SubMenu>

        {/* Fournisseurs */}
        <Menu.Item key="/fournisseurs" icon={<InboxOutlined />} onClick={() => handleMenuClick('/fournisseurs')}>
          Fournisseurs
        </Menu.Item>

        {/* Gestion des Achats */}
        <SubMenu key="achats" icon={<ShoppingOutlined />} title="Gestion des Achats">
          <Menu.Item key="/achats/matieres" onClick={() => handleMenuClick('/achats/matieres')}>
            Matières Premières
          </Menu.Item>
          <Menu.Item key="/achats/consommables" onClick={() => handleMenuClick('/achats/consommables')}>
            Consommables
          </Menu.Item>
          <Menu.Item key="/achats" onClick={() => handleMenuClick('/achats')}>
            Autres Achats
          </Menu.Item>
        </SubMenu>

        {/* Bons de Livraison */}
        <Menu.Item key="/achats/bon-livraison" icon={<FileTextOutlined />} onClick={() => handleMenuClick('/achats/bon-livraison')}>
          Bons de Livraison
        </Menu.Item>

        {/* Factures */}
        <Menu.Item key="/achats/factures-matieres" icon={<FileOutlined />} onClick={() => handleMenuClick('/achats/factures-matieres')}>
          Factures
        </Menu.Item>

        <Menu.Item key="/reglements/rapport" icon={<BarChartOutlined />} onClick={() => handleMenuClick('/reglements/rapport')}>
          Rapport
        </Menu.Item>
      </Menu>
    </div>
  );
}

export default SideMenu;
