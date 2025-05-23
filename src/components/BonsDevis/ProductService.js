import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
class ProductService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/produits`;
  }

  // Fetch all products
  async getProducts() {
    try {
      const response = await axios.get(this.baseUrl);
      console.log("Product API response:", response.data);
      return response.data; // This should contain the results array
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  // Get a single product by ID
  async getProductById(id) {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      throw error;
    }
  }

  // Create a new product
  async createProduct(productData) {
    try {
      const response = await axios.post(this.baseUrl, productData);
      return response.data;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  // Update an existing product
  async updateProduct(id, productData) {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product with id ${id}:`, error);
      throw error;
    }
  }

  // Delete a product
  async deleteProduct(id) {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product with id ${id}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const productService = new ProductService();

// Export the instance directly (not as default)
export default productService;
