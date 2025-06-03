import React, { createContext, useState, useEffect, useContext } from 'react';
import { StockContext } from '../features/stock/contexts/StockContext';
import { mockOrders, mockClients } from '../data/mockData';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const { products, updateStock } = useContext(StockContext);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    // Dans une application réelle, vous chargeriez les données depuis une API
    setOrders(mockOrders);
    setClients(mockClients);
  }, []);

  const addClient = (client) => {
    const newClient = {
      ...client,
      id: Date.now().toString(),
    };
    setClients([...clients, newClient]);
    return newClient;
  };

  const findClient = (id) => {
    return clients.find(client => client.id === id);
  };

const addOrder = (order) => {
  // Trouver l'ID le plus élevé existant
  const maxId = orders.reduce((max, o) => {
    const idNum = parseInt(o.id, 10);
    return !isNaN(idNum) && idNum > max ? idNum : max;
  }, 0);

  // Nouvel ID auto-incrémenté
  const nextId = maxId + 1;

  // numero_commande = id
  const numero_commande = nextId.toString();

  const newOrder = {
    ...order,
    id: numero_commande,
    numero_commande: numero_commande,
    date: new Date().toISOString(),
  };

  // Mise à jour des stocks
  if (order.items) {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        updateStock(product.id, product.quantity - item.quantity);
      }
    });
  }

  setOrders([...orders, newOrder]);
  return newOrder;
};


  const updateOrder = (id, updatedOrder) => {
    const updatedOrders = orders.map(order => 
      order.id === id ? { ...order, ...updatedOrder } : order
    );
    setOrders(updatedOrders);
  };

  const getOrdersByClient = (clientId) => {
    return orders.filter(order => order.clientId === clientId);
  };

  return (
    <OrderContext.Provider 
      value={{ 
        orders, 
        clients, 
        addOrder, 
        updateOrder, 
        addClient,
        findClient,
        getOrdersByClient
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};