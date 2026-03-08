// ============================================
// 🛡️ SERVICE ADMIN
// src/services/adminService.js
// ============================================

import { api } from './AuthService';

const handleError = (error) => {
  const serverData = error.response?.data;

  // Le serveur a repondu avec un corps JSON (4xx, 5xx)
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

const AdminService = {
  
  // ===== MES PHARMACIES =====
  
  getMyPharmacies: async () => {
    try {
      const response = await api.get('/admin/my-pharmacies');
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  createPharmacy: async (pharmacyData) => {
    try {
      const response = await api.post('/admin/pharmacies', pharmacyData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  updatePharmacy: async (pharmacyId, pharmacyData) => {
    try {
      const response = await api.put(`/admin/pharmacies/${pharmacyId}`, pharmacyData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  deletePharmacy: async (pharmacyId) => {
    try {
      const response = await api.delete(`/admin/pharmacies/${pharmacyId}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // ===== STATISTIQUES =====
  
  getMyStats: async () => {
    try {
      const response = await api.get('/admin/my-stats');
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // ===== EMPLOYÉS =====
  
  getPharmacyEmployees: async (pharmacyId) => {
    try {
      const response = await api.get(`/admin/pharmacies/${pharmacyId}/employees`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  addEmployee: async (employeeData) => {
    try {
      const response = await api.post('/admin/employees', employeeData);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  updateEmployeeSalary: async (employeeId, salary, salaryPeriod) => {
    try {
      const response = await api.put(`/admin/employees/${employeeId}/salary`, { 
        salary, 
        salaryPeriod 
      });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  removeEmployee: async (employeeId) => {
    try {
      const response = await api.delete(`/admin/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // ===== GÉRANTS =====
  
  assignManager: async (pharmacyId, email) => {
    try {
      const response = await api.post('/admin/managers', { 
        pharmacyId, 
        email 
      });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  getPharmacyManagers: async (pharmacyId) => {
  try {
    const response = await api.get(`/admin/pharmacies/${pharmacyId}/managers`); // ✅ corrigé
    return response.data;
  } catch (error) {
    handleError(error);
  }
},

  removeManager: async (managerId) => {
    try {
      const response = await api.delete(`/admin/managers/${managerId}`);
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // ===== COMMANDES =====
  
  getMyOrders: async (params = {}) => {
    try {
      const response = await api.get('/admin/my-orders', { params });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // ===== CLIENTS et USERS =====
  
  getMyCustomers: async (params = {}) => {
    try {
      const response = await api.get('/admin/my-customers', { params });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // ===== UTILISATEURS =====
  
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // ==== ABonnement
  getMySubscriptionRequests: async () => {
  const res = await api.get('/admin/subscription/requests');
  return res.data;
},

requestSubscriptionUpgrade: async (body) => {
  const res = await api.post('/admin/subscription/request', body);
  return res.data;
},
};

export default AdminService;
