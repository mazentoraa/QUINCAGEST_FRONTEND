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
    this.nomClient = data.nomClient || '';
    this.numeroFiscal = data.numeroFiscal || '';
    this.adresse = data.adresse || '';
    this.telephone = data.telephone || '';
    this.nomResponsable = data.nomResponsable || '';
    this.email = data.email || '';
    this.emailResponsable = data.emailResponsable || '';
    this.telephoneResponsable = data.telephoneResponsable || '';
    this.autreNumero = data.autreNumero || '';
    this.informationsComplementaires = data.informationsComplementaires || '';
    this.dateCreation = data.dateCreation || new Date();
    this.derniereMiseAJour = data.derniereMiseAJour || new Date();
  }

  static createEmpty() {
    return new ClientModel();
  }
}
