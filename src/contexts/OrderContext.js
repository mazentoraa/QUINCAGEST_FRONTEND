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
    // Find the max current order id as number
    const maxId = orders.reduce((max, o) => {
      const idNum = parseInt(o.id, 10);
      return !isNaN(idNum) && idNum > max ? idNum : max;
    }, 0);

    // Generate numero_commande as "FAC-YYYY-XXXXX"
    const year = new Date().getFullYear();
    const numero_commande = `FAC-${year}-${(maxId + 1).toString().padStart(5, '0')}`;

    const newOrder = {
      ...order,
      id: (maxId + 1).toString(),
      numero_commande,
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