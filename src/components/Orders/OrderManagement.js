import React, { useContext, useState } from 'react';
import { OrderContext } from '../../contexts/OrderContext';
import OrderList from './OrderList';
import OrderForm from './OrderForm';
import './OrderManagement.css';

function OrderManagement() {
  const { orders } = useContext(OrderContext);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  return (
    <div className="order-management">
      <div className="order-header">
        <h1>Gestion des Commandes</h1>
        <button 
          className="add-order-btn" 
          onClick={() => setShowNewOrderForm(true)}
        >
          <i className="fas fa-plus"></i> Nouvelle Commande
        </button>
      </div>
      
      {showNewOrderForm ? (
        <div className="new-order-container">
          <button 
            className="close-btn" 
            onClick={() => setShowNewOrderForm(false)}
          >
            <i className="fas fa-times"></i>
          </button>
          <OrderForm onComplete={() => setShowNewOrderForm(false)} />
        </div>
      ) : (
        <OrderList orders={orders} />
      )}
    </div>
  );
}

export default OrderManagement;