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
 * @property {number} longueur - Longueur (optionnel)
 * @property {number} largeur - Largeur (optionnel)
 * @property {number} surface - Surface (optionnel)
 * @property {number} epaisseur - Épaisseur (optionnel)
 */

class MaterialModel {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.ref = data.ref ?? '';
    this.nom_matiere = data.nom_matiere ?? '';
    this.categorie = data.categorie ?? '';
    this.description = data.description ?? '';
    this.remaining_quantity = parseFloat(data.remaining_quantity ?? 0);
    this.stock_minimum = parseFloat(data.stock_minimum ?? 0);
    this.emplacement = data.emplacement ?? '';
    this.fournisseur_principal = data.fournisseur_principal ?? '';
    this.prix_unitaire = parseFloat(data.prix_unitaire ?? 0);
    this.date_reception = data.date_reception ?? null;
    this.ref_fournisseur = data.ref_fournisseur ?? '';

    // ✅ Champs ajoutés
    this.longueur = parseFloat(data.longueur ?? 0);
    this.largeur = parseFloat(data.largeur ?? 0);
    this.surface = parseFloat(data.surface ?? 0);
    this.epaisseur = parseFloat(data.epaisseur ?? 0);
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
      remaining_quantity: this.remaining_quantity,
      stock_minimum: this.stock_minimum,
      emplacement: this.emplacement,
      fournisseur_principal: this.fournisseur_principal,
      prix_unitaire: this.prix_unitaire,
      date_reception: this.date_reception
        ? new Date(this.date_reception).toISOString().split('T')[0]
        : null,
      ref_fournisseur: this.ref_fournisseur,

      // ✅ Ajout des nouveaux champs
      longueur: this.longueur,
      largeur: this.largeur,
      surface: this.surface,
      epaisseur: this.epaisseur,
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
      remaining_quantity: 0,
      stock_minimum: 0,
      emplacement: '',
      fournisseur_principal: '',
      prix_unitaire: 0,
      date_reception: null,
      ref_fournisseur: '',

      // ✅ Champs vides par défaut
      longueur: 0,
      largeur: 0,
      surface: 0,
      epaisseur: 0,
    });
  }
}

export default MaterialModel;
