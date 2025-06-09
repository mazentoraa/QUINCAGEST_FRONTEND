import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const API_URL = `${API_BASE_URL}`;


class BonRetourService {
  /**
   * Get all bons retour with optional filters
   */
  async getAllBonsRetour(queryParams = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      // Ensure base URL ends with a slash
      const response = await axios.get(`${API_URL}/bons-retour/${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bons retour:', error);
      throw error;
    }
  }

  /**
   * Get specific bon retour by ID
   */
  async getBonRetourById(id) {
    try {
      const response = await axios.get(`${API_URL}/bons-retour/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bon retour ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new bon retour
   */
  async createBonRetour(bonRetourData) {
    try {
      const response = await axios.post(`${API_URL}/bons-retour/`, bonRetourData);
      return response.data;
    } catch (error) {
      console.error('Error creating bon retour:', error);
      // Log more details for 405 or 401 errors
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      throw error;
    }
  }

  /**
   * Update bon retour
   */
  async updateBonRetour(id, bonRetourData) {
    try {
      const response = await axios.put(`${API_URL}/bons-retour/${id}/`, bonRetourData);
      return response.data;
    } catch (error) {
      console.error(`Error updating bon retour ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete bon retour
   */
  async deleteBonRetour(id) {
    try {
      const response = await axios.delete(`${API_URL}/bons-retour/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting bon retour ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get available materials for client
   */
  async getAvailableMaterials(clientId) {
    try {
      const response = await axios.get(`${API_URL}/clients/${clientId}/available-materials/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching available materials for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get bons retour by client
   */
  async getBonsRetourByClient(clientId) {
    try {
      const response = await axios.get(`${API_URL}/clients/${clientId}/bons-retour/`,);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bons retour for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get bon retour with detailed material information
   */
  async getBonRetourWithMaterialDetails(id) {
    try {
      // First get the basic bon retour data
      const bonRetour = await this.getBonRetourById(id);
      
      if (!bonRetour || !bonRetour.matiere_retours || !Array.isArray(bonRetour.matiere_retours)) {
        console.warn('Bon retour has no matiere_retours array:', bonRetour);
        return bonRetour;
      }
      
      // Try to get detailed information for each material
      const materialsWithDetails = await Promise.all(
        bonRetour.matiere_retours.map(async (retour) => {
          try {
            // If retour.matiere is just an ID, fetch the complete material details
            if (retour.matiere && (typeof retour.matiere === 'number' || typeof retour.matiere === 'string')) {
              // Fetch material details - adjust endpoint as needed
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
      console.error(`Error fetching bon retour with material details ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update bon retour status
   */
  async updateBonRetourStatus(id, status) {
    try {
      const response = await axios.patch(`${API_URL}/bons-retour/${id}/`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating bon retour status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Generate bon retour number
   */
  generateBonRetourNumber(getAllBonsRetour =[]) {
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

       
        const randomOrderNumber = `BR-${new Date().getFullYear()}-${newSequence}`;
          return randomOrderNumber;
  }
}

export default new BonRetourService();
