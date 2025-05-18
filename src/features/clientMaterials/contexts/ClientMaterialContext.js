// Mise à jour du contexte existant ou création d'un nouveau contexte

import React, { createContext, useState, useEffect } from 'react';

export const ClientMaterialContext = createContext();

export const ClientMaterialProvider = ({ children }) => {
  // État pour les matières premières client
  const [clientMaterials, setClientMaterials] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [cuttings, setCuttings] = useState([]);
  
  // États pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterClient, setFilterClient] = useState('');
  
  // Matières filtrées en fonction des critères de recherche
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  
  // Effet pour filtrer les matières
  useEffect(() => {
    const filtered = clientMaterials.filter(material => {
      // Filtrer par terme de recherche
      const matchesSearch = 
        material.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.deliveryNote.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtrer par type de matériau
      const matchesMaterial = filterMaterial ? material.material === filterMaterial : true;
      
      // Filtrer par client
      const matchesClient = filterClient ? material.clientId === filterClient : true;
      
      return matchesSearch && matchesMaterial && matchesClient;
    });
    
    setFilteredMaterials(filtered);
  }, [clientMaterials, searchTerm, filterMaterial, filterClient]);
  
  // Gestion de la recherche
  const handleSearch = (term) => {
    setSearchTerm(term);
  };
  
  // Gestion du filtre par matériau
  const handleFilterMaterial = (material) => {
    setFilterMaterial(material);
  };
  
  // Gestion du filtre par client
  const handleFilterClient = (clientId) => {
    setFilterClient(clientId);
  };
  
  // Ajouter une matière première client
  const addClientMaterial = (material) => {
    const newMaterial = {
      ...material,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      remainingQuantity: material.quantity, // Pour suivre l'utilisation
      status: 'received'
    };
    
    setClientMaterials([...clientMaterials, newMaterial]);
    
    // Ajoute également un bon de livraison
    addDeliveryNote({
      id: Date.now().toString() + '-note',
      materialId: newMaterial.id,
      clientId: material.clientId,
      clientName: material.clientName,
      deliveryNoteNumber: material.deliveryNote,
      date: new Date().toISOString(),
      type: 'reception', // Type de bon: réception
      items: [{
        material: material.material,
        thickness: material.thickness,
        length: material.length,
        width: material.width,
        quantity: material.quantity
      }]
    });
  };
  
  // Mettre à jour une matière première client
  const updateClientMaterial = (id, updatedMaterial) => {
    setClientMaterials(
      clientMaterials.map(material => 
        material.id === id ? { ...material, ...updatedMaterial } : material
      )
    );
  };
  
  // Supprimer une matière première client
  const deleteClientMaterial = (id) => {
    // Vérifier si des découpes sont liées
    const hasCuttings = cuttings.some(cutting => cutting.materialId === id);
    
    if (hasCuttings) {
      alert("Impossible de supprimer cette matière car elle a déjà été utilisée pour des découpes.");
      return;
    }
    
    setClientMaterials(clientMaterials.filter(material => material.id !== id));
    
    // Supprimer également les bons de livraison associés
    setDeliveryNotes(deliveryNotes.filter(note => note.materialId !== id));
  };
  
  // Ajouter un bon de livraison
  const addDeliveryNote = (note) => {
    setDeliveryNotes([...deliveryNotes, note]);
  };
  
  // Ajouter une découpe
  const addCutting = (cutting) => {
    // Vérifier s'il reste assez de matière
    const material = clientMaterials.find(m => m.id === cutting.materialId);
    
    if (!material || material.remainingQuantity < cutting.quantity) {
      alert("Quantité insuffisante pour effectuer cette découpe.");
      return false;
    }
    
    // Ajouter la découpe
    const newCutting = {
      ...cutting,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    setCuttings([...cuttings, newCutting]);
    
    // Mettre à jour la quantité restante
    updateClientMaterial(cutting.materialId, {
      remainingQuantity: material.remainingQuantity - cutting.quantity
    });
    
    // Créer un bon de livraison pour la découpe
    addDeliveryNote({
      id: Date.now().toString() + '-cut-note',
      materialId: cutting.materialId,
      clientId: material.clientId,
      clientName: material.clientName,
      deliveryNoteNumber: `BL-C-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'cutting', // Type de bon: découpe
      cuttingId: newCutting.id,
      items: [{
        material: material.material,
        thickness: material.thickness,
        length: cutting.length,
        width: cutting.width,
        quantity: cutting.quantity,
        description: cutting.description
      }]
    });
    
    return true;
  };
  
  // Générer un rapport d'inventaire
  const generateInventoryReport = (clientId, startDate, endDate) => {
    // Filtrer les matériaux du client
    const clientMats = clientMaterials.filter(m => m.clientId === clientId);
    
    // Filtrer les bons de livraison par date et client
    const relevantNotes = deliveryNotes.filter(note => {
      const noteDate = new Date(note.date);
      return note.clientId === clientId && 
             noteDate >= new Date(startDate) && 
             noteDate <= new Date(endDate);
    });
    
    // Filtrer les découpes par date et client
    const relevantCuttings = cuttings.filter(cut => {
      const cutDate = new Date(cut.createdAt);
      const material = clientMaterials.find(m => m.id === cut.materialId);
      return material && 
             material.clientId === clientId && 
             cutDate >= new Date(startDate) && 
             cutDate <= new Date(endDate);
    });
    
    return {
      client: clientId,
      period: { startDate, endDate },
      receivedMaterials: relevantNotes.filter(n => n.type === 'reception'),
      cuttings: relevantCuttings,
      deliveryNotes: relevantNotes.filter(n => n.type === 'cutting'),
      remainingStock: clientMats.map(m => ({
        id: m.id,
        material: m.material,
        thickness: m.thickness,
        initialQuantity: m.quantity,
        remainingQuantity: m.remainingQuantity
      }))
    };
  };
  
  return (
    <ClientMaterialContext.Provider
      value={{
        clientMaterials,
        filteredMaterials,
        deliveryNotes,
        cuttings,
        searchTerm,
        filterMaterial,
        filterClient,
        handleSearch,
        handleFilterMaterial,
        handleFilterClient,
        addClientMaterial,
        updateClientMaterial,
        deleteClientMaterial,
        addDeliveryNote,
        addCutting,
        generateInventoryReport
      }}
    >
      {children}
    </ClientMaterialContext.Provider>
  );
};

export default ClientMaterialProvider;