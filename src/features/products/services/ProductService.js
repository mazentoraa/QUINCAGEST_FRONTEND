import axios from 'axios';
import ProductModel from '../models/ProductModel';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

class ProductService {
  static async getAllProducts() {
    try {
      const response = await axios.get(API_BASE_URL + '/produits/');
      const productData = response.data.results || response.data;
      return productData.map(product => new ProductModel(product));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async getAllProductsPaginated() {
    try {
      let allProducts = [];
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await axios.get(API_BASE_URL + `/produits/?page=${page}`);
        const data = response.data;
        const productsPage = data.results || data;
        allProducts = allProducts.concat(productsPage.map(product => new ProductModel(product)));

        if (data.total_pages) {
          totalPages = data.total_pages;
        } else if (data.count && data.results) {
          totalPages = Math.ceil(data.count / data.results.length);
        } else {
          totalPages = 1;
        }

        page++;
      }

      return allProducts;
    } catch (error) {
      console.error('Error fetching all paginated products:', error);
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
      const response = await axios.get(`${API_BASE_URL}/produits/by_material_type/?type_matiere=${materialType}`);
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
      const response = await axios.patch(`${API_BASE_URL}/produits/${id}/`, product);
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

  // ✅ Corbeille - nouveaux services :
  static async getDeletedProducts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/produits/trash/`);
      const productData = response.data.results || response.data;
      return productData.map(product => new ProductModel(product));
    } catch (error) {
      console.error("Erreur récupération corbeille :", error);
      throw error;
    }
  }

  static async restoreProduct(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/produits/${id}/restore/`);
      return new ProductModel(response.data.product);
    } catch (error) {
      console.error(`Erreur restauration produit ${id}:`, error);
      throw error;
    }
  }

  static async permanentDeleteProduct(id) {
    try {
      await axios.delete(`${API_BASE_URL}/produits/${id}/permanent_delete/`);
      return true;
    } catch (error) {
      console.error(`Erreur suppression définitive produit ${id}:`, error);
      throw error;
    }
  }

  static async emptyTrash() {
    try {
      await axios.delete(`${API_BASE_URL}/produits/empty_trash/`);
      return true;
    } catch (error) {
      console.error("Erreur vidage corbeille :", error);
      throw error;
    }
  }
}

export default ProductService;
