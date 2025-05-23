import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
const API_URL = `${API_BASE_URL}/produits`;

const ProductService = {
  getAllProducts: async () => {
    try {
      const response = await axios.get(API_URL + '/');

      // Handle both array and paginated response formats
      let productsData;
      if (response.data && response.data.results !== undefined) {
        productsData = response.data.results;
      } else {
        productsData = response.data || [];
      }
      
      return productsData;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getProductById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      throw error;
    }
  },

  searchProducts: async (query) => {
    try {
      const response = await axios.get(`${API_URL}/search/`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
};

export default ProductService;
