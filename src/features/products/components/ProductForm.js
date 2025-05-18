import React, { useState, useContext } from 'react';
import { StockContext } from '../../stock/contexts/StockContext';
import './ProductForm.css';

function ProductForm() {
  const { addProduct } = useContext(StockContext);
  const [product, setProduct] = useState({
    name: '',
    material: '',
    thickness: '',
    surface: '',
    description: '',
    images: []
  });
  const [imageFiles, setImageFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ 
      ...product, 
      [name]: name === 'thickness' || name === 'surface'
        ? parseFloat(value) 
        : value 
    });
  };

  const handleImagesChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setImageFiles([...imageFiles, ...filesArray]);
      
      // Créer des URLs pour les aperçus des images
      const newImagesUrls = [];
      
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImagesUrls.push(e.target.result);
          
          // Mettre à jour l'état une fois que toutes les images sont chargées
          if (newImagesUrls.length === filesArray.length) {
            setProduct({ 
              ...product, 
              images: [...product.images, ...newImagesUrls] 
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (indexToRemove) => {
    setProduct({
      ...product,
      images: product.images.filter((_, index) => index !== indexToRemove)
    });
    setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addProduct(product);
    
    // Réinitialiser le formulaire
    setProduct({
      name: '',
      material: '',
      thickness: '',
      surface: '',
      description: '',
      images: []
    });
    setImageFiles([]);
    
    // Fermer le modal
    document.querySelector('[data-bs-dismiss="modal"]').click();
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-group">
        <label htmlFor="name">Nom du produit</label>
        <input
          type="text"
          id="name"
          name="name"
          value={product.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="material">Type de matériau</label>
        <select
          id="material"
          name="material"
          value={product.material}
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
          value={product.thickness}
          onChange={handleChange}
          step="0.1"
          min="0.1"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="surface">Surface (m²)</label>
        <input
          type="number"
          id="surface"
          name="surface"
          value={product.surface}
          onChange={handleChange}
          step="0.01"
          min="0.01"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={product.description}
          onChange={handleChange}
        ></textarea>
      </div>
      
      <div className="form-group">
        <label htmlFor="images">Images du produit</label>
        <input
          type="file"
          id="images"
          name="images"
          accept="image/*"
          onChange={handleImagesChange}
          multiple
        />
        {product.images.length > 0 && (
          <div className="images-preview">
            {product.images.map((imageUrl, index) => (
              <div key={index} className="image-preview-container">
                <img 
                  src={imageUrl} 
                  alt={`Aperçu du produit ${index + 1}`} 
                  className="image-preview"
                />
                <button 
                  type="button" 
                  className="remove-image-btn"
                  onClick={() => removeImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button type="submit" className="submit-btn">Ajouter le produit</button>
    </form>
  );
}

export default ProductForm;