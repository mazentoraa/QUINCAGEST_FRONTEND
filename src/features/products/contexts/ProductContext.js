import React, { createContext, useState, useEffect, useContext } from "react";
import { message } from "antd";
import ProductService from "../services/ProductService";
import ProductModel from "../models/ProductModel";

// Create the context
export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false); // Start as false until we're ready to fetch
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
      setIsReady(true); // Mark the context as ready to start fetching data
    };

    checkAuth();
  }, []);

  // Function to refresh the product list
  const refreshProducts = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Fetch all products or filtered products by material type
  useEffect(() => {
    // Only fetch if we're ready (authentication check completed)
    if (!isReady) {
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        let data;
        if (selectedMaterial && selectedMaterial !== "all") {
          data = await ProductService.getProductsByMaterialType(
            selectedMaterial
          );
        } else {
          data = await ProductService.getAllProducts();
        }
        // Convert raw data to ProductModel instances to ensure consistent field mapping
        const products = Array.isArray(data)
          ? data.map((item) => new ProductModel(item))
          : [];
        setProducts(products);
        setError(null);
      } catch (err) {
        setError("Erreur lors du chargement des produits");
        if (err.response && err.response.status === 401) {
          message.error("Authentification requise pour accéder aux produits");
        } else {
          message.error("Impossible de charger les produits");
        }
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedMaterial, refreshTrigger, isReady]);

  // Add a new product
  const addProduct = async (productData) => {
    try {
      setLoading(true);

      // If productData is FormData, convert it to a plain object
      let dataToSend = productData;
      if (productData instanceof FormData) {
        dataToSend = {};
        for (let [key, value] of productData.entries()) {
          dataToSend[key] = value;
        }
      }

      // Ensure numeric fields are properly parsed
      if (typeof dataToSend === "object") {
        if (dataToSend.price !== undefined)
          dataToSend.price = parseFloat(dataToSend.price) || 0;
        if (dataToSend.thickness !== undefined)
          dataToSend.thickness = parseFloat(dataToSend.thickness) || 0;
        if (dataToSend.length !== undefined)
          dataToSend.length = parseFloat(dataToSend.length) || 0;
        if (dataToSend.surface !== undefined)
          dataToSend.surface = parseFloat(dataToSend.surface) || 0;
      }

      // Map frontend field names to backend field names
      if (typeof dataToSend === "object") {
        // If we're receiving a product with frontend field names, we need to map them
        if (dataToSend.material && !dataToSend.material_type) {
          dataToSend.material_type = dataToSend.material;
        }
        if (dataToSend.name && !dataToSend.nom_produit) {
          dataToSend.nom_produit = dataToSend.name;
        }
      }

      // Create product model
      const product = new ProductModel(dataToSend);

      const savedProduct = await ProductService.createProduct(product);
      console.log("Product saved successfully:", savedProduct);

      // Explicitly refresh the product list instead of just appending
      refreshProducts();

      message.success("Produit ajouté avec succès");
      return savedProduct;
    } catch (err) {
      message.error("Erreur lors de l'ajout du produit");
      console.error("Error adding product:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing product
  const updateProduct = async (id, productData) => {
    try {
      setLoading(true);

      console.log("=== PRODUCT CONTEXT UPDATE ===");
      console.log("Product ID:", id);
      console.log("Raw productData received:", productData);

      // For updates, send only the changed fields directly without creating a ProductModel
      // This ensures we're doing a true PATCH operation
      let dataToSend = productData;

      // If productData is FormData, convert it to a plain object
      if (productData instanceof FormData) {
        console.log("Converting FormData to object");
        dataToSend = {};
        for (let [key, value] of productData.entries()) {
          dataToSend[key] = value;
        }
        console.log("Converted FormData:", dataToSend);
      }

      // Clean the data to only include backend field names and remove frontend duplicates
      const cleanedData = {};

      // Only include backend field names and necessary fields
      if (dataToSend.nom_produit !== undefined)
        cleanedData.nom_produit = dataToSend.nom_produit;
      if (dataToSend.code_produit !== undefined)
        cleanedData.code_produit = dataToSend.code_produit;      
      if (dataToSend.type_matiere !== undefined)
        cleanedData.type_matiere = dataToSend.type_matiere;
      if (dataToSend.epaisseur !== undefined)
        cleanedData.epaisseur = parseFloat(dataToSend.epaisseur) || 0;
      if (dataToSend.longueur !== undefined)
        cleanedData.longueur = parseFloat(dataToSend.longueur) || 0;
      if (dataToSend.largeur !== undefined)
        cleanedData.largeur = parseFloat(dataToSend.largeur) || 0;
      
      if (dataToSend.surface !== undefined)
        cleanedData.surface = parseFloat(dataToSend.surface) || 0;
      if (dataToSend.prix !== undefined)
        cleanedData.prix = parseFloat(dataToSend.prix) || 0;
      if (dataToSend.description !== undefined)
        cleanedData.description = dataToSend.description;

      // Handle image field carefully - only include if it's a new upload (base64) or null (removal)
      if (dataToSend.hasOwnProperty("image")) {
        const imageValue = dataToSend.image;
        console.log("Processing image field:", imageValue);
        console.log("Image type:", typeof imageValue);

        if (imageValue === null) {
          // Image removal
          cleanedData.image = null;
          console.log("Image removal detected");
        } else if (
          typeof imageValue === "string" &&
          imageValue.startsWith("data:")
        ) {
          // New base64 image upload
          cleanedData.image = imageValue;
          console.log("New base64 image detected");
        } else if (
          typeof imageValue === "string" &&
          imageValue.startsWith("http")
        ) {
          // This is an existing image URL - don't include it in PATCH
          console.log(
            "Existing image URL detected - NOT including in PATCH payload"
          );
          // Don't add image to cleanedData
        } else {
          console.log("Unknown image format:", imageValue);
        }
      }

      dataToSend = cleanedData;

      console.log("Final cleaned data being sent to API:", dataToSend);
      console.log("Has image field:", dataToSend.hasOwnProperty("image"));
      console.log("Image value:", dataToSend.image);
      console.log("Image type:", typeof dataToSend.image);

      // Don't create a ProductModel for updates - send the raw data directly
      const updatedProduct = await ProductService.updateProduct(id, dataToSend);

      // Convert the updated product to ProductModel for consistent state management
      const productModel = new ProductModel(updatedProduct);

      setProducts((prevProducts) =>
        prevProducts.map((p) => (p.id === id ? productModel : p))
      );

      message.success("Produit mis à jour avec succès");
      return updatedProduct;
    } catch (err) {
      console.error("=== UPDATE ERROR ===");
      console.error("Error details:", err);
      console.error("Error response:", err.response?.data);
      message.error("Erreur lors de la mise à jour du produit");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a product
  const deleteProduct = async (id) => {
    try {
      setLoading(true);
      await ProductService.deleteProduct(id);
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== id)
      );
      message.success("Produit supprimé avec succès");
    } catch (err) {
      message.error("Erreur lors de la suppression du produit");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filter products by material type
  const filterByMaterial = (materialType) => {
    setSelectedMaterial(materialType);
  };

  const value = {
    products,
    loading,
    error,
    selectedMaterial,
    isAuthenticated,
    addProduct,
    updateProduct,
    deleteProduct,
    filterByMaterial,
    refreshProducts,
  };

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
};

// Custom hook to use the product context
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};

export default ProductContext;
