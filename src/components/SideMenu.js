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
  // FileInvoiceOutlined,  <-- supprimé comme demandé
  BankOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DollarCircleOutlined ,
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
        {/* --- CYCLE VENTES --- */}
        <Menu.Item key="/clients" icon={<TeamOutlined />} onClick={() => handleMenuClick('/clients')}>
          Clients
        </Menu.Item>
      
        <SubMenu key="stock" icon={<AppstoreAddOutlined />} title="Gestion de Stock">
          <Menu.Item key="/stock/produits" icon={<ShoppingCartOutlined />} onClick={() => handleMenuClick('/stock/produits')}>
            Produits Finis
          </Menu.Item>
          <Menu.Item key="/stock/matieres" icon={<GoldOutlined />} onClick={() => handleMenuClick('/stock/matieres')}>
            Matières Premières Client
          </Menu.Item>
        </SubMenu>

        <SubMenu key="manifeste" icon={<FileTextOutlined />} title="Manifeste">
          <Menu.Item key="/manifeste/travaux" icon={<ToolOutlined />} onClick={() => handleMenuClick('/manifeste/travaux')}>
            Travaux
          </Menu.Item>

          <SubMenu key="bons_devis" icon={<FileSearchOutlined />} title="Bons et Devis">
            <Menu.Item key="/bons/livraison-reception" icon={<FileDoneOutlined />} onClick={() => handleMenuClick('/bons/livraison-reception')}>
              Bons de Livraison (Réception)
            </Menu.Item>
            <Menu.Item key="/bons/livraison-decoupe" icon={<FileDoneOutlined />} onClick={() => handleMenuClick('/bons/livraison-decoupe')}>
              Bons de Livraison (Découpe)
            </Menu.Item>
            <Menu.Item key="/bons/devis" icon={<FileAddOutlined />} onClick={() => handleMenuClick('/bons/devis')}>
              Devis
            </Menu.Item>
            <Menu.Item key="/bons/commande" icon={<FileProtectOutlined />} onClick={() => handleMenuClick('/bons/commande')}>
              Bons de Commande
            </Menu.Item>
            <Menu.Item key="/bons/retour" icon={<RollbackOutlined />} onClick={() => handleMenuClick('/bons/retour')}>
              Bons de Retour
            </Menu.Item>
            <Menu.Item key="/reglements/avoir" icon={<UndoOutlined />} onClick={() => handleMenuClick('/reglements/avoir')}>
              Avoirs
            </Menu.Item>
          </SubMenu>
        </SubMenu>

        <SubMenu key="reglements" icon={<AccountBookOutlined />} title="Règlements">
          <Menu.Item key="/reglements/factures" icon={<FileTextOutlined />} onClick={() => handleMenuClick('/reglements/factures')}>
            Factures
          </Menu.Item>
          <Menu.Item key="/reglements/avoir-facture" icon={<UndoOutlined />} onClick={() => handleMenuClick('/reglements/avoir-facture')}>
            Avoirs
          </Menu.Item>
          <Menu.Item key="/reglements/traites" icon={<BankOutlined />} onClick={() => handleMenuClick('/reglements/traites')}>
            Traites
          </Menu.Item>
        </SubMenu>
          <Menu.Item key="/employes" icon={<UserOutlined />} onClick={() => handleMenuClick('/employes')}>
          Employés
        </Menu.Item>
        <SubMenu key="gestion-employes" icon={<TeamOutlined />} title="Gestion des Employés">
        
          <Menu.Item key="/employes/fiche-paie" icon={<FileTextOutlined />} onClick={() => handleMenuClick('/employes/fiche-paie')}>
            Fiches de Paie
          </Menu.Item>
          <Menu.Item key="/employes/avance" icon={<DollarCircleOutlined />} onClick={() => handleMenuClick('/employes/avance')}>
            Avances
          </Menu.Item>
        </SubMenu>


        {/* --- CYCLE ACHATS --- */}
        <Menu.Item key="/fournisseurs" icon={<InboxOutlined />} onClick={() => handleMenuClick('/fournisseurs')}>
          Fournisseurs
        </Menu.Item>

        <SubMenu key="achats" icon={<ShoppingCartOutlined />} title="Gestion des Achats">
          <Menu.Item key="/achats/matieres" icon={<GoldOutlined />} onClick={() => handleMenuClick('/achats/matieres')}>
            Matières Premières
          </Menu.Item>
          <Menu.Item key="/achats/consommables" icon={<AppstoreOutlined />} onClick={() => handleMenuClick('/achats/consommables')}>
            Consommables
          </Menu.Item>
          <Menu.Item key="/achats" icon={<ShoppingCartOutlined />} onClick={() => handleMenuClick('/achats')}>
            Autres Achats
          </Menu.Item>
        </SubMenu>

        <SubMenu key="bons" icon={<FileDoneOutlined />} title="Bons">
          <Menu.Item key="/achats/bon-livraison" icon={<FileDoneOutlined />} onClick={() => handleMenuClick('/achats/bon-livraison')}>
            Bons de Livraison
          </Menu.Item>
          <Menu.Item key="/achats/bon-retour-fournisseur" icon={<FileDoneOutlined />} onClick={() => handleMenuClick('/achats/bon-retour-fournisseur')}>
          Bons de Retour
          </Menu.Item>
        </SubMenu>

        <SubMenu key="reglement" icon={<FileTextOutlined />} title="Règlements">
          <Menu.Item key="/achats/factures-matieres" icon={<FileTextOutlined />} onClick={() => handleMenuClick('/achats/factures-matieres')}>
            Factures
          </Menu.Item>
            <Menu.Item
            key="/achats/gestion-traites-fournisseur"
            icon={<FileTextOutlined />}
            onClick={() => handleMenuClick('/achats/gestion-traites-fournisseur')}
          >
            Traites
          </Menu.Item>
        </SubMenu>


        {/* --- GESTION GLOBALE --- */}
        <SubMenu key="/tresorerie" icon={<DollarCircleOutlined />} title="Trésorerie">
          <Menu.Item key="/tresorerie" icon={<FundOutlined />} onClick={() => handleMenuClick('/tresorerie')}>
            Vue Globale
          </Menu.Item>
          <Menu.Item key="/tresorerie/traite" icon={<BankOutlined />} onClick={() => handleMenuClick('/tresorerie/traite')}>
            Traites
          </Menu.Item>
          <Menu.Item key="/tresorerie/par-periode" icon={<ClockCircleOutlined />} onClick={() => handleMenuClick('/tresorerie/par-periode')}>
            Par Période
          </Menu.Item>
          <Menu.Item key="/tresorerie/simulation" icon={<DeploymentUnitOutlined />} onClick={() => handleMenuClick('/tresorerie/simulation')}>
            Simulation
          </Menu.Item>
        </SubMenu>

        <Menu.Item key="/reglements/rapport" icon={<BarChartOutlined />} onClick={() => handleMenuClick('/reglements/rapport')}>
          Rapport
        </Menu.Item>

      
      </Menu>
    </div>
  );
}

export default SideMenu;
