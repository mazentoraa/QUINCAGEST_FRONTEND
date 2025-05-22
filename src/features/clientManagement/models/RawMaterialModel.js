/**
 * Raw Material model structure
 * 
 * @typedef {Object} RawMaterial
 * @property {string} id - Unique identifier for the material
 * @property {string} type_matiere - Material name
 * @property {string} description - Additional description or observations
 * @property {number} prix - Price of the material
 * @property {string} client_id - ID of the client who owns the material
 * @property {string} date_creation - Date when the material was created
 * @property {string} derniere_mise_a_jour - Date when the material was last updated
 * 
 * @property {string} numero_bon - Delivery note number (client-side only)
 * @property {string} reception_date - Date when the material was received (client-side only)
 * @property {string} material_type - Type of material (client-side only)
 * @property {number} thickness - Material thickness in mm (client-side only)
 * @property {number} length - Material length in mm (client-side only)
 * @property {number} width - Material width in mm (client-side only)
 * @property {number} quantite - Number of items (client-side only)
 * @property {string} remaining_quantity - Supplier information (client-side only)
 */

export default class RawMaterialModel {
  constructor(data = {}) {
    this.id = data.id || '';
    // Fields mapped to Django serializer
    this.type_matiere = data.type_matiere || data.material_type || ''; // Using material_type as type_matiere if available
    this.description = data.description || '';
    this.prix = data.prix || 0;
    this.client_id = data.client_id ? parseInt(data.client_id, 10) : null;  // Ensure client_id is an integer
    this.date_creation = data.date_creation || '';
    this.derniere_mise_a_jour = data.derniere_mise_a_jour || '';
    
    // Client-side only fields (not sent to Django)
    this.numero_bon = data.numero_bon || '';
    this.reception_date = data.reception_date || '';
    this.material_type = data.material_type || '';
    this.thickness = data.thickness || 0;
    this.length = data.length || 0;
    this.width = data.width || 0;
    this.quantite = data.quantite !== undefined ? parseInt(data.quantite, 10) : 0;
    this.remaining_quantity = data.remaining_quantity !== undefined ? parseInt(data.remaining_quantity, 10) : 0;
  }

  static create_empty() {
    return new RawMaterialModel();
  }

  // Convert model to api format
  to_api_format() {
    return {
      type_matiere: this.type_matiere,
      description: this.description,
      prix: this.prix,
      // Ensure client_id is sent as a valid integer
      client_id: this.client_id ? parseInt(this.client_id, 10) : null,
      // Add these fields to the API format to ensure they're sent to the server
      numero_bon: this.numero_bon,
      reception_date: this.reception_date,
      thickness: this.thickness,
      length: this.length,
      width: this.width,
      quantite: parseInt(this.quantite, 10), // Ensure quantite is sent as an integer
      remaining_quantity: parseInt(this.remaining_quantity, 10), // Ensure remaining_quantity is sent as an integer
      // Note: date_creation and derniere_mise_a_jour are read-only fields
    };
  }
}
