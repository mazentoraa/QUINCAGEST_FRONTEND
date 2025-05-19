/**
 * Raw Material model structure
 * 
 * @typedef {Object} RawMaterial
 * @property {string} id - Unique identifier for the material
 * @property {string} type_matiere - Material name
 * @property {string} description - Additional description or observations
 * @property {number} prix - Price of the material
 * @property {string} clientId - ID of the client who owns the material
 * @property {string} dateCreation - Date when the material was created
 * @property {string} derniereMiseAJour - Date when the material was last updated
 * 
 * @property {string} deliveryNote - Delivery note number (client-side only)
 * @property {string} receptionDate - Date when the material was received (client-side only)
 * @property {string} materialType - Type of material (client-side only)
 * @property {number} thickness - Material thickness in mm (client-side only)
 * @property {number} length - Material length in mm (client-side only)
 * @property {number} width - Material width in mm (client-side only)
 * @property {number} quantity - Number of items (client-side only)
 */

export default class RawMaterialModel {
  constructor(data = {}) {
    this.id = data.id || '';
    // Fields mapped to Django serializer
    this.type_matiere = data.type_matiere || data.materialType || ''; // Using materialType as type_matiere if available
    this.description = data.description || '';
    this.prix = data.prix || 0;
    this.clientId = data.client_id || data.clientId || '';
    this.dateCreation = data.date_creation || data.dateCreation || '';
    this.derniereMiseAJour = data.derniere_mise_a_jour || data.derniereMiseAJour || '';
    
    // Client-side only fields (not sent to Django)
    this.deliveryNote = data.delivery_note || data.deliveryNote || '';
    this.receptionDate = data.reception_date || data.receptionDate || '';
    this.materialType = data.material_type || data.materialType || '';
    this.thickness = data.thickness || 0;
    this.length = data.length || 0;
    this.width = data.width || 0;
    this.quantity = data.quantity || 0;
  }

  static createEmpty() {
    return new RawMaterialModel();
  }

  // Convert camelCase model to snake_case for API
  toApiFormat() {
    return {
      type_matiere: this.type_matiere,
      description: this.description,
      prix: this.prix,
      client_id: this.clientId
      // Note: date_creation and derniere_mise_a_jour are read-only fields
    };
  }
}
