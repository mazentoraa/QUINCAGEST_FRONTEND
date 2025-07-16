import axios from "axios";

// Assure-toi que REACT_APP_API_BASE_URL est bien défini dans ton .env
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const EmployeeService = {
  // ----- Employés -----
  getAll: () => axios.get(`${API_BASE_URL}/employes/`),

  getById: (id) => axios.get(`${API_BASE_URL}/employes/${id}/`),

  create: (data) =>
    axios.post(`${API_BASE_URL}/employes/`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  update: (id, data) =>
    axios.put(`${API_BASE_URL}/employes/${id}/`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  delete: (id) => axios.delete(`${API_BASE_URL}/employes/${id}/`),

  // ----- Fiches de paie -----

  getFichesPaieByEmploye: (employeId) => {
    // Ajout de logs pour déboguer
    console.log('Récupération des fiches pour l\'employé:', employeId);
    return axios.get(`${API_BASE_URL}/fiches-paie/?employe=${employeId}`)
      .then(response => {
        console.log('Réponse API fiches:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Erreur API fiches:', error);
        throw error;
      });
  },
  getFichePaieById: (id) => axios.get(`${API_BASE_URL}/fiches-paie/${id}/`),

  createFichePaie: (data) => {
    // Validation des données avant envoi
    if (!data.employe) {
      throw new Error('L\'ID de l\'employé est requis');
    }
    
    console.log('Création de fiche pour l\'employé:', data.employe);
    return axios.post(`${API_BASE_URL}/fiches-paie/`, data, {
      headers: { "Content-Type": "application/json" },
    }).then(response => {
      console.log('Fiche créée avec succès:', response.data);
      return response;
    }).catch(error => {
      console.error('Erreur lors de la création de la fiche:', error);
      throw error;
    });
  },
getAllFichesPaie: () => {
  return axios.get(`${API_BASE_URL}/fiches-paie/`);
},
  updateFichePaie: (id, data) =>
    axios.put(`${API_BASE_URL}/fiches-paie/${id}/`, data, {
      headers: { "Content-Type": "application/json" },
    }),

deleteFichePaie(id) {
  console.log('=== SERVICE DELETE FICHE PAIE ===');
  console.log('ID reçu:', id);
  console.log('Type ID:', typeof id);
  
  // Validation de l'ID
  if (!id || id === 'undefined' || id === 'null') {
    console.error('ID invalide détecté:', id);
    throw new Error('ID de fiche invalide');
  }
  
  // Conversion en nombre si nécessaire
  const ficheId = parseInt(id);
  console.log('ID converti:', ficheId);
  
  if (isNaN(ficheId)) {
    console.error('ID ne peut pas être converti en nombre:', id);
    throw new Error('ID de fiche doit être un nombre');
  }
  
  const url = `${API_BASE_URL}/fiches-paie/${ficheId}/`;
  console.log('URL complète:', url);
  console.log('API_BASE_URL:', API_BASE_URL);
  
  // Configuration de la requête
  const config = {
    headers: {
      'Content-Type': 'application/json',
      // Ajoutez vos headers d'authentification si nécessaire
      // 'Authorization': `Bearer ${token}`
    },
    timeout: 10000 // 10 secondes de timeout
  };
  
  console.log('Configuration requête:', config);
  console.log('Axios disponible:', !!axios);
  
  console.log('Envoi de la requête DELETE...');
  
  return axios.delete(url, config)
    .then(response => {
      console.log('Réponse axios reçue:', response);
      return response;
    })
    .catch(error => {
      console.error('Erreur axios interceptée:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error message:', error.message);
      throw error;
    });
}



};

export default EmployeeService;
