/**
 * API Service Factory
 *
 * This module provides a way to switch between real API services and mock API services.
 *
 * Usage:
 *
 * import { getApiService } from './apiServiceFactory';
 * const { orderService, productService } = getApiService();
 */

import OrderService from "./OrderService";
import CdsService from "./CdsService";
import productService from "./ProductService";
import devisService from "./DevisService";
import clientService from "./ClientService";
import clientMaterialService from "./ClientMaterialService";
import mockApiService from "./mockApiService";

// Set to false to use real API instead of mock API
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === "true" || false;

// Services for the mock API
const mockServices = {
  orderService: {
    getOrders: mockApiService.getOrders,
    getOrderById: mockApiService.getOrderById,
    createOrder: mockApiService.createOrder,
    updateOrder: mockApiService.updateOrder,
    partialUpdateOrder: mockApiService.updateOrder,
    deleteOrder: mockApiService.deleteOrder,
    addProductToOrder: mockApiService.addProductToOrder,
    removeProductFromOrder: mockApiService.removeProductFromOrder,
    updateOrderStatus: mockApiService.updateOrderStatus,
    generateInvoiceFromOrder: mockApiService.generateInvoiceFromOrder,
    getOrdersByClient: (clientId) => {
      return mockApiService
        .getOrders()
        .then((orders) =>
          orders.filter((order) => order.client_id === parseInt(clientId))
        );
    },
  },

  productService: {
    getProducts: mockApiService.getProducts,
    getProductById: (id) => {
      return mockApiService
        .getProducts()
        .then(
          (products) =>
            products.find((product) => product.id === parseInt(id)) || null
        );
    },
  },

  clientService: {
    getClients: mockApiService.getClients,
    getClientById: (id) => {
      return mockApiService
        .getClients()
        .then(
          (clients) =>
            clients.find((client) => client.id === parseInt(id)) || null
        );
    },
    searchClients: mockApiService.searchClients,
  },

  devisService: {
    getDevis: mockApiService.getDevis,
    getDevisByClient: (clientId) => {
      return mockApiService
        .getDevis()
        .then((devis) =>
          devis.filter((d) => d.client_id === parseInt(clientId))
        );
    },
  },
};

// Real API services
const realServices = {
  orderService: OrderService,
  productService,
  devisService,
  clientService,
  clientMaterialService,
};

/**
 * Get the appropriate API service based on configuration
 */
export const getApiService = () => {
  if (USE_MOCK_API) {
    console.log("Using mock API services");
    return mockServices;
  }

  console.log("Using real API services");

  // Return the real services
  return {
    orderService: OrderService,
    cdsService: CdsService,
    // Include other services as needed
  };
};

export default getApiService;
