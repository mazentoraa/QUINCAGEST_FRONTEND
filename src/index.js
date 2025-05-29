import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'antd/dist/reset.css'; // Import Ant Design styles
import { InvoiceProvider } from './contexts/InvoiceContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <InvoiceProvider>
      <App />
    </InvoiceProvider>
  </React.StrictMode>
);
