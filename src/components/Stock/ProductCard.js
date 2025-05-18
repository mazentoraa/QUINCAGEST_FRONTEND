import React, { useState, useContext, useEffect } from 'react';
import { StockContext } from '../../contexts/StockContext';
import './ProductCard.css';

// Styles pour la galerie d'images
const galleryStyles = `
  .image-gallery {
    position: relative;
    width: 100%;
    margin-bottom: 15px;
  }
  
  .main-image {
    width: 100%;
    height: 250px;
    object-fit: contain;
    border-radius: 4px;
    background-color: #f8f8f8;
  }
  
  .image-controls {
    position: absolute;
    top: 50%;
    width: 100%;
    display: flex;
    justify-content: space-between;
    transform: translateY(-50%);
    padding: 0 10px;
  }
  
  .prev-image, .next-image {
    background-color: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .prev-image:hover, .next-image:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
  
  .image-thumbnails {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    padding: 8px 0;
    scrollbar-width: thin;
  }
  
  .thumbnail {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 4px;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  
  .thumbnail.active {
    border-color: #0066cc;
  }
  
  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Styles pour le formulaire d'édition
const editFormStyles = `
  .images-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
  }
  
  .image-preview-container {
    position: relative;
    width: 80px;
    height: 80px;
    border: 2px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  
  .image-preview-container.active {
    border-color: #0066cc;
  }
  
  .image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .remove-image-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    background-color: rgba(255, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .remove-image-btn:hover {
    background-color: rgba(255, 0, 0, 0.9);
  }
`;

function ProductCard({ product }) {
  const { updateProduct, deleteProduct } = useContext(StockContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({ ...product });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageFiles, setImageFiles] = useState([]);

  // Réinitialiser l'état édité lorsque le produit change
  useEffect(() => {
    setEditedProduct({ ...product });
  }, [product]);

  // Réinitialiser l'index d'image lorsqu'on entre en mode édition
  useEffect(() => {
    if (isEditing) {
      setImageFiles([]);
    }
  }, [isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct({ 
      ...editedProduct, 
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
            setEditedProduct({ 
              ...editedProduct, 
              images: [...(editedProduct.images || []), ...newImagesUrls] 
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (indexToRemove) => {
    setEditedProduct({
      ...editedProduct,
      images: editedProduct.images.filter((_, index) => index !== indexToRemove)
    });
    
    if (imageFiles.length > indexToRemove) {
      setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
    }
    
    // Ajuster l'index de l'image actuelle si nécessaire
    if (currentImageIndex >= editedProduct.images.length - 1) {
      setCurrentImageIndex(Math.max(0, editedProduct.images.length - 2));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProduct(product.id, editedProduct);
    setIsEditing(false);
    setCurrentImageIndex(0); // Réinitialiser l'index d'image après l'enregistrement
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct(product.id);
    }
  };

  const nextImage = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
      );
    }
  };

  return (
    <div className="product-card">
      <style>{galleryStyles}</style>
      <style>{editFormStyles}</style>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Nom</label>
            <input
              type="text"
              id="name"
              name="name"
              value={editedProduct.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="material">Matériau</label>
            <select
              id="material"
              name="material"
              value={editedProduct.material}
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
              value={editedProduct.thickness}
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
              value={editedProduct.surface}
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
              value={editedProduct.description}
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
            {editedProduct.images && editedProduct.images.length > 0 && (
              <div className="images-preview">
                {editedProduct.images.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className={`image-preview-container ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`Aperçu du produit ${index + 1}`} 
                      className="image-preview"
                    />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-btn">Enregistrer</button>
            <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Annuler</button>
          </div>
        </form>
      ) : (
        <>
          <div className="product-image">
            {product.images && product.images.length > 0 ? (
              <div className="image-gallery">
                <img 
                  src={product.images[currentImageIndex]} 
                  alt={product.name} 
                  className="main-image"
                />
                {product.images.length > 1 && (
                  <>
                    <div className="image-controls">
                      <button className="prev-image" onClick={prevImage}>
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button className="next-image" onClick={nextImage}>
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                    <div className="image-thumbnails">
                      {product.images.map((image, index) => (
                        <div 
                          key={index} 
                          className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <img src={image} alt={`${product.name} - miniature ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="no-image">Pas d'image</div>
            )}
          </div>
          
          <div className="product-info">
            <h3>{product.name}</h3>
            <p className="material"><strong>Matériau:</strong> {product.material}</p>
            <p className="thickness"><strong>Épaisseur:</strong> {product.thickness} mm</p>
            <p className="surface"><strong>Surface:</strong> {product.surface} m²</p>
            {product.description && <p className="description">{product.description}</p>}
          </div>
          
          <div className="product-actions">
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              <i className="fas fa-edit"></i>
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </>
      )}
    </div>
  );
}


export default ProductCard;