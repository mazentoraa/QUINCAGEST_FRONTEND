import React from 'react';
import { Menu } from 'antd';
import {
  UserOutlined,
  AppstoreAddOutlined,
  GiftOutlined,
  GoldOutlined,
  FileTextOutlined,
  ToolOutlined,
  FileDoneOutlined,
  FileAddOutlined,
  RollbackOutlined,
  FileSearchOutlined,
  FileProtectOutlined,
  AccountBookOutlined,
  BankOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DollarCircleOutlined,
  InboxOutlined,
  FundOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  SlidersOutlined,
  RadarChartOutlined,
  BulbOutlined,
  DeploymentUnitOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './SideMenu.css';
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

  const menuStyle = {
    height: '100%',
    borderRight: 0,
    backgroundColor: '#ffffff',
  };

  // Styles CSS personnalisés
  const customStyles = `
    .sidebar {
      background: #ffffff;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
    }

    .sidebar-header {
      padding: 15px;
    
      color:rgb(90, 154, 236);
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .sidebar-header h2 {
      margin: 0;
      font-weight: 600;
      font-size: 20px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    /* Section VENTES - Bleu */
    .ant-menu-item[data-section="ventes"],
    .ant-menu-submenu[data-section="ventes"] > .ant-menu-submenu-title {
      transition: all 0.3s ease;
    }

    .ant-menu-item[data-section="ventes"] .anticon,
    .ant-menu-submenu[data-section="ventes"] > .ant-menu-submenu-title .anticon {
      color: #1890ff;
      transition: all 0.3s ease;
    }

    .ant-menu-item[data-section="ventes"]:hover,
    .ant-menu-submenu[data-section="ventes"]:hover > .ant-menu-submenu-title {
      background: linear-gradient(90deg, rgba(24, 144, 255, 0.08), rgba(24, 144, 255, 0.03));
      border-radius: 6px;
      margin: 2px 8px;
    }

    .ant-menu-item[data-section="ventes"]:hover .anticon,
    .ant-menu-submenu[data-section="ventes"]:hover > .ant-menu-submenu-title .anticon {
      color: #0050b3;
      transform: scale(1.1);
    }

    /* Section EMPLOYÉS - Vert */
    .ant-menu-item[data-section="employes"],
    .ant-menu-submenu[data-section="employes"] > .ant-menu-submenu-title {
      transition: all 0.3s ease;
    }

    .ant-menu-item[data-section="employes"] .anticon,
    .ant-menu-submenu[data-section="employes"] > .ant-menu-submenu-title .anticon {
      color: #52c41a;
      transition: all 0.3s ease;
    }

    .ant-menu-item[data-section="employes"]:hover,
    .ant-menu-submenu[data-section="employes"]:hover > .ant-menu-submenu-title {
      background: linear-gradient(90deg, rgba(82, 196, 26, 0.08), rgba(82, 196, 26, 0.03));
      border-radius: 6px;
      margin: 2px 8px;
    }

    .ant-menu-item[data-section="employes"]:hover .anticon,
    .ant-menu-submenu[data-section="employes"]:hover > .ant-menu-submenu-title .anticon {
      color: #389e0d;
      transform: scale(1.1);
    }

    /* Section ACHATS - Orange */
    .ant-menu-item[data-section="achats"],
    .ant-menu-submenu[data-section="achats"] > .ant-menu-submenu-title {
      transition: all 0.3s ease;
    }

    .ant-menu-item[data-section="achats"] .anticon,
    .ant-menu-submenu[data-section="achats"] > .ant-menu-submenu-title .anticon {
      color: #fa8c16;
      transition: all 0.3s ease;
    }

    .ant-menu-item[data-section="achats"]:hover,
    .ant-menu-submenu[data-section="achats"]:hover > .ant-menu-submenu-title {
      background: linear-gradient(90deg, rgba(250, 140, 22, 0.08), rgba(250, 140, 22, 0.03));
      border-radius: 6px;
      margin: 2px 8px;
    }

    .ant-menu-item[data-section="achats"]:hover .anticon,
    .ant-menu-submenu[data-section="achats"]:hover > .ant-menu-submenu-title .anticon {
      color: #d46b08;
      transform: scale(1.1);
    }

    /* Section TRÉSORERIE - Violet */
    .ant-menu-item[data-section="tresorerie"],
    .ant-menu-submenu[data-section="tresorerie"] > .ant-menu-submenu-title {
      transition: all 0.3s ease;
    }

    .ant-menu-item[data-section="tresorerie"] .anticon,
    .ant-menu-submenu[data-section="tresorerie"] > .ant-menu-submenu-title .anticon {
      color: #722ed1;
      transition: all 0.3s ease;
    }

    .ant-menu-item[data-section="tresorerie"]:hover,
    .ant-menu-submenu[data-section="tresorerie"]:hover > .ant-menu-submenu-title {
      background: linear-gradient(90deg, rgba(114, 46, 209, 0.08), rgba(114, 46, 209, 0.03));
      border-radius: 6px;
      margin: 2px 8px;
    }

    .ant-menu-item[data-section="tresorerie"]:hover .anticon,
    .ant-menu-submenu[data-section="tresorerie"]:hover > .ant-menu-submenu-title .anticon {
      color: #531dab;
      transform: scale(1.1);
    }

    /* Styles pour les éléments sélectionnés */
    .ant-menu-item-selected {
      background: linear-gradient(90deg, rgba(24, 144, 255, 0.12), rgba(24, 144, 255, 0.04)) !important;
      border-radius: 6px !important;
      margin: 2px 8px !important;
      border-right: 3px solid #1890ff !important;
    }

    .ant-menu-item-selected .anticon {
      color: #0050b3 !important;
    }

    /* Styles pour les sous-menus ouverts */
    .ant-menu-submenu-open > .ant-menu-submenu-title {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 6px;
      margin: 2px 8px;
    }

    /* Espacement et padding */
    .ant-menu-item,
    .ant-menu-submenu-title {
      margin: 4px 8px !important;
      border-radius: 6px;
      padding-left: 16px !important;
      height: 42px !important;
      line-height: 42px !important;
    }

    .ant-menu-sub .ant-menu-item {
      margin: 2px 16px !important;
      padding-left: 32px !important;
      height: 36px !important;
      line-height: 36px !important;
    }

    /* Animation de l'icône */
    .anticon {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Séparateurs visuels */
    .menu-section-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #f0f0f0, transparent);
      margin: 12px 16px;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Menu</h2>
        </div>
        <Menu
          mode="inline"
          defaultOpenKeys={getOpenKeys()}
          selectedKeys={[location.pathname]}
          style={menuStyle}
        >
          {/* --- SECTION VENTES (Bleu) --- */}
          <Menu.Item 
            key="/clients" 
            icon={<TeamOutlined />} 
            onClick={() => handleMenuClick('/clients')}
            data-section="ventes"
          >
            Clients
          </Menu.Item>
        
          <SubMenu 
            key="stock" 
            icon={<AppstoreAddOutlined />} 
            title="Gestion de Stock"
            data-section="ventes"
          >
            <Menu.Item 
              key="/stock/produits" 
              icon={<ShoppingCartOutlined />} 
              onClick={() => handleMenuClick('/stock/produits')}
              data-section="ventes"
            >
              Produits Finis
            </Menu.Item>
            <Menu.Item 
              key="/stock/matieres" 
              icon={<GoldOutlined />} 
              onClick={() => handleMenuClick('/stock/matieres')}
              data-section="ventes"
            >
              Matières Premières Client
            </Menu.Item>
          </SubMenu>

          <SubMenu 
            key="manifeste" 
            icon={<FileTextOutlined />} 
            title="Manifeste"
            data-section="ventes"
          >
            <Menu.Item 
              key="/manifeste/travaux" 
              icon={<ToolOutlined />} 
              onClick={() => handleMenuClick('/manifeste/travaux')}
              data-section="ventes"
            >
              Travaux
            </Menu.Item>

            <SubMenu 
              key="bons_devis" 
              icon={<FileSearchOutlined />} 
              title="Bons et Devis"
              data-section="ventes"
            >
              <Menu.Item 
                key="/bons/livraison-reception" 
                icon={<FileDoneOutlined />} 
                onClick={() => handleMenuClick('/bons/livraison-reception')}
                data-section="ventes"
              >
                Bons de Livraison (Réception)
              </Menu.Item>
              <Menu.Item 
                key="/bons/livraison-decoupe" 
                icon={<FileDoneOutlined />} 
                onClick={() => handleMenuClick('/bons/livraison-decoupe')}
                data-section="ventes"
              >
                Bons de Livraison (Découpe)
              </Menu.Item>
              <Menu.Item 
                key="/bons/devis" 
                icon={<FileAddOutlined />} 
                onClick={() => handleMenuClick('/bons/devis')}
                data-section="ventes"
              >
                Devis
              </Menu.Item>
              <Menu.Item 
                key="/bons/commande" 
                icon={<FileProtectOutlined />} 
                onClick={() => handleMenuClick('/bons/commande')}
                data-section="ventes"
              >
                Bons de Commande
              </Menu.Item>
              <Menu.Item 
                key="/bons/retour" 
                icon={<RollbackOutlined />} 
                onClick={() => handleMenuClick('/bons/retour')}
                data-section="ventes"
              >
                Bons de Retour
              </Menu.Item>
              <Menu.Item 
                key="/reglements/avoir" 
                icon={<UndoOutlined />} 
                onClick={() => handleMenuClick('/reglements/avoir')}
                data-section="ventes"
              >
                Avoirs
              </Menu.Item>
            </SubMenu>
          </SubMenu>

          <SubMenu 
            key="reglements" 
            icon={<AccountBookOutlined />} 
            title="Règlements"
            data-section="ventes"
          >
            <Menu.Item 
              key="/reglements/factures" 
              icon={<FileTextOutlined />} 
              onClick={() => handleMenuClick('/reglements/factures')}
              data-section="ventes"
            >
              Factures
            </Menu.Item>
            <Menu.Item 
              key="/reglements/traites" 
              icon={<BankOutlined />} 
              onClick={() => handleMenuClick('/reglements/traites')}
              data-section="ventes"
            >
              Traites
            </Menu.Item>
          </SubMenu>

          <div className="menu-section-divider"></div>

          {/* --- SECTION EMPLOYÉS (Vert) --- */}
          <Menu.Item 
            key="/employes" 
            icon={<UserOutlined />} 
            onClick={() => handleMenuClick('/employes')}
            data-section="employes"
          >
            Employés
          </Menu.Item>

          <SubMenu 
            key="gestion-employes" 
            icon={<TeamOutlined />} 
            title="Gestion des Employés"
            data-section="employes"
          >
            <Menu.Item 
              key="/employes/fiche-paie" 
              icon={<FileTextOutlined />} 
              onClick={() => handleMenuClick('/employes/fiche-paie')}
              data-section="employes"
            >
              Fiches de Paie
            </Menu.Item>
            <Menu.Item 
              key="/employes/avance" 
              icon={<DollarCircleOutlined />} 
              onClick={() => handleMenuClick('/employes/avance')}
              data-section="employes"
            >
              Avances
            </Menu.Item>
          </SubMenu>

          <div className="menu-section-divider"></div>

          {/* --- SECTION ACHATS (Orange) --- */}
          <Menu.Item 
            key="/fournisseurs" 
            icon={<InboxOutlined />} 
            onClick={() => handleMenuClick('/fournisseurs')}
            data-section="achats"
          >
            Fournisseurs
          </Menu.Item>

          <SubMenu 
            key="achats" 
            icon={<ShoppingCartOutlined />} 
            title="Gestion des Achats"
            data-section="achats"
          >
            <Menu.Item 
              key="/achats/matieres" 
              icon={<GoldOutlined />} 
              onClick={() => handleMenuClick('/achats/matieres')}
              data-section="achats"
            >
              Matières Premières
            </Menu.Item>
            <Menu.Item 
              key="/achats/consommables" 
              icon={<AppstoreOutlined />} 
              onClick={() => handleMenuClick('/achats/consommables')}
              data-section="achats"
            >
              Consommables
            </Menu.Item>
            <Menu.Item 
              key="/achats" 
              icon={<ShoppingCartOutlined />} 
              onClick={() => handleMenuClick('/achats')}
              data-section="achats"
            >
              Autres Achats
            </Menu.Item>
          </SubMenu>

          <SubMenu 
            key="bons" 
            icon={<FileDoneOutlined />} 
            title="Bons"
            data-section="achats"
          >
            <Menu.Item 
              key="/achats/bon-livraison" 
              icon={<FileDoneOutlined />} 
              onClick={() => handleMenuClick('/achats/bon-livraison')}
              data-section="achats"
            >
              Bons de Livraison
            </Menu.Item>
            <Menu.Item 
              key="/achats/bon-retour-fournisseur" 
              icon={<FileDoneOutlined />} 
              onClick={() => handleMenuClick('/achats/bon-retour-fournisseur')}
              data-section="achats"
            >
              Bons de Retour
            </Menu.Item>
          </SubMenu>

          <SubMenu 
            key="reglement" 
            icon={<FileTextOutlined />} 
            title="Règlements"
            data-section="achats"
          >
            <Menu.Item 
              key="/achats/factures-matieres" 
              icon={<FileTextOutlined />} 
              onClick={() => handleMenuClick('/achats/factures-matieres')}
              data-section="achats"
            >
              Factures
            </Menu.Item>
            <Menu.Item
              key="/achats/gestion-traites-fournisseur"
              icon={<FileTextOutlined />}
              onClick={() => handleMenuClick('/achats/gestion-traites-fournisseur')}
              data-section="achats"
            >
              Traites
            </Menu.Item>
          </SubMenu>

          <div className="menu-section-divider"></div>

          {/* --- SECTION TRÉSORERIE (Violet) --- */}
          <SubMenu 
            key="/tresorerie" 
            icon={<DollarCircleOutlined />} 
            title="Trésorerie"
            data-section="tresorerie"
          >
            <Menu.Item 
              key="/tresorerie" 
              icon={<FundOutlined />} 
              onClick={() => handleMenuClick('/tresorerie')}
              data-section="tresorerie"
            >
              Vue Globale
            </Menu.Item>
            <Menu.Item 
              key="/tresorerie/traite" 
              icon={<BankOutlined />} 
              onClick={() => handleMenuClick('/tresorerie/traite')}
              data-section="tresorerie"
            >
              Traites
            </Menu.Item>
            <Menu.Item 
              key="/tresorerie/par-periode" 
              icon={<ClockCircleOutlined />} 
              onClick={() => handleMenuClick('/tresorerie/par-periode')}
              data-section="tresorerie"
            >
              Par Période
            </Menu.Item>
            <Menu.Item 
              key="/tresorerie/simulation" 
              icon={<DeploymentUnitOutlined />} 
              onClick={() => handleMenuClick('/tresorerie/simulation')}
              data-section="tresorerie"
            >
              Simulation
            </Menu.Item>
          </SubMenu>

          <Menu.Item 
            key="/reglements/rapport" 
            icon={<BarChartOutlined />} 
            onClick={() => handleMenuClick('/reglements/rapport')}
            data-section="rapport"
          >
            Rapport
          </Menu.Item>
        </Menu>
      </div>
    </>
  );
}

export default SideMenu;