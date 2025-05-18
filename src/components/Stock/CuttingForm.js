import React, { useState, useContext } from 'react';
import { ClientMaterialContext } from '../../contexts/ClientMaterialContext';
import './CuttingForm.css';

function CuttingForm({ materialId, onComplete }) {
  const { clientMaterials, addCutting } = useContext(ClientMaterialContext);
  const material = clientMaterials.find(m => m.id === materialId);
  
  const [cutting, setCutting] = useState({
    materialId: materialId,
    length: 0,
    width: 0,
    quantity: 1,
    description: ''
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCutting({ 
      ...cutting, 
      [name]: ['quantity', 'length', 'width'].includes(name)
        ? parseFloat(value) 
        : value 
    });
    
    // Effacer l'erreur pour ce champ s'il y en a une
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Vérifier si les dimensions sont valides
    if (cutting.length <= 0) {
      newErrors.length = "La longueur doit être supérieure à 0";
    } else if (material && cutting.length > material.length) {
      newErrors.length = `La longueur ne peut pas dépasser ${material.length} mm`;
    }
    
    if (cutting.width <= 0) {
      newErrors.width = "La largeur doit être supérieure à 0";
    } else if (material && cutting.width > material.width) {
      newErrors.width = `La largeur ne peut pas dépasser ${material.width} mm`;
    }
    
    // Vérifier si la quantité est valide
    if (cutting.quantity <= 0) {
      newErrors.quantity = "La quantité doit être supérieure à 0";
    } else if (material && cutting.quantity > material.remainingQuantity) {
      newErrors.quantity = `Quantité insuffisante (max: ${material.remainingQuantity})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const success = addCutting({
      ...cutting,
      thickness: material.thickness,
      material: material.material,
      clientId: material.clientId,
      clientName: material.clientName
    });
    
    if (success && onComplete) {
      onComplete();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cutting-form">
      <div className="form-header">
        <h4>Découpe de pièces</h4>
        <div className="material-info-summary">
          <span className="material-type">{material?.material}</span>
          <span className="material-thickness">{material?.thickness} mm</span>
          <span className="material-dimensions">{material?.length} × {material?.width} mm</span>
          <span className="remaining-quantity">Restant: {material?.remainingQuantity}</span>
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="length">Longueur pièce (mm)</label>
          <input
            type="number"
            id="length"
            name="length"
            value={cutting.length}
            onChange={handleChange}
            step="1"
            min="1"
            max={material?.length}
            required
            className={errors.length ? 'error' : ''}
          />
          {errors.length && <div className="error-message">{errors.length}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="width">Largeur pièce (mm)</label>
          <input
            type="number"
            id="width"
            name="width"
            value={cutting.width}
            onChange={handleChange}
            step="1"
            min="1"
            max={material?.width}
            required
            className={errors.width ? 'error' : ''}
          />
          {errors.width && <div className="error-message">{errors.width}</div>}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quantity">Quantité à découper</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={cutting.quantity}
            onChange={handleChange}
            min="1"
            max={material?.remainingQuantity}
            required
            className={errors.quantity ? 'error' : ''}
          />
          {errors.quantity && <div className="error-message">{errors.quantity}</div>}
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description / Référence</label>
        <textarea
          id="description"
          name="description"
          value={cutting.description}
          onChange={handleChange}
          placeholder="Description de la pièce ou référence client"
          rows="2"
        ></textarea>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="cut-btn">
          <i className="fas fa-cut"></i> Découper et créer bon de livraison
        </button>
      </div>
      
      <div className="form-info">
        <p>
          <i className="fas fa-info-circle"></i> 
          Cette opération générera automatiquement un bon de livraison pour les pièces découpées.
        </p>
      </div>
    </form>
  );
}

export default CuttingForm;