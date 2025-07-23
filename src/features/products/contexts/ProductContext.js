import React, { createContext, useState, useEffect, useContext } from "react";
import { message } from "antd";
import ProductService from "../services/ProductService";
import ProductModel from "../models/ProductModel";

// Create the context
export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
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
      setIsReady(true);
    };

    checkAuth();
  }, []);

  // Function to refresh the product list
  const refreshProducts = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Fetch all products or filtered products by material type
  useEffect(() => {
    if (!isReady) {
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        let data;
        if (selectedMaterial && selectedMaterial !== "all") {
          data = await ProductService.getProductsByMaterialType(selectedMaterial);
        } else {
          data = await ProductService.getAllProducts();
        }
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

      let dataToSend = productData;
      if (productData instanceof FormData) {
        dataToSend = {};
        for (let [key, value] of productData.entries()) {
          dataToSend[key] = value;
        }
      }

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

      if (typeof dataToSend === "object") {
        if (dataToSend.material && !dataToSend.material_type) {
          dataToSend.material_type = dataToSend.material;
        }
        if (dataToSend.name && !dataToSend.nom_produit) {
          dataToSend.nom_produit = dataToSend.name;
        }
      }

      const product = new ProductModel(dataToSend);
      const savedProduct = await ProductService.createProduct(product);
      console.log("Product saved successfully:", savedProduct);

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

      if (productData instanceof FormData) {
        console.log("Converting FormData to object");
        dataToSend = {};
        for (let [key, value] of productData.entries()) {
          dataToSend[key] = value;
        }
        console.log("Converted FormData:", dataToSend);
      }

      const cleanedData = {};

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

      if (dataToSend.hasOwnProperty("image")) {
        const imageValue = dataToSend.image;
        console.log("Processing image field:", imageValue);
        console.log("Image type:", typeof imageValue);

        if (imageValue === null) {
          cleanedData.image = null;
          console.log("Image removal detected");
        } else if (
          typeof imageValue === "string" &&
          imageValue.startsWith("data:")
        ) {
          cleanedData.image = imageValue;
          console.log("New base64 image detected");
        } else if (
          typeof imageValue === "string" &&
          imageValue.startsWith("http")
        ) {
          console.log("Existing image URL detected - NOT including in PATCH payload");
        } else {
          console.log("Unknown image format:", imageValue);
        }
      }

      dataToSend = cleanedData;

      console.log("Final cleaned data being sent to API:", dataToSend);
      console.log("Has image field:", dataToSend.hasOwnProperty("image"));
      console.log("Image value:", dataToSend.image);
      console.log("Image type:", typeof dataToSend.image);

      const updatedProduct = await ProductService.updateProduct(id, dataToSend);
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

  // Delete a product (suppression logique)
  const deleteProduct = async (id) => {
    try {
      setLoading(true);
      await ProductService.deleteProduct(id);
      // Retirer le produit de la liste locale car il est maintenant supprimé logiquement
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== id)
      );
      message.success("Produit déplacé vers la corbeille");
    } catch (err) {
      message.error("Erreur lors de la suppression du produit");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les produits supprimés
  const fetchTrashedProducts = async () => {
    try {
      const response = await fetch('/api/produits/trash/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la corbeille');
      }

      const data = await response.json();
      return data.map(item => new ProductModel(item));
    } catch (error) {
      console.error('Erreur lors du chargement de la corbeille:', error);
      throw error;
    }
  };

  // Fonction pour restaurer un produit
  const restoreProduct = async (productId) => {
    try {
      const response = await fetch(`/api/produits/${productId}/restore/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la restauration');
      }

      const data = await response.json();
      
      // Recharger la liste des produits pour inclure le produit restauré
      refreshProducts();
      
      message.success("Produit restauré avec succès");
      return data;
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      message.error("Erreur lors de la restauration du produit");
      throw error;
    }
  };

  // Fonction pour supprimer définitivement un produit
  const permanentDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`/api/produits/${productId}/permanent_delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression définitive');
      }

      message.success("Produit supprimé définitivement");
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression définitive:', error);
      message.error("Erreur lors de la suppression définitive");
      throw error;
    }
  };

  // Fonction pour vider la corbeille
  const emptyTrash = async () => {
    try {
      const response = await fetch('/api/produits/empty_trash/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du vidage de la corbeille');
      }

      const data = await response.json();
      message.success("Corbeille vidée avec succès");
      return data;
    } catch (error) {
      console.error('Erreur lors du vidage de la corbeille:', error);
      message.error("Erreur lors du vidage de la corbeille");
      throw error;
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
    // Nouvelles fonctions pour la corbeille
    fetchTrashedProducts,
    restoreProduct,
    permanentDeleteProduct,
    emptyTrash,
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