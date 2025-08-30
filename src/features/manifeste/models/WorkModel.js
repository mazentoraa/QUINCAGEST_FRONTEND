// A supprimer
// /**
//  * Work model structure
//  * 
//  * @typedef {Object} Work
//  * @property {string} id - Unique identifier for the work
//  * @property {string} client_id - ID of the client for whom the work is done
//  * @property {string} produit_id - ID of the product used in the work
//  * @property {string} code_produit - ID of the product used in the work
//  * @property {number} duree - Duration of the work in hours
//  * @property {number} quantite - Quantity of the product used
//  * @property {string} description - Additional description or observations
//  * @property {string} date_creation - Date when the work was created
//  * @property {string} derniere_mise_a_jour - Date when the work was last updated
//  * @property {Array} matiere_usages - Materials used in this work
//  * 
//  * // Additional fields for UI purposes
//  * @property {Object} client - Client object (populated on frontend)
//  * @property {Object} produit - Product object (populated on frontend)
//  */

// export default class WorkModel {
//   constructor(data = {}) {
//     this.id = data.id || '';
//     this.client_id = data.client_id || '';
//     this.produit_id = data.produit_id || '';
//     this.duree = data.duree || 0;
//     this.quantite = data.quantite || 1;
//     this.description = data.description || '';
//     this.date_creation = data.date_creation || '';
//     this.derniere_mise_a_jour = data.derniere_mise_a_jour || '';
//     this.matiere_usages = data.matiere_usages || [];
//     this.remise = data.remise ?? 0;
//     this.ref_produit = data.produit?.ref_produit || "";
//     this.client_name = data.client_name || '';
//     this.produit_name = data.produit_name || '';

//     // For backward compatibility
//     this.client = data.client || { nom_client: data.client_name };
//     this.produit = data.produit || { nom_produit: data.produit_name };
//   }

//   static createEmpty() {
//     return new WorkModel();
//   }

//   // Convert model to API format with material usage data
//   toApiFormat() {
//     return {
//       client_id: this.client_id,
//       produit_id: this.produit_id,
//       duree: this.duree,
//       quantite: this.quantite,
//       description: this.description,
//       matiere_usages: this.matiere_usages,
//       remise: this.remise,
//     };
//   }
// }