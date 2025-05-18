import React, { useState, useContext } from 'react';
import { ClientMaterialContext } from '../contexts/ClientMaterialContext';
import './ClientMaterialForm.css';

function ClientMaterialForm() {
  const { addClientMaterial } = useContext(ClientMaterialContext);
  const [clientMaterial, setClientMaterial] = useState({
    clientName: '',
    clientId: '',
    deliveryNote: '',
    material: '',
    thickness: '',
    length: '',
    width: '',
    quantity: 0,
    description: '',
    receiptDate: new Date().toISOString().split('T')[0],
    status: 'received'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientMaterial({ 
      ...clientMaterial, 
      [name]: ['quantity', 'thickness', 'length', 'width'].includes(name)
        ? parseFloat(value) 
        : value 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Générer un numéro de bon de livraison si non fourni
    const materialWithDeliveryNote = {
      ...clientMaterial,
      deliveryNote: clientMaterial.deliveryNote || `BL-${Date.now()}`,
      receivedAt: new Date().toISOString()
    };
    
    addClientMaterial(materialWithDeliveryNote);
    
    // Réinitialiser le formulaire
    setClientMaterial({
      clientName: '',
      clientId: '',
      deliveryNote: '',
      material: '',
      thickness: '',
      length: '',
      width: '',
      quantity: 0,
      description: '',
      receiptDate: new Date().toISOString().split('T')[0],
      status: 'received'
    });
    
    // Fermer le modal
    document.querySelector('[data-bs-dismiss="modal"]').click();
  };

  return (
    <form onSubmit={handleSubmit} className="client-material-form">
      <div className="form-header">
        <h3>Réception de matière première client</h3>
      </div>

      <div className="form-section">
        <h4>Informations client</h4>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clientName">Nom du client</label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={clientMaterial.clientName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="clientId">ID Client</label>
            <input
              type="text"
              id="clientId"
              name="clientId"
              value={clientMaterial.clientId}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="deliveryNote">N° Bon de livraison</label>
            <input
              type="text"
              id="deliveryNote"
              name="deliveryNote"
              value={clientMaterial.deliveryNote}
              onChange={handleChange}
              placeholder="Généré automatiquement si vide"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="receiptDate">Date de réception</label>
            <input
              type="date"
              id="receiptDate"
              name="receiptDate"
              value={clientMaterial.receiptDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Caractéristiques du matériau</h4>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="material">Type de matériau</label>
            <select
              id="material"
              name="material"
              value={clientMaterial.material}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un matériau</option>
              <option value="inox">Inox</option>
              <option value="fer">Fer</option>
              <option value="aluminium">Aluminium</option>
              <option value="cuivre">Cuivre</option>
              <option value="laiton">Laiton</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="thickness">Épaisseur (mm)</label>
            <input
              type="number"
              id="thickness"
              name="thickness"
              value={clientMaterial.thickness}
              onChange={handleChange}
              step="0.1"
              min="0.1"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="length">Longueur (mm)</label>
            <input
              type="number"
              id="length"
              name="length"
              value={clientMaterial.length}
              onChange={handleChange}
              step="1"
              min="1" 
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="width">Largeur (mm)</label>
            <input
              type="number"
              id="width"
              name="width"
              value={clientMaterial.width}
              onChange={handleChange}
              step="1"
              min="1"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantité</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={clientMaterial.quantity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description / Observations</label>
          <textarea
            id="description"
            name="description"
            value={clientMaterial.description}
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <button type="submit" className="submit-btn">Enregistrer la réception</button>
    </form>
  );
}

export default ClientMaterialForm;