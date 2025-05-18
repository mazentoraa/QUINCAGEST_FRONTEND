/**
 * Client model structure
 * 
 * @typedef {Object} Client
 * @property {string} id - Unique identifier for the client
 * @property {string} nomClient - Client name (required)
 * @property {string} numeroFiscal - Fiscal registration number (required)
 * @property {string} [adresse] - Client address
 * @property {string} [telephone] - Client phone number
 * @property {string} [nomResponsable] - Manager or responsible person's name
 * @property {string} [email] - Client's email
 * @property {string} [emailResponsable] - Manager or responsible person's email
 * @property {string} [telephoneResponsable] - Manager or responsible person's phone number
 * @property {string} [autreNumero] - Other optional number
 * @property {string} [informationsComplementaires] - Additional information about the client
 * @property {Date} dateCreation - Date when the client was created
 * @property {Date} derniereMiseAJour - Date when the client was last updated
 */

export default class ClientModel {
  constructor(data = {}) {
    this.id = data.id || '';
    this.nomClient = data.nom_client || '';
    this.numeroFiscal = data.numero_fiscal || '';
    this.adresse = data.adresse || '';
    this.telephone = data.telephone || '';
    this.nomResponsable = data.nom_responsable || '';
    this.email = data.email || '';
    this.emailResponsable = data.email_responsable || '';
    this.telephoneResponsable = data.telephone_responsable || '';
    this.autreNumero = data.autre_numero || '';
    this.informationsComplementaires = data.informations_complementaires || '';
    this.dateCreation = data.date_creation ? new Date(data.date_creation) : new Date();
    this.derniereMiseAJour = data.derniere_mise_a_jour ? new Date(data.derniere_mise_a_jour) : new Date();
  }

  static createEmpty() {
    return new ClientModel();
  }

  // Convert camelCase model to snake_case for API
  toApiFormat() {
    return {
      nom_client: this.nomClient,
      numero_fiscal: this.numeroFiscal,
      adresse: this.adresse,
      telephone: this.telephone,
      nom_responsable: this.nomResponsable,
      email: this.email,
      email_responsable: this.emailResponsable,
      telephone_responsable: this.telephoneResponsable,
      autre_numero: this.autreNumero,
      informations_complementaires: this.informationsComplementaires
    };
  }
}
