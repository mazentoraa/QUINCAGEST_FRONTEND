import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import StockManagement from './features/stock/components/StockManagement';
import ClientMaterialManagement from './features/clientMaterials/components/ClientMaterialManagement';
import ClientManagementPage from './features/clientManagement';
import ClientRawMaterialsPage from './features/clientManagement/components/ClientRawMaterialsPage';
import OrderManagement from './components/Orders/OrderManagement';
import InstallmentManagement from './features/installments/components/InstallmentManagement';
import Navigation from './components/Navigation';
import { StockProvider } from './features/stock/contexts/StockContext';
import { ClientMaterialProvider } from './features/clientMaterials/contexts/ClientMaterialContext';
import { OrderProvider } from './contexts/OrderContext';
import { InstallmentProvider } from './features/installments/contexts/InstallmentContext';
import { AuthProvider } from './features/authentication/context/AuthContext';
import LoginForm from './features/authentication/components/LoginForm';
import AuthService from './services/AuthService';
import './App.css';

// Simple PrivateRoute component
const PrivateRoute = ({ children }) => {
  const user = AuthService.getCurrentUser();
  return user ? children : <Navigate to="/login" />;
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
          <Route path="/login" element={<LoginForm onSuccess={() => window.location.href = "/"} />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <PrivateRoute>
              <StockProvider>
                <ClientMaterialProvider>
                  <OrderProvider>
                    <InstallmentProvider>
                      <div className="app">
                        <Navigation />
                        <div className="main-content">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/stock" element={<StockManagement />} />
                            <Route path="/client-materials" element={<ClientMaterialManagement />} />
                            <Route path="/client-materials/:clientId" element={<ClientRawMaterialsPage />} />
                            <Route path="/orders" element={<OrderManagement />} />
                            <Route path="/installments" element={<InstallmentManagement />} />
                            <Route path="/clients" element={<ClientManagementPage />} />
                          </Routes>
                        </div>
                      </div>
                    </InstallmentProvider>
                  </OrderProvider>
                </ClientMaterialProvider>
              </StockProvider>
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;