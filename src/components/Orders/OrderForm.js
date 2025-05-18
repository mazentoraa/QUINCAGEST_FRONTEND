import React, { useState, useContext } from 'react';
import { StockContext } from '../../contexts/StockContext';
import { OrderContext } from '../../contexts/OrderContext';
import { InstallmentContext } from '../../contexts/InstallmentContext';
import ClientForm from './ClientForm';
import './OrderForm.css';

function OrderForm({ onComplete }) {
  const { products } = useContext(StockContext);
  const { addOrder, clients, findClient } = useContext(OrderContext);
  const { addInstallmentPlan } = useContext(InstallmentContext);
  
  const [step, setStep] = useState(1);
  const [clientData, setClientData] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [installmentsCount, setInstallmentsCount] = useState(3);
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  
  const handleClientSelect = (e) => {
    setSelectedClient(e.target.value);
  };

  const handleClientSubmit = (client) => {
    setClientData(client);
    setStep(2);
  };

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0 || price <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    if (product.quantity < quantity) {
      alert(`Quantité insuffisante en stock ! Disponible: ${product.quantity}`);
      return;
    }
    
    const newItem = {
      productId: selectedProduct,
      productName: product.name,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      total: parseInt(quantity) * parseFloat(price)
    };
    
    setOrderItems([...orderItems, newItem]);
    setSelectedProduct('');
    setQuantity(1);
    setPrice(0);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.total, 0);
  };

  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
      alert('Veuillez ajouter au moins un produit à la commande.');
      return;
    }
    
    const clientId = clientData ? clientData.id : selectedClient;
    if (!clientId) {
      alert('Veuillez sélectionner ou créer un client.');
      return;
    }
    
    const orderData = {
      clientId,
      items: orderItems,
      paymentMethod,
      status: 'completed'
    };
    
    const newOrder = addOrder(orderData);
    
    if (paymentMethod === 'installments') {
      const totalAmount = calculateTotal();
      const installmentPlan = addInstallmentPlan(newOrder, installmentsCount, totalAmount);
    }
    
    onComplete();
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        // Prix suggéré, peut être modifié par l'utilisateur
        setPrice(product.price || 0);
      }
    }
  };

  return (
    <div className="order-form">
      <h2>Nouvelle Commande</h2>
      
      {step === 1 && (
        <div className="client-selection">
          <h3>Informations du client</h3>
          
          {clients.length > 0 && (
            <div className="client-select">
              <label>Sélectionner un client existant:</label>
              <select value={selectedClient} onChange={handleClientSelect}>
                <option value="">-- Sélectionner un client --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </option>
                ))}
              </select>
              {selectedClient && (
                <button 
                  className="btn-continue" 
                  onClick={() => setStep(2)}
                >
                  Continuer
                </button>
              )}
            </div>
          )}
          
          <div className="client-new">
            <h4>Ou créer un nouveau client:</h4>
            <ClientForm onSubmit={handleClientSubmit} />
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="order-details">
          <h3>Détails de la commande</h3>
          
          <div className="order-products">
            <div className="add-product-form">
              <div className="form-group">
                <label htmlFor="product">Produit:</label>
                <select 
                  id="product" 
                  value={selectedProduct} 
                  onChange={handleProductSelect}
                >
                  <option value="">-- Sélectionner un produit --</option>
                  {products.filter(p => p.quantity > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.material} ({product.quantity} en stock)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="quantity">Quantité:</label>
                <input 
                  type="number" 
                  id="quantity" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max={selectedProduct ? products.find(p => p.id === selectedProduct)?.quantity || 1 : 1}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="price">Prix unitaire (DT):</label>
                <input 
                  type="number" 
                  id="price" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <button 
                className="add-item-btn" 
                onClick={handleAddItem}
                disabled={!selectedProduct || quantity <= 0 || price <= 0}
              >
                <i className="fas fa-plus"></i> Ajouter
              </button>
            </div>
            
            <div className="order-items">
              <h4>Produits sélectionnés:</h4>
              {orderItems.length === 0 ? (
                <p>Aucun produit ajouté</p>
              ) : (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>{item.price.toFixed(2)} DT</td>
                        <td>{item.total.toFixed(2)} DT</td>
                        <td>
                          <button 
                            className="remove-item-btn" 
                            onClick={() => handleRemoveItem(index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="total-label">Total:</td>
                      <td colSpan="2" className="total-value">{calculateTotal().toFixed(2)} DT</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
            
            <div className="payment-options">
              <h4>Mode de paiement:</h4>
              <div className="payment-selector">
                <div className="radio-group">
                  <input 
                    type="radio" 
                    id="cash" 
                    name="payment" 
                    value="cash" 
                    checked={paymentMethod === 'cash'} 
                    onChange={() => setPaymentMethod('cash')}
                  />
                  <label htmlFor="cash">Comptant</label>
                </div>
                
                <div className="radio-group">
                  <input 
                    type="radio" 
                    id="installments" 
                    name="payment" 
                    value="installments" 
                    checked={paymentMethod === 'installments'} 
                    onChange={() => setPaymentMethod('installments')}
                  />
                  <label htmlFor="installments">Traites</label>
                </div>
              </div>
              
              {paymentMethod === 'installments' && (
                <div className="installments-options">
                  <label htmlFor="installments-count">Nombre de traites:</label>
                  <select 
                    id="installments-count" 
                    value={installmentsCount} 
                    onChange={(e) => setInstallmentsCount(parseInt(e.target.value))}
                  >
                    <option value="2">2 traites</option>
                    <option value="3">3 traites</option>
                    <option value="4">4 traites</option>
                    <option value="6">6 traites</option>
                    <option value="12">12 traites</option>
                  </select>
                  
                  <div className="installment-preview">
                    <p>Montant par traite: <strong>{(calculateTotal() / installmentsCount).toFixed(2)}</strong> DT</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="order-actions">
              <button 
                className="btn-back" 
                onClick={() => setStep(1)}
              >
                <i className="fas fa-arrow-left"></i> Retour
              </button>
              
              <button 
                className="btn-submit" 
                onClick={handleSubmitOrder}
                disabled={orderItems.length === 0}
              >
                <i className="fas fa-check"></i> Confirmer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderForm;