/**
 * Modèle de matière première achetée
 * 
 * @typedef {Object} Material
 * @property {number} [id] - Identifiant unique
 * @property {string} ref - Référence unique
 * @property {string} nom_matiere - Nom de la matière
 * @property {string} categorie - Catégorie (metaux, plastique, etc.)
 * @property {string} description - Description
 * @property {string} unite_mesure - Unité de mesure (kg, pcs, etc.)
 * @property {number} remaining_quantity - Stock actuel
 * @property {number} stock_minimum - Stock minimum
 * @property {string} emplacement - Emplacement de stockage
 * @property {string} fournisseur_principal - Nom du fournisseur
 * @property {number} prix_unitaire - Prix unitaire
 * @property {string} date_reception - Date de réception (YYYY-MM-DD)
 * @property {string} ref_fournisseur - Référence fournisseur
 */

class MaterialModel {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.ref = data.ref ?? '';
    this.nom_matiere = data.nom_matiere ?? '';
    this.categorie = data.categorie ?? '';
    this.description = data.description ?? '';
    this.unite_mesure = data.unite_mesure ?? '';
    this.remaining_quantity = parseFloat(data.remaining_quantity ?? 0);
    this.stock_minimum = parseFloat(data.stock_minimum ?? 0);
    this.emplacement = data.emplacement ?? '';
    this.fournisseur_principal = data.fournisseur_principal ?? '';
    this.prix_unitaire = parseFloat(data.prix_unitaire ?? 0);
    this.date_reception = data.date_reception ?? null;
    this.ref_fournisseur = data.ref_fournisseur ?? '';
  }

  /**
   * Convertit l'objet vers le format attendu par l'API
   */
  to_api_format() {
    return {
      ref: this.ref,
      nom_matiere: this.nom_matiere,
      categorie: this.categorie,
      description: this.description,
      unite_mesure: this.unite_mesure,
      remaining_quantity: this.remaining_quantity,
      stock_minimum: this.stock_minimum,
      emplacement: this.emplacement,
      fournisseur_principal: this.fournisseur_principal,
      prix_unitaire: this.prix_unitaire,
      date_reception: this.date_reception
        ? new Date(this.date_reception).toISOString().split('T')[0]
        : null,
      ref_fournisseur: this.ref_fournisseur,
    };
  }

  /**
   * Initialise un objet vide (utilisé pour l'ajout)
   */
  static createEmpty() {
    return new MaterialModel({
      ref: '',
      nom_matiere: '',
      categorie: '',
      description: '',
      unite_mesure: '',
      remaining_quantity: 0,
      stock_minimum: 0,
      emplacement: '',
      fournisseur_principal: '',
      prix_unitaire: 0,
      date_reception: null,
      ref_fournisseur: '',
    });
  }
}

export default MaterialModel;
