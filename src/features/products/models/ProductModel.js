class ProductModel {
  constructor(data) {
    // Map backend field names to frontend properties
    this.id = data.id;
    // Handle both backend field names (nom_produit) and frontend field names (name) for flexibility
    this.name = data.nom_produit || data.name;
    this.description = data.description;

    // Ensure price is always a number
    const priceValue = data.prix || data.price;
    this.price =
      priceValue !== undefined && priceValue !== null
        ? parseFloat(priceValue)
        : 0;

    // Fix material type mapping - ensure both properties are set correctly
    this.material_type =
      data.type_matiere || data.material_type || data.material;
      
      this.image = typeof data.image === "string" ? data.image : undefined;


    // Ensure numeric values are properly converted
    this.thickness = parseFloat(data.epaisseur || data.thickness) || 0;
    this.length = parseFloat(data.longueur || data.length) || 0;
    this.surface = parseFloat(data.surface) || 0;
    this.width = parseFloat(data.largeur) || 0;

    this.created_at = data.date_creation ? new Date(data.date_creation) : null;
    this.updated_at = data.derniere_mise_a_jour
      ? new Date(data.derniere_mise_a_jour)
      : null;

    // Keep the original backend field names for backwards compatibility
    this.nom_produit = data.nom_produit || data.name;
    this.prix = this.price; // Use the converted numeric value
    this.type_matiere =
      data.type_matiere || data.material_type || data.material;
    this.epaisseur = this.thickness; // Use the converted numeric value
    this.longueur = this.length; // Use the converted numeric value
    this.largeur = this.width; // Ensure both are always available
    this.date_creation = data.date_creation;
    this.derniere_mise_a_jour = data.derniere_mise_a_jour;
    this.code = data.code_produit || data.code;
     this.code_produit = data.code_produit || data.code;
  }

  // Add any methods you want the model to have
  getFormattedPrice() {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(this.price);
  }
}

export default ProductModel;
