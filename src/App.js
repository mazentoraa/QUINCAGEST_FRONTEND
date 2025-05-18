import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import StockManagement from './features/stock/components/StockManagement';
import ClientMaterialManagement from './features/clientMaterials/components/ClientMaterialManagement';
import OrderManagement from './components/Orders/OrderManagement';
import InstallmentManagement from './features/installments/components/InstallmentManagement';
import Navigation from './components/Navigation';
import { StockProvider } from './features/stock/contexts/StockContext';
import { ClientMaterialProvider } from './features/clientMaterials/contexts/ClientMaterialContext';
import { OrderProvider } from './contexts/OrderContext';
import { InstallmentProvider } from './features/installments/contexts/InstallmentContext';
import './App.css';

function App() {
  return (
    <Router>
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
                    <Route path="/orders" element={<OrderManagement />} />
                    <Route path="/installments" element={<InstallmentManagement />} />
                  </Routes>
                </div>
              </div>
            </InstallmentProvider>
          </OrderProvider>
        </ClientMaterialProvider>
      </StockProvider>
    </Router>
  );
}

export default App;