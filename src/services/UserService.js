// ============================================
// 🔍 SERVICE USER (RECHERCHE)
// src/services/UserSearchService.js
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

const UserService = {
  
  // === Pharmacies proches
  getNearbyPharmacies: async (params) => {
    try {
      const response = await api.get(`/user/pharmacies/nearby`, { params });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },
  searchMedicines:async(params) =>{
      try {
        const response = await api.get('/user/search/medicines', { params });
        return response.data;
      } catch (error) {
        handleError(error);
      }
  },

  // === Catégories
  getCategories: async () => {
    try {
      const response = await api.get('/user/search/categories');
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // === Détails produit
  getProductDetails: async (id) => {
    try {
      const response = await api.get(`/user/products/${id}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  }
};

export default UserService;
