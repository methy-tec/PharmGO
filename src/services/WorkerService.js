// ============================================
// 🛒 SERVICE TRAVAILLEUR
// src/services/WorkerService.js
// ============================================

import { api } from './AuthService';

const handleError = (error) => {
  const serverData = error.response?.data;

  if (serverData) {
    const err = new Error(serverData.message || 'Erreur serveur');
    err.statusCode = error.response.status;
    err.serverData = serverData;
    throw err;
  }

  throw new Error(error.message || 'Erreur réseau');
};

const WorkerService = {
  
  // === Ventes
  createSale: async (saleData) => {
    try {
      const response = await api.post('/travailleur/sales', saleData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  getMySales: async (params = {}) => {
    try {
      const { page, limit, date } = params;
      const queryParams = new URLSearchParams();
      
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      if (date) queryParams.append('date', date);

      const response = await api.get(`/travailleur/sales?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  getMySalesStats: async (period = 'today') => {
    try {
      const response = await api.get(`/travailleur/sales/stats?period=${period}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // === Clients
  searchCustomer: async (email) => {
    try {
      const response = await api.get(`/travailleur/customers/search?email=${email}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // === Produits
  getProducts: async (params = {}) => {
    try {
      const { search, category } = params;
      const queryParams = new URLSearchParams();
      
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);

      const response = await api.get(`/travailleur/products?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  }
};

export default WorkerService;