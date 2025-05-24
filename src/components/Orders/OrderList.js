import React, { useContext, useState } from 'react';
import { OrderContext } from '../../contexts/OrderContext';
import InvoiceGenerator, { generatePDF } from './InvoiceGenerator';
import './OrderList.css';

function OrderList({ orders }) {
  const { findClient } = useContext(OrderContext);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [orderStatuses, setOrderStatuses] = useState(
    orders.reduce((acc, order) => {
      acc[order.id] = 'payé';
      return acc;
    }, {})
  );

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
                      onClick={() => generatePDF(order, findClient(order.clientId))}
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
                <InvoiceGenerator order={selectedOrder} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OrderList;
