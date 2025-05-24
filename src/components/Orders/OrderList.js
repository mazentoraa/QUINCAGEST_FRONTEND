import React, { useContext, useEffect, useState } from 'react';
import { OrderContext } from '../../contexts/OrderContext';
import InvoiceGenerator, { generatePDF } from './InvoiceGenerator';
import './OrderList.css';
import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

function OrderList({ orders }) {
  const { findClient } = useContext(OrderContext);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [factures, setFactures] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState(
    orders.reduce((acc, order) => {
      acc[order.id] = 'payé';
      return acc;
    }, {})
  );

  useEffect(() => {
    getFacture();
  }, []);


  const getFacture = () => {
    try {
      const response = axios.get(`${API_BASE_URL}/factures_produits`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = response.result;
      setFactures(data);
    }catch (error) {
      console.error("Erreur lors de la récupération des factures :", error);
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-TN');
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrderStatuses(prev => ({
      ...prev,
      [orderId]: newStatus
    }));
  };

  return (
    <div className="order-list">
      <div className="order-header">
        <h1>Gestion des Factures</h1>
        
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>Aucune facture n'a été créée</p>
        </div>
      ) : (
        <>
          <table className="orders-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Client</th>
                <th>Total</th>
                <th>Mode de paiement</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id || index}>
                  <td>{order.id.substring(0, 8)}</td>
                  <td>{formatDate(order.date)}</td>
                  <td>{findClient(order.clientId) ? `${findClient(order.clientId).firstName} ${findClient(order.clientId).lastName}` : 'Client inconnu'}</td>
                  <td>{calculateTotal(order.items).toFixed(2)} DT</td>
                  <td>{order.paymentMethod === 'cash' ? 'Comptant' : 'Traites'}</td>
                  <td>
                    <select
                      value={orderStatuses[order.id] || 'payé'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`status-select ${orderStatuses[order.id] === 'non payé' ? 'unpaid' : 'paid'}`}
                    >
                      <option value="payé">PAYÉE</option>
                      <option value="non payé">NON PAYÉE</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="view-invoice-btn"
                      onClick={() => handleViewInvoice(order)}
                    >
                      Facture
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {showInvoice && selectedOrder && (
            <div className="invoice-modal">
              <div className="invoice-content">
                <button className="close-invoice-btn" onClick={() => setShowInvoice(false)}>
                  <i className="fas fa-times"></i>
                </button>
                <InvoiceGenerator 
                  order={{...selectedOrder, client: findClient(selectedOrder.clientId)}} 
                  editable={true}
                  onEdit={(updatedOrder) => setSelectedOrder(updatedOrder)}
                />
                {/* Boutons pour télécharger ou modifier la facture */}
                <div style={{display: 'flex', gap: 16, marginTop: '1.5rem', justifyContent: 'flex-end'}}>

                  
                  <button
                    className="download-invoice-btn"
                    style={{
                      background: '#337ab7', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 3px #0001'
                    }}
                    onClick={() => generatePDF(selectedOrder, selectedOrder.client)}
                  >
                    Télécharger PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OrderList;
