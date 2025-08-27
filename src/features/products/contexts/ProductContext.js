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
        if (dataToSend.stock_initial !== undefined)
          dataToSend.stock_initial = parseInt(dataToSend.stock_initial) || 0;

        if (dataToSend.seuil_alerte !== undefined)
          dataToSend.seuil_alerte = parseInt(dataToSend.seuil_alerte) || 0;

        if (dataToSend.prix_achat !== undefined)
          dataToSend.prix_achat = parseFloat(dataToSend.prix_achat) || 0;

        if (dataToSend.prix_vente !== undefined)
          dataToSend.prix_vente = parseFloat(dataToSend.prix_vente) || 0;
      }

      // Map frontend field names to backend field names
      if (typeof dataToSend === "object") {
        if (dataToSend.name && !dataToSend.nom_produit) {
          dataToSend.nom_produit = dataToSend.name;
        }
        if (dataToSend.ref && !dataToSend.ref_produit) {
          dataToSend.ref_produit = dataToSend.ref;
        }
        if (dataToSend.material && !dataToSend.materiau) {
          dataToSend.materiau = dataToSend.material;
        }
        if (dataToSend.supplier && !dataToSend.fournisseur) {
          dataToSend.fournisseur = dataToSend.supplier;
        }
        if (dataToSend.category && !dataToSend.categorie) {
          dataToSend.categorie = dataToSend.category;
        }
        if (dataToSend.subcategory && !dataToSend.sous_categorie) {
          dataToSend.sous_categorie = dataToSend.subcategory;
        }
        if (dataToSend.unit && !dataToSend.unite_mesure) {
          dataToSend.unite_mesure = dataToSend.unit;
        }
        if (dataToSend.status && !dataToSend.statut) {
          dataToSend.statut = dataToSend.status;
        }
        if (dataToSend.barcode && !dataToSend.code_barres) {
          dataToSend.code_barres = dataToSend.barcode;
        }
        if (dataToSend.location && !dataToSend.emplacement) {
          dataToSend.emplacement = dataToSend.location;
        }
        if (dataToSend.description && !dataToSend.description) {
          dataToSend.description = dataToSend.description;
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

      // Clean the data to only include backend field names
      const cleanedData = {};

      if (dataToSend.nom_produit !== undefined)
        cleanedData.nom_produit = dataToSend.nom_produit;
      if (dataToSend.ref_produit !== undefined)
        cleanedData.ref_produit = dataToSend.ref_produit;
      if (dataToSend.categorie !== undefined)
        cleanedData.categorie = dataToSend.categorie;
      if (dataToSend.sous_categorie !== undefined)
        cleanedData.sous_categorie = dataToSend.sous_categorie;
      if (dataToSend.materiau !== undefined)
        cleanedData.materiau = dataToSend.materiau;
      if (dataToSend.fournisseur !== undefined)
        cleanedData.fournisseur = dataToSend.fournisseur;

      if (dataToSend.stock_initial !== undefined)
        cleanedData.stock_initial = parseInt(dataToSend.stock_initial) || 0;
      if (dataToSend.seuil_alerte !== undefined)
        cleanedData.seuil_alerte = parseInt(dataToSend.seuil_alerte) || 0;

      if (dataToSend.unite_mesure !== undefined)
        cleanedData.unite_mesure = dataToSend.unite_mesure;
      if (dataToSend.statut !== undefined)
        cleanedData.statut = dataToSend.statut;
      if (dataToSend.code_barres !== undefined)
        cleanedData.code_barres = dataToSend.code_barres;
      if (dataToSend.emplacement !== undefined)
        cleanedData.emplacement = dataToSend.emplacement;

      if (dataToSend.prix_achat !== undefined)
        cleanedData.prix_achat = parseFloat(dataToSend.prix_achat) || 0;
      if (dataToSend.prix_vente !== undefined)
        cleanedData.prix_vente = parseFloat(dataToSend.prix_vente) || 0;

      if (dataToSend.description !== undefined)
        cleanedData.description = dataToSend.description;

      // Handle image carefully
      if (dataToSend.hasOwnProperty("image")) {
        const imageValue = dataToSend.image;
        console.log("Processing image field:", imageValue);

        if (imageValue === null) {
          cleanedData.image = null; // removal
        } else if (
          typeof imageValue === "string" &&
          imageValue.startsWith("data:")
        ) {
          cleanedData.image = imageValue; // new base64 upload
        } else if (
          typeof imageValue === "string" &&
          imageValue.startsWith("http")
        ) {
          console.log("Existing image URL detected - skipping");
        } else {
          console.log("Unknown image format:", imageValue);
        }
      }

      dataToSend = cleanedData;

      console.log("Final cleaned data being sent to API:", dataToSend);

      // Perform PATCH request
      const updatedProduct = await ProductService.updateProduct(id, dataToSend);

      // Keep frontend state consistent
      const productModel = new ProductModel(updatedProduct);
      setProducts((prevProducts) =>
        prevProducts.map((p) => (p.id === id ? productModel : p))
      );

      message.success("Produit mis à jour avec succès");
      return updatedProduct;
    } catch (err) {
      console.error("=== UPDATE ERROR ===", err);
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
