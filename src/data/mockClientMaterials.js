// src/data/mockClientMaterials.js
export const mockClientMaterials = [
    {
      id: '1',
      clientName: 'Entreprise A',
      materialType: 'Cuir',
      quantity: 50,
      receivedDate: '2025-05-01',
      status: 'En stock',
      description: 'Cuir noir premium, épaisseur 2mm',
      batchNumber: 'BA-2025-001'
    },
    {
      id: '2',
      clientName: 'Entreprise B',
      materialType: 'Tissu',
      quantity: 100,
      receivedDate: '2025-05-05',
      status: 'En stock',
      description: 'Tissu jean stretch, bleu marine',
      batchNumber: 'BB-2025-012'
    },
    {
      id: '3',
      clientName: 'Entreprise C',
      materialType: 'Synthétique',
      quantity: 75,
      receivedDate: '2025-05-10',
      status: 'En cours de découpe',
      description: 'Similicuir blanc, résistant à leau',
      batchNumber: 'BC-2025-003'
    }
  ];
  
  // Données pour les bons de livraison
  export const mockDeliveryNotes = [
    {
      id: 'dl-001',
      clientId: '1',
      clientName: 'Entreprise A',
      deliveryDate: '2025-05-12',
      items: [
        { materialId: '1', quantity: 10, description: 'Découpe de cuir noir' }
      ],
      status: 'Préparé'
    },
    {
      id: 'dl-002',
      clientId: '2',
      clientName: 'Entreprise B',
      deliveryDate: '2025-05-15',
      items: [
        { materialId: '2', quantity: 25, description: 'Découpe de tissu jean' }
      ],
      status: 'Livré'
    }
  ];