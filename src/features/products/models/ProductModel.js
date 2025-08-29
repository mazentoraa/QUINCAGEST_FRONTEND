class ProductModel {
  constructor(data) {
    // IDs and names
    this.id = data.id;
    this.name = data.nom_produit || data.name;
    this.nom_produit = data.nom_produit || data.name;

    // Reference code
    this.ref_produit = data.ref_produit || data.ref;

    // Categorization
    this.categorie = data.categorie || "";
    this.sous_categorie = data.sous_categorie || "";
    this.materiau = data.materiau || "";
    this.fournisseur = data.fournisseur || "";

    // Stock + inventory
    this.stock_initial =
      data.stock_initial !== undefined ? parseInt(data.stock_initial) : 0;
    this.seuil_alerte =
      data.seuil_alerte !== undefined ? parseInt(data.seuil_alerte) : 0;

    // Unit and status
    this.unite_mesure = data.unite_mesure || "";
    this.statut = data.statut || "actif";
    this.code_barres = data.code_barres || "";
    this.emplacement = data.emplacement || "";

    // Prices
    this.prix_achat =
      data.prix_achat !== undefined && data.prix_achat !== null
        ? parseFloat(data.prix_achat)
        : 0;
    this.prix_unitaire =
      data.prix_unitaire !== undefined && data.prix_unitaire !== null
        ? parseFloat(data.prix_unitaire)
        : 0;

    // Legacy compatibility (for components that still expect "price")
    this.price = this.prix_unitaire;

    // Other details
    this.description = data.description || "";

    // Image
    this.image = typeof data.image === "string" ? data.image : undefined;

    // Timestamps
    this.created_at = data.date_creation
      ? new Date(data.date_creation)
      : null;
    this.updated_at = data.derniere_mise_a_jour
      ? new Date(data.derniere_mise_a_jour)
      : null;

    this.date_creation = data.date_creation;
    this.derniere_mise_a_jour = data.derniere_mise_a_jour;
  }

  // Formatting methods
  getFormattedPurchasePrice() {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(this.prix_achat);
  }

  getFormattedSalePrice() {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(this.prix_unitaire);
  }
}

export default ProductModel;
