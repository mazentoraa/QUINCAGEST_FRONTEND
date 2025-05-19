/**
 * Represents a product in the system
 */
class Product {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nom_produit = data.nom_produit || '';
    this.description = data.description || '';
    this.type_matiere = data.type_matiere || '';
    // Ensure prix is always a number, convert if necessary
    this.prix = typeof data.prix === 'number' ? data.prix : parseFloat(data.prix || 0);
    this.image = data.image || null;
    this.epaisseur = typeof data.epaisseur === 'number' ? data.epaisseur : parseFloat(data.epaisseur || 0);
    this.longueur = typeof data.longueur === 'number' ? data.longueur : parseFloat(data.longueur || 0);
    this.surface = typeof data.surface === 'number' ? data.surface : parseFloat(data.surface || 0);
    this.date_creation = data.date_creation || null;
    this.derniere_mise_a_jour = data.derniere_mise_a_jour || null;
  }

  // Convert form data to API format
  static fromFormData(formData) {
    return new Product({
      nom_produit: formData.name,
      description: formData.description,
      type_matiere: formData.material,
      prix: parseFloat(formData.price) || 0,
      epaisseur: parseFloat(formData.thickness) || 0,
      longueur: parseFloat(formData.length) || 0,
      surface: parseFloat(formData.surface) || 0,
      image: formData.image || null
    });
  }

  // Convert to form data format
  toFormData() {
    return {
      name: this.nom_produit,
      description: this.description,
      material: this.type_matiere,
      price: this.prix,
      thickness: this.epaisseur,
      length: this.longueur,
      surface: this.surface,
      image: this.image
    };
  }

  static fromJSON(json) {
    // Make a defensive copy to avoid mutating the original
    const data = { ...json };
    
    // Ensure price is a number
    if (data.prix !== undefined) {
      data.prix = parseFloat(data.prix) || 0;
    }
    
    return new Product(data);
  }

  toJSON() {
    return {
      id: this.id,
      nom_produit: this.nom_produit,
      description: this.description,
      type_matiere: this.type_matiere,
      prix: this.prix,
      image: this.image,
      epaisseur: this.epaisseur,
      longueur: this.longueur,
      surface: this.surface,
      date_creation: this.date_creation,
      derniere_mise_a_jour: this.derniere_mise_a_jour,
    };
  }
  
  // Helper method for formatted price
  getFormattedPrice() {
    try {
      // Safely handle price formatting
      return typeof this.prix === 'number' ? 
        this.prix.toFixed(2) + ' €' : 
        parseFloat(this.prix || 0).toFixed(2) + ' €';
    } catch (e) {
      console.error('Error formatting price:', e);
      return '0.00 €';
    }
  }
}

export default Product;
