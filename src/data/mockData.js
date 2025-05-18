// Données de test pour le développement

// Produits de métallurgie
export const mockProducts = [
    {
      id: '1',
      name: 'Tôle Inox',
      material: 'Inox',
      thickness: 2.5, // épaisseur en mm
      description: 'Tôle en acier inoxydable pour usage général.',
      price: 120.00,
      quantity: 45,
      image: '/images/tole-inox.jpg'
    },
    {
      id: '2',
      name: 'Profilé Aluminium',
      material: 'Aluminium',
      thickness: 3.0,
      description: 'Profilé en aluminium pour construction légère.',
      price: 85.50,
      quantity: 28,
      image: '/images/profile-alu.jpg'
    },
    {
      id: '3',
      name: 'Fer à Béton',
      material: 'Acier',
      thickness: 12.0,
      description: 'Tige en acier pour le renforcement du béton.',
      price: 45.20,
      quantity: 150,
      image: '/images/fer-beton.jpg'
    },
    {
      id: '4',
      name: 'Tôle Galvanisée',
      material: 'Acier Galvanisé',
      thickness: 1.5,
      description: 'Tôle en acier galvanisé résistante à la corrosion.',
      price: 78.30,
      quantity: 32,
      image: '/images/tole-galva.jpg'
    },
    {
      id: '5',
      name: 'Tube Carré',
      material: 'Fer',
      thickness: 4.0,
      description: 'Tube de section carrée pour structures métalliques.',
      price: 62.75,
      quantity: 19,
      image: '/images/tube-carre.jpg'
    },
    {
      id: '6',
      name: 'Cornière',
      material: 'Fer',
      thickness: 3.5,
      description: 'Cornière pour assemblages et renforts.',
      price: 38.50,
      quantity: 65,
      image: '/images/corniere.jpg'
    },
    {
      id: '7',
      name: 'Plaque Cuivre',
      material: 'Cuivre',
      thickness: 1.0,
      description: 'Plaque de cuivre pour applications électriques.',
      price: 210.00,
      quantity: 8,
      image: '/images/plaque-cuivre.jpg'
    },
    {
      id: '8',
      name: 'Grillage Métallique',
      material: 'Acier Galvanisé',
      thickness: 2.0,
      description: 'Grillage pour clôtures et protections.',
      price: 95.20,
      quantity: 23,
      image: '/images/grillage.jpg'
    }
  ];
  
  // Clients
  export const mockClients = [
    {
      id: '1',
      firstName: 'Mohamed',
      lastName: 'Ben Ali',
      email: 'mohamed.benali@example.com',
      phone: '23 456 789',
      address: '15 Avenue Habib Bourguiba, Tunis'
    },
    {
      id: '2',
      firstName: 'Fatma',
      lastName: 'Trabelsi',
      email: 'fatma.trabelsi@example.com',
      phone: '98 765 432',
      address: '7 Rue Ibn Khaldoun, Sousse'
    },
    {
      id: '3',
      firstName: 'Ahmed',
      lastName: 'Karoui',
      phone: '54 321 876',
      address: '23 Avenue Bourguiba, Sfax'
    }
  ];
  
  // Commandes
  export const mockOrders = [
    {
      id: '1',
      clientId: '1',
      date: new Date('2025-04-15').toISOString(),
      items: [
        {
          productId: '1',
          productName: 'Tôle Inox',
          quantity: 5,
          price: 120.00
        },
        {
          productId: '6',
          productName: 'Cornière',
          quantity: 10,
          price: 38.50
        }
      ],
      paymentMethod: 'cash',
      status: 'completed'
    },
    {
      id: '2',
      clientId: '2',
      date: new Date('2025-04-18').toISOString(),
      items: [
        {
          productId: '4',
          productName: 'Tôle Galvanisée',
          quantity: 3,
          price: 78.30
        },
        {
          productId: '5',
          productName: 'Tube Carré',
          quantity: 8,
          price: 62.75
        }
      ],
      paymentMethod: 'installments',
      status: 'completed'
    }
  ];
  
  // Plans de traites
  export const mockInstallments = [
    {
      id: '1',
      orderId: '2',
      clientId: '2',
      totalAmount: 733.90, // 3 * 78.30 + 8 * 62.75
      numberOfInstallments: 3,
      installmentAmount: 244.63, // 733.90 / 3
      createdAt: new Date('2025-04-18').toISOString(),
      installments: [
        {
          id: '1-1',
          number: 1,
          amount: 244.63,
          dueDate: new Date('2025-05-18').toISOString(),
          paid: true
        },
        {
          id: '1-2',
          number: 2,
          amount: 244.63,
          dueDate: new Date('2025-06-18').toISOString(),
          paid: false
        },
        {
          id: '1-3',
          number: 3,
          amount: 244.64,
          dueDate: new Date('2025-07-18').toISOString(),
          paid: false
        }
      ]
    }
  ];