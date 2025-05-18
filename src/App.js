import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import StockManagement from './components/Stock/StockManagement';
import ClientMaterialManagement from './components/Stock/ClientMaterialManagement';
import OrderManagement from './components/Orders/OrderManagement';
import InstallmentManagement from './components/Installments/InstallmentManagement';
import Navigation from './components/Navigation';
import { StockProvider } from './contexts/StockContext';
import { ClientMaterialProvider } from './contexts/ClientMaterialContext';
import { OrderProvider } from './contexts/OrderContext';
import { InstallmentProvider } from './contexts/InstallmentContext';
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