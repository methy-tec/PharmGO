// Service Manager

import { api } from "./AuthService";

const handleError = (error) => {
  const serverData = error.response?.data;

  // Le serveur a repondu avec un cors JSON (4xx, 5xx)
  if (serverData) {
    const err = new Error(serverData.message || 'Erreur serveur');
    err.statusCode = error.response.status;
    err.requiresUpgrade = serverData.requiresUpgrade || false;
    err.serverData = serverData;
    throw err;
  }

  // Pas de reponse (reseau, timeout)
  throw new Error(error.message || 'Erreur réseau');
}

const ManagerService = {

    // === Ma Pharmacie
    getMyPharmacy: async () => {
        try {
            const response = await api.get('/manager/my-pharmacy');
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },
    updatePharmacyInfo: async (pharmacyInfo) => {
        try {
            const response = await api.put('/manager/my-pharmacy', pharmacyInfo);
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },

    // === Statistiques
    getManagerStats: async () => {
        try {
            const response = await api.get('/manager/stats');
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },

    // === employees
    getEmployees: async () => {
        try {
            const response = await api.get('/manager/employees');
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },

    // === Orders
    getOrders: async () => {
        try {
            const response = await api.get('/manager/orders');
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },
    updateOrderStatus: async (orderId, status) => {
        try {
            const response = await api.put(`/manager/orders/${orderId}/status`, { status });
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },

    // === Customers
    getCustomers: async () => {
        try {
            const response = await api.get('/manager/customers');
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },

    // === Products
    getProducts: async (params) => {
        try {
            const response = await api.get('/manager/products', { params });
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },
    createProduct: async (productData) => {
        try {
            const response = await api.post('/manager/products', productData);
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },
    updateProduct: async (productId, productData) => {
        try {
            const response = await api.put(`/manager/products/${productId}`, productData);
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },
    updateStock: async (productId, stockData) => {
        try {
            const response = await api.put(`/manager/products/${productId}/stock`, stockData);
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },
    deleteProduct: async (productId) => {
        try {
            const response = await api.delete(`/manager/products/${productId}`);
            return response.data;
        } catch (error) {
            handleError(error);
        }
    },
}

export default ManagerService;