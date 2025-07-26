import React, { useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "antd";
import SideMenu from "./components/SideMenu";
import Dashboard from "./components/Dashboard";
import StockManagement from "./features/stock/components/StockManagement";
import ClientMaterialManagement from "./features/clientMaterials/components/ClientMaterialManagement";
import ClientManagementPage from "./features/clientManagement";
import ClientRawMaterialsPage from "./features/clientManagement/components/ClientRawMaterialsPage";
import OrderManagement from "./components/Orders/OrderManagement";
import InstallmentManagement from "./features/installments/components/InstallmentManagement";
import Navigation from "./components/Navigation";
import { StockProvider } from "./features/stock/contexts/StockContext";
import { ClientMaterialProvider } from "./features/clientMaterials/contexts/ClientMaterialContext";
import { OrderProvider } from "./contexts/OrderContext";
import { InstallmentProvider } from "./features/installments/contexts/InstallmentContext";

import {
  AuthProvider,
  AuthContext,
} from "./features/authentication/context/AuthContext";
import LoginForm from "./features/authentication/components/LoginForm";
import AuthService from "./services/AuthService";
import "./App.css";
import {
  ManifestePage,
  WorkManagementPage,
} from "./features/manifeste/components";
import { ProductProvider } from "./features/products/contexts/ProductContext";
import BonLivraisonReception from "./components/BonsDevis/BonLivraisonReception";
import BonLivraisonDecoupe from "./components/BonsDevis/BonLivraisonDecoupe";
import BonRetour from "./components/BonsDevis/BonRetour";
import BonCommande from "./components/BonsDevis/BonCommande";
import Facture from "./components/BonsDevis/Facture";
import Devis from "./components/BonsDevis/Devis";
import PurshaseMatiere from "./features/purshase/purshase_matiere";

import { Spin } from "antd"; 
import MaterialAchatManagement from './features/purshase/MaterialManagement';
import FactureMatiere from './features/purshase/FactureMatiere';
import BonLivraison from './features/purshase/BonLivraison';
import Fournisseur from "./features/purshase/Fournisseur";
import Consommable from './features/purshase/Consommable';
import BonRetourFornisseur from "./features/purshase/BonRetourFornisseur";
import SupplierInstallmentPage from './features/purshase/SupplierInstallmentPage';
import SupplierInstallmentManagementPage from './features/purshase/SupplierInstallmentManagementPage';
import Tresorerie from "./features/tresorerie/pages/Tresorerie"; 
import EmployeeManagement from './features/employee/employee';
import ParPeriode from "./features/tresorerie/pages/ParPeriode";
import Simulation from "./features/tresorerie/pages/Simulation";
import TresorerieTraite from "./features/tresorerie/pages/TresorerieTraite";
import AvancePage from './features/employee/avance';
import EmployeePayrollList from "./features/employee/EmployeePayrollList";
import EmployeePayrollDetails from "./features/employee/EmployeePayrollDetails";
import FichePaiePrint from "./features/employee/FichePaiePrint";
import FichePaieView from "./features/employee/FichePaieView";
import FactureCorbeille from './components/BonsDevis/FactureCorbeille';
import ClientTrashPage from './features/clientManagement/components/ClientTrashPage';
import Avoir from './features/purshase/AvoirFour';
import TrashPage from './features/products/components/TrashPage';

import BonLivraisonDecoupeCorbeille from "./components/BonsDevis/BonLivraisonDecoupeCorbeille";

import CorbeilleDevis from "./components/BonsDevis/CorbeilleDevis";
// import CorbeilleBonLivraison from "./components/BonsDevis/CorbeilleBonLivraison";
import TrashOrders from "./components/BonsDevis/TrashOrders";

const { Header, Content, Sider } = Layout;

const PrivateRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    // You can render a loading spinner or a placeholder here
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  useEffect(() => {
    // Initialize authentication setup
    AuthService.setupAxiosInterceptors();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Authentication routes */}
          <Route
            path="/login"
            element={
              <LoginForm onSuccess={() => (window.location.href = "/")} />
            }
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <StockProvider>
                  <ClientMaterialProvider>
                    <OrderProvider>
                      <InstallmentProvider>
                        <ProductProvider>
                          <Layout style={{ minHeight: "100vh" }}>
                            <Header className="app-header">
                              <Navigation />
                            </Header>
                            <Layout>
                              <Sider
                                theme="light"
                                width={300}
                                className="app-sider"
                              >
                                <SideMenu />
                              </Sider>
                              <Content className="main-content">
                                <Routes>
                                  <Route path="/" element={<Dashboard />} />
                                  <Route
                                    path="/stock"
                                    element={<StockManagement />}
                                  />
                                  <Route
                                    path="/stock/produits"
                                    element={<StockManagement />}
                                  />
                                  <Route
                                    path="/stock/matieres"
                                    element={<ClientMaterialManagement />}
                                  />
                                  <Route
                                    path="/client-materials"
                                    element={<ClientMaterialManagement />}
                                  />
                                  <Route
                                    path="/client-materials/:client_id"
                                    element={<ClientRawMaterialsPage />}
                                  />
                                  <Route
                                    path="/orders"
                                    element={<OrderManagement />}
                                  />
                                  <Route
                                    path="/manifeste/travaux"
                                    element={<WorkManagementPage />}
                                  />
                                  <Route
                                    path="/manifeste"
                                    element={<ManifestePage />}
                                  />
                                  <Route
                                    path="/manifeste/bons"
                                    element={<ManifestePage />}
                                  />
                                  {/* <Route path="/manifeste/inventaire" element={<ManifestePage />} /> */}
                                  <Route
                                    path="/bons/avoir"
                                    element={<Facture nature={'avoir'} />}
                                  />
                                  <Route
                                    path="/reglements/factures"
                                    element={<Facture nature={'facture'}/>}
                                  />
                                  <Route
                                    path="/reglements/avoir-facture"
                                    element={<Facture nature={'avoir-facture'} />}
                                  />
                                  <Route
                                    path="/reglements/traites"
                                    element={<InstallmentManagement />}
                                  />
                                  <Route
                                    path="/reglements/rapport"
                                    element={<Dashboard />}
                                  />
                                  <Route
                                    path="/installments"
                                    element={<InstallmentManagement />}
                                  />
                                  <Route
                                    path="/clients"
                                    element={<ClientManagementPage />}
                                  />
                                  <Route
                                    path="/bons/livraison-reception"
                                    element={<BonLivraisonReception />}
                                  />
                                  <Route
                                    path="/bons/livraison-decoupe"
                                    element={<BonLivraisonDecoupe />}
                                  />
                                  <Route
                                    path="/bons/retour"
                                    element={<BonRetour />}
                                  />
                                  <Route
                                    path="/bons/commande"
                                    element={<BonCommande />}
                                  />
                                  <Route
                                    path="/bons/devis"
                                    element={<Devis />}
                                  />
                                  <Route path="/achats" element={<PurshaseMatiere />} />
                                  <Route path="/achats/matieres" element={<MaterialAchatManagement />} />
                                  <Route path="/achats/factures-matieres" element={<FactureMatiere />} />
                                  <Route path="/achats/bon-livraison" element={<BonLivraison />} />
                                  <Route path="/fournisseurs" element={<Fournisseur />} />
                                  <Route path="/achats/consommables" element={<Consommable />} />
                                  <Route path="/achats/bon-retour-fournisseur" element={<BonRetourFornisseur />} />
                                  <Route path="/achats/traite-fournisseur" element={<SupplierInstallmentPage />} />
                                  <Route path="/achats/gestion-traites-fournisseur" element={<SupplierInstallmentManagementPage />} />
                                  <Route path="/employes" element={<EmployeeManagement />} />
                                  <Route path="/employes/avance" element={<AvancePage />} />
                                  <Route path="/employes/fiche-paie" element={<EmployeePayrollList />} />
                                  <Route path="/employes/:id/fiches-paie" element={<EmployeePayrollDetails />} />
                                  <Route path="/fiches-paie/:id/print" element={<FichePaiePrint />} />
                                  <Route path="/fiche-paie/:id/view" element={<FichePaieView />} />
                                  <Route path="/tresorerie" element={<Tresorerie />} />
                                  <Route path="/tresorerie/traite" element={<TresorerieTraite />} />
                                  <Route path="/tresorerie/par-periode" element={<ParPeriode />} />
                                  <Route path="/tresorerie/simulation" element={<Simulation />} />
                                  <Route path="/factures/corbeille" element={<FactureCorbeille nature='facture'/>} />
                                  <Route path="/avoirs-factures/corbeille" element={<FactureCorbeille nature='avoir-facture'/>} />
                                  <Route path="/avoirs/corbeille" element={<FactureCorbeille nature='avoir' />} />
                                  <Route path="/bons/livraison-decoupe/corbeille" element={<BonLivraisonDecoupeCorbeille />} />
                                  <Route path="/clients/trash" element={<ClientTrashPage />} />

                                  <Route path="/products/trash" element={<TrashPage />} />  

                                  <Route path="/achats/avoir" element={<Avoir />} />
                                  <Route path="/trash" element={<TrashPage />} />
                                  <Route path="/devis/corbeille" element={<CorbeilleDevis />} />
                                  {/* <Route path="/corbeille-bon-livraison" element={<CorbeilleBonLivraison />} /> */}
                                  <Route path="/commandes/corbeille" element={<TrashOrders />} />

                                </Routes>
                              </Content>
                            </Layout>
                          </Layout>
                        </ProductProvider>
                      </InstallmentProvider>
                    </OrderProvider>
                  </ClientMaterialProvider>
                </StockProvider>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;