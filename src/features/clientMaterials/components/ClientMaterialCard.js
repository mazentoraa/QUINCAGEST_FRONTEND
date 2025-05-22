import React, { useState, useContext } from 'react';
import { ClientMaterialContext } from '../../clientMaterials/contexts/ClientMaterialContext';
import './ClientMaterialCard.css';
import CuttingForm from '../../stock/components/CuttingForm';

function ClientMaterialCard({ material }) {
  const { updateClientMaterial, deleteClientMaterial } = useContext(ClientMaterialContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMaterial, setEditedMaterial] = useState({ ...material });
  const [showCuttingForm, setShowCuttingForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedMaterial({ 
      ...editedMaterial, 
      [name]: ['quantite', 'thickness', 'length', 'width', 'remainingQuantity'].includes(name)
        ? parseFloat(value) 
        : value 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateClientMaterial(material.id, editedMaterial);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette matière première client ?')) {
      deleteClientMaterial(material.id);
    }
  };

  // Calculer le pourcentage de matière utilisée
  const usagePercentage = material.quantity > 0 
    ? Math.round(((material.quantity - material.remainingQuantity) / material.quantity) * 100) 
    : 0;

  return (
    <div className={`client-material-card ${material.remainingQuantity === 0 ? 'depleted' : ''}`}>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-section">
            <h4>Informations client</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clientName">Nom du client</label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={editedMaterial.clientName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="client_id">ID Client</label>
                <input
                  type="text"
                  id="client_id"
                  name="client_id"
                  value={editedMaterial.client_id}
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
                  value={editedMaterial.deliveryNote}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="receiptDate">Date de réception</label>
                <input
                  type="date"
                  id="receiptDate"
                  name="receiptDate"
                  value={editedMaterial.receiptDate}
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
                  value={editedMaterial.material}
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
                  value={editedMaterial.thickness}
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
                  value={editedMaterial.length}
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
                  value={editedMaterial.width}
                  onChange={handleChange}
                  step="1"
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Quantité initiale</label>
                <input
                  type="number"
                  id="quantite"
                  name="quantite"
                  value={editedMaterial.quantite}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="remainingQuantity">Quantité restante</label>
                <input
                  type="number"
                  id="remainingQuantity"
                  name="remainingQuantity"
                  value={editedMaterial.remainingQuantity}
                  onChange={handleChange}
                  min="0"
                  max={editedMaterial.quantity}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description / Observations</label>
              <textarea
                id="description"
                name="description"
                value={editedMaterial.description}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-btn">Enregistrer</button>
            <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Annuler</button>
          </div>
        </form>
      ) : (
        <>
         <div className="material-header">
  <div className="client-info">
    <h3 className="client-name">{material.clientName}</h3>
    <span className="client-id">ID: {material.client_id}</span>
  </div>
  
  <div className="material-actions">
    <button 
      className="edit-btn" 
      onClick={() => setIsEditing(true)}
      title="Modifier"
    >
      <i className="fas fa-edit"></i>
    </button>
    <button 
      className="delete-btn" 
      onClick={handleDelete}
      title="Supprimer"
    >
      <i className="fas fa-trash"></i>
    </button>
  </div>
</div>
          
          <div className="material-body">
            <div className="material-info">
              <div className="info-item">
                <span className="info-label">Matériau:</span>
                <span className="info-value">{material.material}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Dimensions:</span>
                <span className="info-value">{material.length} × {material.width} × {material.thickness} mm</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Bon de livraison:</span>
                <span className="info-value">{material.deliveryNote}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Date de réception:</span>
                <span className="info-value">
                  {material.receiptDate
                    ? new Date(material.receiptDate).toLocaleDateString()
                    : ''}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Quantité initiale:</span>
                <span className="info-value">{material.quantity}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Quantité restante:</span>
                <span className={`info-value ${material.remainingQuantity === 0 ? 'depleted' : ''}`}>
                  {material.remainingQuantity}
                </span>
              </div>
            </div>
            
            <div className="material-usage">
              <div className="usage-bar">
                <div 
                  className="usage-progress"
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              <div className="usage-label">Utilisé: {usagePercentage}%</div>
            </div>
            
            {material.description && (
              <div className="material-description">
                <p>{material.description}</p>
              </div>
            )}
          </div>
          
          <div className="material-footer">
            <button 
              onClick={() => setShowCuttingForm(!showCuttingForm)} 
              className="cutting-btn"
              disabled={material.remainingQuantity === 0}
            >
              <i className="fas fa-cut"></i> 
              {showCuttingForm ? 'Annuler la découpe' : 'Découper des pièces'}
            </button>
          </div>
          
          {showCuttingForm && (
            <div className="cutting-form-container">
              <CuttingForm materialId={material.id} onComplete={() => setShowCuttingForm(false)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ClientMaterialCard;