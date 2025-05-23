import axios from 'axios';
import ProductModel from '../models/ProductModel';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";



class ProductService {
  static async getAllProducts() {
    try {
      const response = await axios.get(API_BASE_URL + '/produits/');
      // Handle paginated response or direct response
      const productData = response.data.results || response.data;
      return productData.map(product => new ProductModel(product));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async getProductById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/produits/${id}/`);
      return new ProductModel(response.data);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  static async getProductsByMaterialType(materialType) {
    try {
      const response = await axios.get(`${API_BASE_URL}/produits/?material_type=${materialType}`);
      // Handle paginated response or direct response
      const productData = response.data.results || response.data;
      return productData.map(product => new ProductModel(product));
    } catch (error) {
      console.error(`Error fetching products by material type ${materialType}:`, error);
      throw error;
    }
  }

  static async createProduct(product) {
    try {
      const response = await axios.post(`${API_BASE_URL}/produits/`, product);
      return new ProductModel(response.data);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async updateProduct(id, product) {
    try {
      const response = await axios.put(`${API_BASE_URL}/produits/${id}/`, product);
      return new ProductModel(response.data);
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  static async deleteProduct(id) {
    try {
      await axios.delete(`${API_BASE_URL}/produits/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }
}

export default ProductService;
