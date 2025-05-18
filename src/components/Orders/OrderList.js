import React, { useContext, useState } from 'react';
import { OrderContext } from '../../contexts/OrderContext';
import InvoiceGenerator from './InvoiceGenerator';
import './OrderList.css';

function OrderList({ orders }) {
  const { findClient } = useContext(OrderContext);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-TN');
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  return (
    <div className="order-list">
      {orders.length === 0 ? (
        <div className="no-orders">
          <p>Aucune commande n'a été créée</p>
        </div>
      ) : (
        <>
          <table className="orders-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Date</th>
                <th>Client</th>
                <th>Total</th>
                <th>Mode de paiement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const client = findClient(order.clientId);
                return (
                  <tr key={order.id}>
                    <td>{order.id.substring(0, 8)}</td>
                    <td>{formatDate(order.date)}</td>
                    <td>{client ? `${client.firstName} ${client.lastName}` : 'Client inconnu'}</td>
                    <td>{calculateTotal(order.items).toFixed(2)} DT</td>
                    <td>{order.paymentMethod === 'cash' ? 'Comptant' : 'Traites'}</td>
                    <td>
                      <button 
                        className="view-invoice-btn"
                        onClick={() => handleViewInvoice(order)}
                      >
                        <i className="fas fa-file-invoice"></i> Facture
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {showInvoice && selectedOrder && (
            <div className="invoice-modal">
              <div className="invoice-content">
                <button 
                  className="close-invoice-btn"
                  onClick={() => setShowInvoice(false)}
                >
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