import axios from 'axios';
import WorkModel from '../models/WorkModel';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const API_URL = `${API_BASE_URL}/traveaux`;

const WorkService = {
   getAllWorks: async () => {
    try {
    let worksData = [];
    let currentPage = 1;
    let hasMore = true;
    while (hasMore) {
      const response = await axios.get(API_URL + '/',{
         params : {
          page: currentPage
        }
    });
      console.log(`Page ${currentPage} response:`, {
        data: response.data,
        headers: response.headers
      });

      // Handle both array and paginated response formats
      
      if (response.data?.results) {
        worksData = [...worksData, ...response.data.results];
      } else {
        worksData = [...worksData, ...(response.data || [])];
      }
      hasMore = response.data.next !== null;
      currentPage++;
    
    }
      return worksData.map(work => new WorkModel(work));
    } catch (error) {
      console.error('Error fetching works:', error);
      throw error;
    }
  },


  getWorksByClientId: async (client_id) => {
    try {
      const response = await axios.get(`${API_URL}/by_client/`, {
        params: { client_id }
      });
      
      // Handle both array and paginated response formats
      let worksData;
      if (response.data && response.data.results !== undefined) {
        worksData = response.data.results;
      } else {
        worksData = response.data || [];
      }
      
      return worksData.map(work => new WorkModel(work));
    } catch (error) {
      console.error(`Error fetching works for client ${client_id}:`, error);
      throw error;
    }
  },

  getWorkById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return new WorkModel(response.data);
    } catch (error) {
      console.error(`Error fetching work with id ${id}:`, error);
      throw error;
    }
  },

  createWork: async (workData) => {
    try {
      // Format material usage data
      if (workData.materialsUsed && workData.materialsUsed.length > 0) {
        workData.matiere_usages = workData.materialsUsed
  .filter(m => m.quantite && m.quantite > 0)
  .map(material => ({
    matiere_id: material.materialId,
    quantite_utilisee: material.quantite,
  }));

        delete workData.materialsUsed;
      }
  
      // Remove undefined fields (very important for 400 errors)
      Object.keys(workData).forEach((key) => {
        if (workData[key] === undefined) {
          delete workData[key];
        }
      });
  
      const response = await axios.post(API_URL + '/', workData);
      return new WorkModel(response.data);
    } catch (error) {
      if (error.response) {
        console.error("🔥 Backend responded with error data:", error.response.data);
      } else {
        console.error("❌ Error creating work:", error.message);
      }
      throw error;
    }
    
  },
  

  updateWork: async (id, workData) => {
    try {
      // Format material usage data if present
      console.log(workData)
      if (workData.matiere_usages && workData.matiere_usages.length > 0) {
        workData.matiere_usages = workData.matiere_usages.map(material => ({
          matiere_id: material.matiere_id,
          quantite_utilisee: material.quantite_utilisee,
          source: material.source
        }));
        // delete workData.matiere_usages;
      }
      
      // Data is already in snake_case format
      console.log(workData)
      const response = await axios.put(`${API_URL}/${id}/`, workData);
      return new WorkModel(response.data);
    } catch (error) {
      console.error(`Error updating work with id ${id}:`, error);
      throw error;
    }
  },

  deleteWork: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting work with id ${id}:`, error);
      throw error;
    }
  }
};

export default WorkService;
