/**
 * Client model structure
 * 
 * @typedef {Object} Client
 * @property {string} id - Unique identifier for the client
 * @property {string} nom_client - Client name (required)
 * @property {string} numero_fiscal - Fiscal registration number (required)
 * @property {string} [adresse] - Client address
 * @property {string} [telephone] - Client phone number
 * @property {string} [nom_responsable] - Manager or responsible person's name
 * @property {string} [email] - Client's email
 * @property {string} [email_responsable] - Manager or responsible person's email
 * @property {string} [telephone_responsable] - Manager or responsible person's phone number
 * @property {string} [autre_numero] - Other optional number
 * @property {string} [informations_complementaires] - Additional information about the client
 * @property {Date} date_creation - Date when the client was created
 * @property {Date} derniere_mise_a_jour - Date when the client was last updated
 */

export default class ClientModel {
  constructor(data = {}) {
    this.id = data.id || '';
    // Use snake_case consistently
    this.nom_client = data.nom_client || '';
    this.numero_fiscal = data.numero_fiscal || '';
    this.adresse = data.adresse || '';
    this.telephone = data.telephone || '';
    this.nom_responsable = data.nom_responsable || '';
    this.email = data.email || '';
    this.email_responsable = data.email_responsable || '';
    this.telephone_responsable = data.telephone_responsable || '';
    this.autre_numero = data.autre_numero || '';
    this.informations_complementaires = data.informations_complementaires || '';
    this.date_creation = data.date_creation ? new Date(data.date_creation) : new Date();
    this.derniere_mise_a_jour = data.derniere_mise_a_jour ? new Date(data.derniere_mise_a_jour) : new Date();
  }

  static createEmpty() {
    return new ClientModel();
  }

  // Model is already in snake_case format for API
  toApiFormat() {
    return {
      nom_client: this.nom_client,
      numero_fiscal: this.numero_fiscal,
      adresse: this.adresse,
      telephone: this.telephone,
      nom_responsable: this.nom_responsable,
      email: this.email,
      email_responsable: this.email_responsable,
      telephone_responsable: this.telephone_responsable,
      autre_numero: this.autre_numero,
      informations_complementaires: this.informations_complementaires
    };
  }
}
