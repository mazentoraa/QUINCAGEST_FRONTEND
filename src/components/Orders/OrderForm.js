import React, { useState, useContext } from 'react';
import { StockContext } from '../../features/stock/contexts/StockContext';
import { OrderContext } from '../../contexts/OrderContext';
import { InstallmentContext } from '../../contexts/InstallmentContext';
import './OrderForm.css';
import axios from 'axios';
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";


function OrderForm({ onComplete, onCancel }) {
  const { products } = useContext(StockContext);
  const { addOrder, clients } = useContext(OrderContext);
  const { addInstallment } = useContext(InstallmentContext);
  
  const [step, setStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, mixed, installments
  const [installmentsCount, setInstallmentsCount] = useState(3);
  const [mixedCashAmount, setMixedCashAmount] = useState(0);
  const [mixedInstallmentsCount, setMixedInstallmentsCount] = useState(3);
  
  // Pour l'ajout manuel de produits
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  
  // Suppression des hooks, fonctions et variables liés aux bons de livraison
  // - selectedDeliveryNote, setSelectedDeliveryNote
  // - deliveryNoteType, setDeliveryNoteType
  // - hourlyRate, setHourlyRate
  // - totalHours, setTotalHours
  // - deliveryNotePrice, setDeliveryNotePrice
  // - deliveryNoteExamples
  // - getClientDeliveryNotes
  // - handleAddDeliveryNote
  // - handleDeliveryNoteSelect
  // - toute référence à deliveryNoteType ou deliveryNote dans le rendu

  const handleClientSelect = (e) => {
    setSelectedClient(e.target.value);
    // Reset des items sélectionnés quand on change de client
    setSelectedItems([]);
  };

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0 || unitPrice <= 0) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    if (product.quantity < quantity) {
      alert(`Quantité insuffisante en stock ! Disponible: ${product.quantity}`);
      return;
    }
    
    const newItem = {
      id: Date.now(), // ID unique pour l'item
      type: 'product',
      productId: selectedProduct,
      name: product.name,
      description: `${product.name} - ${product.material}`,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(unitPrice),
      total: parseInt(quantity) * parseFloat(unitPrice)
    };
    
    setSelectedItems([...selectedItems, newItem]);
    setSelectedProduct('');
    setQuantity(1);
    setUnitPrice(0);
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + item.total, 0);
  };

  const getActualInstallmentsCount = () => {
    if (paymentMethod === 'mixed') {
      return mixedInstallmentsCount;
    }
    return installmentsCount;
  };

  const calculateInstallmentAmount = () => {
    const total = calculateTotal();
    const actualCount = getActualInstallmentsCount();
    
    if (paymentMethod === 'mixed') {
      return (total - mixedCashAmount) / actualCount;
    }
    return total / actualCount;
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setUnitPrice(product.price || 0);
      }
    }
  };

  const handleSubmitInvoice = () => {
    if (!selectedClient) {
      alert('Veuillez sélectionner un client.');
      return;
    }
    
    if (selectedItems.length === 0) {
      alert('Veuillez ajouter au moins un produit ou bon de livraison.');
      return;
    }
    
    if (paymentMethod === 'mixed' && mixedCashAmount >= calculateTotal()) {
      alert('Le montant comptant ne peut pas être supérieur ou égal au total.');
      return;
    }

    // Validation du nombre de traites personnalisé
    const actualInstallmentsCount = getActualInstallmentsCount();
    if ((paymentMethod === 'installments' || paymentMethod === 'mixed') && actualInstallmentsCount <= 0) {
      alert('Le nombre de traites doit être supérieur à 0.');
      return;
    }
    
    const invoiceData = {
      clientId: selectedClient,
      items: selectedItems,
      paymentMethod,
      status: 'completed',
      totalAmount: calculateTotal(),
      mixedCashAmount: paymentMethod === 'mixed' ? mixedCashAmount : 0,
      installmentsCount: actualInstallmentsCount
    };
    
    const newInvoice = addOrder(invoiceData);
    
    // Créer le plan d'échelonnement si nécessaire
    if (paymentMethod === 'installments') {
      addInstallment({
        invoice: newInvoice,
        count: actualInstallmentsCount,
        amount: calculateTotal()
      });
    } else if (paymentMethod === 'mixed') {
      const installmentAmount = calculateTotal() - mixedCashAmount;
      addInstallment({
        invoice: newInvoice,
        count: actualInstallmentsCount,
        amount: installmentAmount
      });
    }
    
    onComplete();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="order-form">
      <div className="form-header">
        <h2>Nouvelle Facture</h2>
        <button className="btn-cancel" onClick={handleCancel}>
          <i className="fas fa-times"></i> Retour à la liste
        </button>
      </div>
      
      {step === 1 && (
        <div className="client-selection">
          <h3>1. Sélection du client</h3>
          
          <div className="client-select">
            <label>Sélectionner un client:</label>
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
        </div>
      )}
      
      {step === 2 && (
        <div className="invoice-details">
          <h3>2. Sélection des produits et bons de livraison</h3>
          
          <div className="items-selection">
            {/* Ajout de produits */}
            <div className="product-section">
              <h4>Ajouter un produit</h4>
              <div className="add-product-form">
                <div className="form-row">
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
                    <label htmlFor="unitPrice">Prix unitaire (DT):</label>
                    <input 
                      type="number" 
                      id="unitPrice" 
                      value={unitPrice} 
                      onChange={(e) => setUnitPrice(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <button 
                    className="add-item-btn" 
                    onClick={handleAddProduct}
                    disabled={!selectedProduct || quantity <= 0 || unitPrice <= 0}
                  >
                    <i className="fas fa-plus"></i> Ajouter produit
                  </button>
                </div>
              </div>
            </div>
            {/* Fin ajout de produits */}
            
            {/* Liste des items sélectionnés */}
            <div className="selected-items">
              <h4>3. Articles sélectionnés</h4>
              {selectedItems.length === 0 ? (
                <div className="no-items">
                  <i className="fas fa-inbox"></i>
                  <p>Aucun article ajouté</p>
                </div>
              ) : (
                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantité/Durée</th>
                        <th>Prix unitaire</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="item-description">
                              <span className="item-type-badge">
                                {item.type === 'product' ? 'Produit' : 'Bon'}
                              </span>
                              {item.description}
                            </div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{item.unitPrice.toFixed(2)} DT</td>
                          <td><strong>{item.total.toFixed(2)} DT</strong></td>
                          <td>
                            <button 
                              className="remove-item-btn" 
                              onClick={() => handleRemoveItem(item.id)}
                              title="Supprimer cet article"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan="3" className="total-label">Total:</td>
                        <td colSpan="2" className="total-value">
                          <strong>{calculateTotal().toFixed(2)} DT</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            
            {/* Options de paiement améliorées */}
            {selectedItems.length > 0 && (
              <div className="payment-options">
                <h4>4. Mode de paiement</h4>
                <div className="payment-selector">
                  <div className="payment-option">
                    <input 
                      type="radio" 
                      id="cash" 
                      name="payment" 
                      value="cash" 
                      checked={paymentMethod === 'cash'} 
                      onChange={() => setPaymentMethod('cash')}
                    />
                    <label htmlFor="cash">
                      <i className="fas fa-money-bill-wave"></i>
                      <span>Paiement comptant</span>
                      <small>Paiement intégral immédiat</small>
                    </label>
                  </div>
                  
                  <div className="payment-option">
                    <input 
                      type="radio" 
                      id="mixed" 
                      name="payment" 
                      value="mixed" 
                      checked={paymentMethod === 'mixed'} 
                      onChange={() => setPaymentMethod('mixed')}
                    />
                    <label htmlFor="mixed">
                      <i className="fas fa-coins"></i>
                      <span>Paiement mixte</span>
                      <small>Comptant + Traites</small>
                    </label>
                  </div>
                  
                  <div className="payment-option">
                    <input 
                      type="radio" 
                      id="installments" 
                      name="payment" 
                      value="installments" 
                      checked={paymentMethod === 'installments'} 
                      onChange={() => setPaymentMethod('installments')}
                    />
                    <label htmlFor="installments">
                      <i className="fas fa-credit-card"></i>
                      <span>Paiement par traites</span>
                      <small>Échelonnement uniquement</small>
                    </label>
                  </div>
                </div>
                
                {paymentMethod === 'mixed' && (
                  <div className="mixed-payment-options">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="mixed-cash">Montant comptant (DT):</label>
                        <input 
                          type="number" 
                          id="mixed-cash" 
                          value={mixedCashAmount} 
                          onChange={(e) => setMixedCashAmount(parseFloat(e.target.value) || 0)}
                          min="0"
                          max={calculateTotal() - 1}
                          step="0.01"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Nombre de traites pour le reste:</label>
                        <input
                          type="number"
                          value={mixedInstallmentsCount}
                          onChange={e => setMixedInstallmentsCount(parseInt(e.target.value) || 1)}
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                    
                    <div className="payment-preview">
                      <div className="preview-card">
                        <h5>Résumé du paiement mixte</h5>
                        <div className="preview-details">
                          <div className="preview-item">
                            <span>Comptant:</span>
                            <strong>{mixedCashAmount.toFixed(2)} DT</strong>
                          </div>
                          <div className="preview-item">
                            <span>Reste à payer:</span>
                            <strong>{(calculateTotal() - mixedCashAmount).toFixed(2)} DT</strong>
                          </div>
                          <div className="preview-item">
                            <span>Montant par traite:</span>
                            <strong>{calculateInstallmentAmount().toFixed(2)} DT</strong>
                          </div>
                          <div className="preview-item">
                            <span>Nombre de traites:</span>
                            <strong>{getActualInstallmentsCount()}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'installments' && (
                  <div className="installments-options">
                    <div className="form-group">
                      <label>Nombre de traites:</label>
                      <input
                        type="number"
                        value={installmentsCount}
                        onChange={e => setInstallmentsCount(parseInt(e.target.value) || 1)}
                        min="1"
                        max="60"
                      />
                    </div>
                    
                    <div className="installment-preview">
                      <div className="preview-card">
                        <h5>Détails de l'échelonnement</h5>
                        <div className="preview-details">
                          <div className="preview-item">
                            <span>Montant total:</span>
                            <strong>{calculateTotal().toFixed(2)} DT</strong>
                          </div>
                          <div className="preview-item">
                            <span>Montant par traite:</span>
                            <strong>{calculateInstallmentAmount().toFixed(2)} DT</strong>
                          </div>
                          <div className="preview-item">
                            <span>Nombre de traites:</span>
                            <strong>{getActualInstallmentsCount()}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="invoice-actions">
              <button 
                className="btn-back" 
                onClick={() => setStep(1)}
              >
                <i className="fas fa-arrow-left"></i> Retour
              </button>
              
              <button 
                className="btn-cancel" 
                onClick={handleCancel}
              >
                <i className="fas fa-times"></i> Annuler
              </button>
              
              <button 
                className="btn-submit" 
                onClick={handleSubmitInvoice}
                disabled={selectedItems.length === 0}
              >
                <i className="fas fa-file-invoice"></i> Générer la facture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderForm;