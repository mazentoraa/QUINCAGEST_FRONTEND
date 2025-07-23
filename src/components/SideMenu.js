import React, { useState } from 'react';
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
  DeploymentUnitOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './SideMenu.css';

const { SubMenu } = Menu;

function SideMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialOpenKeys = () => {
    const path = location.pathname;
    if (path.includes('/stock')) return ['stock'];
    if (path.includes('/achats') && !path.includes('/bon-livraison') && !path.includes('/factures')) return ['achats'];
    if (path.includes('/bons/')) return ['manifeste', 'bons_devis'];
    if (path.includes('/manifeste')) return ['manifeste'];
    if (path.includes('/reglements')) return ['reglements'];
    if (path.includes('/employes')) return ['gestion-employes'];
    if (path.includes('/tresorerie')) return ['/tresorerie'];
    return [];
  };

  const [openKeys, setOpenKeys] = useState(getInitialOpenKeys());

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const isSelected = (key) => location.pathname === key;

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find(key => openKeys.indexOf(key) === -1);
    
    if (latestOpenKey) {
      // Si on ouvre "bons_devis", on garde aussi "manifeste" ouvert
      if (latestOpenKey === 'bons_devis') {
        setOpenKeys(['manifeste', 'bons_devis']);
      }
      // Si on ouvre "manifeste", on ferme les autres mais on garde manifeste
      else if (latestOpenKey === 'manifeste') {
        setOpenKeys(['manifeste']);
      }
      // Pour tous les autres sous-menus principaux
      else {
        setOpenKeys([latestOpenKey]);
      }
    } else {
      // Si on ferme des clés
      if (keys.length === 0) {
        setOpenKeys([]);
      } else {
        // Si on ferme "bons_devis" mais manifeste reste ouvert
        if (keys.includes('manifeste') && !keys.includes('bons_devis')) {
          setOpenKeys(['manifeste']);
        } else {
          setOpenKeys(keys);
        }
      }
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Menu</h2>
      </div>
      <Menu
        mode="inline"
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
      >
        {/* --- CYCLE VENTES --- */}
        <Menu.Item
          key="/clients"
          icon={<TeamOutlined className="blue-icon" />}
          onClick={() => handleMenuClick('/clients')}
          className={isSelected('/clients') ? 'selected-blue' : ''}
        >
          Clients
        </Menu.Item>

        <SubMenu
          key="stock"
          icon={<AppstoreAddOutlined className="blue-icon" />}
          title="Gestion de Stock"
        >
          <Menu.Item
            key="/stock/produits"
            icon={<ShoppingCartOutlined className="blue-icon" />}
            onClick={() => handleMenuClick('/stock/produits')}
            className={isSelected('/stock/produits') ? 'selected-blue' : ''}
          >
            Produits Finis
          </Menu.Item>
          <Menu.Item
            key="/stock/matieres"
            icon={<GoldOutlined className="blue-icon" />}
            onClick={() => handleMenuClick('/stock/matieres')}
            className={isSelected('/stock/matieres') ? 'selected-blue' : ''}
          >
            Matières Premières Client
          </Menu.Item>
        </SubMenu>

        <SubMenu
          key="manifeste"
          icon={<FileTextOutlined className="blue-icon" />}
          title="Manifeste"
        >
          <Menu.Item
            key="/manifeste/travaux"
            icon={<ToolOutlined className="blue-icon" />}
            onClick={() => handleMenuClick('/manifeste/travaux')}
            className={isSelected('/manifeste/travaux') ? 'selected-blue' : ''}
          >
            Travaux
          </Menu.Item>

          <SubMenu
            key="bons_devis"
            icon={<FileSearchOutlined className="blue-icon" />}
            title="Bons et Devis"
          >
            <Menu.Item 
              key="/bons/livraison-reception" 
              icon={<FileDoneOutlined className="blue-icon" />} 
              onClick={() => handleMenuClick('/bons/livraison-reception')} 
              className={isSelected('/bons/livraison-reception') ? 'selected-blue' : ''}
            >
              Bons de Livraison (Réception)
            </Menu.Item>
            <Menu.Item 
              key="/bons/livraison-decoupe" 
              icon={<FileDoneOutlined className="blue-icon" />} 
              onClick={() => handleMenuClick('/bons/livraison-decoupe')} 
              className={isSelected('/bons/livraison-decoupe') ? 'selected-blue' : ''}
            >
              Bons de Livraison (Découpe)
            </Menu.Item>
            <Menu.Item 
              key="/bons/devis" 
              icon={<FileAddOutlined className="blue-icon" />} 
              onClick={() => handleMenuClick('/bons/devis')} 
              className={isSelected('/bons/devis') ? 'selected-blue' : ''}
            >
              Devis
            </Menu.Item>
            <Menu.Item 
              key="/bons/commande" 
              icon={<FileProtectOutlined className="blue-icon" />} 
              onClick={() => handleMenuClick('/bons/commande')} 
              className={isSelected('/bons/commande') ? 'selected-blue' : ''}
            >
              Bons de Commande
            </Menu.Item>
            <Menu.Item 
              key="/bons/retour" 
              icon={<RollbackOutlined className="blue-icon" />} 
              onClick={() => handleMenuClick('/bons/retour')} 
              className={isSelected('/bons/retour') ? 'selected-blue' : ''}
            >
              Bons de Retour
            </Menu.Item>
            <Menu.Item 
              key="/bons/avoir" 
              icon={<UndoOutlined className="blue-icon" />} 
              onClick={() => handleMenuClick('/bons/avoir')} 
              className={isSelected('/bons/avoir') ? 'selected-blue' : ''}
            >
              Avoirs
            </Menu.Item>
          </SubMenu>
        </SubMenu>

        <SubMenu
          key="reglements"
          icon={<AccountBookOutlined className="blue-icon" />}
          title="Règlements"
        >
          <Menu.Item 
            key="/reglements/factures" 
            icon={<FileTextOutlined className="blue-icon" />} 
            onClick={() => handleMenuClick('/reglements/factures')} 
            className={isSelected('/reglements/factures') ? 'selected-blue' : ''}
          >
            Factures
          </Menu.Item>
          <Menu.Item 
            key="/reglements/avoir-facture" 
            icon={<UndoOutlined className="blue-icon" />} 
            onClick={() => handleMenuClick('/reglements/avoir-facture')} 
            className={isSelected('/reglements/avoir-facture') ? 'selected-blue' : ''}
          >
            Avoirs
          </Menu.Item>
          <Menu.Item 
            key="/reglements/traites" 
            icon={<BankOutlined className="blue-icon" />} 
            onClick={() => handleMenuClick('/reglements/traites')} 
            className={isSelected('/reglements/traites') ? 'selected-blue' : ''}
          >
            Traites
          </Menu.Item>
        </SubMenu>

        {/* --- EMPLOYES --- */}
        <Menu.Item
          key="/employes"
          icon={<UserOutlined className="green-icon" />}
          onClick={() => handleMenuClick('/employes')}
          className={isSelected('/employes') ? 'selected-green' : ''}
        >
          Employés
        </Menu.Item>
        <SubMenu
          key="gestion-employes"
          icon={<TeamOutlined className="green-icon" />}
          title="Gestion des Employés"
        >
          <Menu.Item 
            key="/employes/fiche-paie" 
            icon={<FileTextOutlined className="green-icon" />} 
            onClick={() => handleMenuClick('/employes/fiche-paie')} 
            className={isSelected('/employes/fiche-paie') ? 'selected-green' : ''}
          >
            Fiches de Paie
          </Menu.Item>
          <Menu.Item 
            key="/employes/avance" 
            icon={<DollarCircleOutlined className="green-icon" />} 
            onClick={() => handleMenuClick('/employes/avance')} 
            className={isSelected('/employes/avance') ? 'selected-green' : ''}
          >
            Avances
          </Menu.Item>
        </SubMenu>

        {/* --- FOURNISSEURS & ACHATS --- */}
        <Menu.Item
          key="/fournisseurs"
          icon={<InboxOutlined className="pink-icon" />}
          onClick={() => handleMenuClick('/fournisseurs')}
          className={isSelected('/fournisseurs') ? 'selected-pink' : ''}
        >
          Fournisseurs
        </Menu.Item>

        <SubMenu
          key="achats"
          icon={<ShoppingCartOutlined className="pink-icon" />}
          title="Gestion des Achats"
        >
          <Menu.Item 
            key="/achats/matieres" 
            icon={<GoldOutlined className="pink-icon" />} 
            onClick={() => handleMenuClick('/achats/matieres')} 
            className={isSelected('/achats/matieres') ? 'selected-pink' : ''}
          >
            Matières Premières
          </Menu.Item>
          <Menu.Item 
            key="/achats/consommables" 
            icon={<AppstoreOutlined className="pink-icon" />} 
            onClick={() => handleMenuClick('/achats/consommables')} 
            className={isSelected('/achats/consommables') ? 'selected-pink' : ''}
          >
            Consommables
          </Menu.Item>
          <Menu.Item 
            key="/achats" 
            icon={<ShoppingCartOutlined className="pink-icon" />} 
            onClick={() => handleMenuClick('/achats')} 
            className={isSelected('/achats') ? 'selected-pink' : ''}
          >
            Autres Achats
          </Menu.Item>
        </SubMenu>

        <SubMenu 
          key="bons" 
          icon={<FileDoneOutlined className="pink-icon" />} 
          title="Bons"
        >
          <Menu.Item 
            key="/achats/bon-livraison" 
            icon={<FileDoneOutlined className="pink-icon" />} 
            onClick={() => handleMenuClick('/achats/bon-livraison')} 
            className={isSelected('/achats/bon-livraison') ? 'selected-pink' : ''}
          >
            Bons de Livraison
          </Menu.Item>
          <Menu.Item 
            key="/achats/bon-retour-fournisseur" 
            icon={<FileDoneOutlined className="pink-icon" />} 
            onClick={() => handleMenuClick('/achats/bon-retour-fournisseur')} 
            className={isSelected('/achats/bon-retour-fournisseur') ? 'selected-pink' : ''}
          >
            Bons de Retour
          </Menu.Item>
        </SubMenu>

        <SubMenu 
          key="reglement" 
          icon={<FileTextOutlined className="pink-icon" />} 
          title="Règlements"
        >
          <Menu.Item 
            key="/achats/factures-matieres" 
            icon={<FileTextOutlined className="pink-icon" />} 
            onClick={() => handleMenuClick('/achats/factures-matieres')} 
            className={isSelected('/achats/factures-matieres') ? 'selected-pink' : ''}
          >
            Factures
          </Menu.Item>
          <Menu.Item 
            key="/achats/gestion-traites-fournisseur" 
            icon={<FileTextOutlined className="pink-icon" />} 
            onClick={() => handleMenuClick('/achats/gestion-traites-fournisseur')} 
            className={isSelected('/achats/gestion-traites-fournisseur') ? 'selected-pink' : ''}
          >
            Traites
          </Menu.Item>
          <Menu.Item
  key="/achats/avoir"
  icon={<UndoOutlined className="pink-icon" />}
  onClick={() => handleMenuClick('/achats/avoir')}
  className={isSelected('/achats/avoir') ? 'selected-pink' : ''}
>
  Avoir
</Menu.Item>

        </SubMenu>

        {/* --- TRÉSORERIE --- */}
        <SubMenu
          key="/tresorerie"
          icon={<DollarCircleOutlined className="orange-icon" />}
          title="Trésorerie"
        >
          <Menu.Item 
            key="/tresorerie" 
            icon={<FundOutlined className="orange-icon" />} 
            onClick={() => handleMenuClick('/tresorerie')} 
            className={isSelected('/tresorerie') ? 'selected-orange' : ''}
          >
            Vue Globale
          </Menu.Item>
          <Menu.Item 
            key="/tresorerie/traite" 
            icon={<BankOutlined className="orange-icon" />} 
            onClick={() => handleMenuClick('/tresorerie/traite')} 
            className={isSelected('/tresorerie/traite') ? 'selected-orange' : ''}
          >
            Traites
          </Menu.Item>
          <Menu.Item 
            key="/tresorerie/par-periode" 
            icon={<ClockCircleOutlined className="orange-icon" />} 
            onClick={() => handleMenuClick('/tresorerie/par-periode')} 
            className={isSelected('/tresorerie/par-periode') ? 'selected-orange' : ''}
          >
            Par Période
          </Menu.Item>
          <Menu.Item 
            key="/tresorerie/simulation" 
            icon={<DeploymentUnitOutlined className="orange-icon" />} 
            onClick={() => handleMenuClick('/tresorerie/simulation')} 
            className={isSelected('/tresorerie/simulation') ? 'selected-orange' : ''}
          >
            Simulation
          </Menu.Item>
        </SubMenu>

        {/* --- RAPPORT --- */}
        <Menu.Item
          key="/reglements/rapport"
          icon={<BarChartOutlined className="purple-icon" />}
          onClick={() => handleMenuClick('/reglements/rapport')}
          className={isSelected('/reglements/rapport') ? 'selected-purple' : ''}
        >
          Rapport
        </Menu.Item>
      </Menu>
    </div>
  );
}

export default SideMenu;