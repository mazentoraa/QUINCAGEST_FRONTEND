import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE_URL}`;

class BonRetourFournisseurService {
  async getAllBonsRetour(queryParams = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await axios.get(`${API_URL}/bons-retour-fournisseurs/${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bons retour fournisseurs:', error);
      throw error;
    }
  }

  async getBonRetourById(id) {
    try {
      const response = await axios.get(`${API_URL}/bons-retour-fournisseurs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bon retour fournisseur ${id}:`, error);
      throw error;
    }
  }

  async createBonRetour(bonRetourData) {
    try {
      const response = await axios.post(`${API_URL}/bons-retour-fournisseurs/`, bonRetourData);
      return response.data;
    } catch (error) {
      console.error('Error creating bon retour fournisseur:', error);
      throw error;
    }
  }

  async updateBonRetour(id, bonRetourData) {
    try {
      const response = await axios.put(`${API_URL}/bons-retour-fournisseurs/${id}/`, bonRetourData);
      return response.data;
    } catch (error) {
      console.error(`Error updating bon retour fournisseur ${id}:`, error);
      throw error;
    }
  }

  async deleteBonRetour(id) {
    try {
      const response = await axios.delete(`${API_URL}/bons-retour-fournisseurs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting bon retour fournisseur ${id}:`, error);
      throw error;
    }
  }

  async getAvailableMaterials(fournisseurId) {
    try {
      const response = await axios.get(`${API_URL}/fournisseurs/${fournisseurId}/available-materials/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching available materials for fournisseur ${fournisseurId}:`, error);
      throw error;
    }
  }

  async getBonsRetourByFournisseur(fournisseurId) {
    try {
      const response = await axios.get(`${API_URL}/fournisseurs/${fournisseurId}/bons-retour-fournisseurs/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bons retour fournisseurs for fournisseur ${fournisseurId}:`, error);
      throw error;
    }
  }

  async getBonRetourWithMaterialDetails(id) {
    try {
      const bonRetour = await this.getBonRetourById(id);

      if (!bonRetour || !bonRetour.matiere_retours || !Array.isArray(bonRetour.matiere_retours)) {
        console.warn('Bon retour fournisseur has no matiere_retours array:', bonRetour);
        return bonRetour;
      }

      const materialsWithDetails = await Promise.all(
        bonRetour.matiere_retours.map(async (retour) => {
          try {
            if (retour.matiere && (typeof retour.matiere === 'number' || typeof retour.matiere === 'string')) {
              const materialResponse = await axios.get(`${API_URL}/matieres/${retour.matiere}/`);
              return {
                ...retour,
                matiere: materialResponse.data
              };
            }
            return retour;
          } catch (error) {
            console.warn(`Failed to fetch details for material ${retour.matiere}:`, error);
            return retour;
          }
        })
      );

      return {
        ...bonRetour,
        matiere_retours: materialsWithDetails
      };
    } catch (error) {
      console.error(`Error fetching bon retour fournisseur with material details ${id}:`, error);
      throw error;
    }
  }

  async updateBonRetourStatus(id, status) {
    try {
      const response = await axios.patch(`${API_URL}/bons-retour-fournisseurs/${id}/`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating bon retour fournisseur status ${id}:`, error);
      throw error;
    }
  }

  generateBonRetourNumber(getAllBonsRetour = []) {
    const currentYear = new Date().getFullYear();
    const currentYearBonsRetour = getAllBonsRetour.filter(bonRetour =>
      bonRetour.numero_bon?.includes(`-${currentYear}-`)
    );
    let maxSequence = 0;

    currentYearBonsRetour.forEach(order => {
      const parts = order.numero_bon.split('-');
      const sequencePart = parts[parts.length - 1];
      const sequenceNumber = parseInt(sequencePart, 10) || 0;

      if (sequenceNumber > maxSequence) {
        maxSequence = sequenceNumber;
      }
    });

    const newSequence = String(maxSequence + 1).padStart(5, '0');
    return `BRF-${currentYear}-${newSequence}`; // Ajout du F pour distinguer les fournisseurs
  }
}

export default new BonRetourFournisseurService();
