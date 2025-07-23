const API_BASE_URL = 'http://localhost:8000/api';

const AvoirService = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/avoirs/?${params}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des avoirs');
    }
    return response.json();
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/avoirs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la création de l\'avoir');
    }
    return response.json();
  },

  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/avoirs/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour de l\'avoir');
    }
    return response.json();
  },

  // Suppression soft (déplacer vers corbeille)
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/avoirs/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de l\'avoir');
    }
    return response.json();
  },

  // NOUVELLES FONCTIONS POUR LA CORBEILLE

  // Récupérer les avoirs dans la corbeille
  async getCorbeille(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/avoirs/corbeille/?${params}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la corbeille');
    }
    return response.json();
  },

  // Restaurer un avoir de la corbeille
  async restaurer(id) {
    const response = await fetch(`${API_BASE_URL}/avoirs/${id}/restaurer/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la restauration de l\'avoir');
    }
    return response.json();
  },

  // Suppression définitive d'un avoir
  async supprimerDefinitivement(id) {
    const response = await fetch(`${API_BASE_URL}/avoirs/${id}/supprimer_definitivement/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression définitive');
    }
    return response.json();
  },

  // Vider complètement la corbeille
  async viderCorbeille() {
    const response = await fetch(`${API_BASE_URL}/avoirs/vider_corbeille/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Erreur lors du vidage de la corbeille');
    }
    return response.json();
  },

  async getStatistiques() {
    const response = await fetch(`${API_BASE_URL}/avoirs/statistiques/`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }
    return response.json();
  }
};

export default AvoirService;