import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base de l'API
// https://pharma-go-backend.onrender.com/api/v1
const API_URL = 'https://pharma-go-backend.onrender.com/api/v1';

// Creer une instance d'axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// ============================================
// Intercepteur pour ajouter le token a chaque requete
// ============================================
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
// ============================================
// Intercepteur pour gérer les erreurs
// ============================================
api.interceptors.response.use(
    (response) => response,
    async(error) => {
        if (error.response?.status === 401) {
            // Token expire ou invalide
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// ============================================
// SERVICE D'AUTHENTIFICATION
// ============================================

const authService = {
    // Inscription
    register: async (userData) => {
        try{
            const response = await api.post('/auth/register', userData);

            if (response.data.success) {
                // Sauvegarder le token et l'utilisateur
                await AsyncStorage.setItem('token', response.data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
            }

            return response.data;
        }catch(error){
            console.error('Erreur lors de l\'inscription:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur d\'inscription' };
        }
    },

    //Connexion
    login: async (email, password) => {
        try{
            const response = await api.post('/auth/login', { email, password });

            if (response.data.success) {
                // Sauvegarder le token et l'utilisateur
                await AsyncStorage.setItem('token', response.data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
            return response.data;
        }catch(error){
            console.error('Erreur lors de la connexion:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur de connexion' };
        }
    },

    // Verifier l'email
    verifyEmail: async (code) => {
        try{
            const response = await api.post('/auth/verify-email', { code });

            if (response.data.success) {
                // Mettre a jour l'utilisateur dans le storage
                const userResponse = await api.get('/auth/me');
                const updatedUser = userResponse.data.data.user;
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            }

            return response.data;
        }catch(error){
            console.error('Erreur lors de la verification de l\'email:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Code invalide' };
        }
    },
    resetPassword: async (email, newPassword) => {
        try{
            const response = await api.post('/auth/reset-password', { email, newPassword });
            return response.data;
        }catch(error){
            console.error('Erreur lors de la réinitialisation de mot de passe:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur de réinitialisation de mot de passe' };
        }
    },
    verifyResetCode: async (email, code) =>{
      try{
        const response = await api.post('/auth/verify-reset-code', { email, code });
        return response.data;
      }catch(error){
        console.error('Erreur lors de la verification du code de réinitialisation:', error.response?.data || error.message);
        throw error.response?.data || { success: false, message: 'Erreur de verification de code de réinitialisation' };
      }
    },
    setNewPassword: async(email, code, newPassword) => {
      try{
        const response = await api.post('/auth/set-new-password', { email, code, newPassword });
        return response.data;
      }catch(error){
        console.error('Erreur lors de la réinitialisation de mot de passe:', error.response?.data || error.message);
        throw error.response?.data || { success: false, message: 'Erreur de réinitialisation de mot de passe' };
      }
    },
    changeEmail: async (newEmail) => {
        try{
            const response = await api.put('/auth/change-email', { newEmail });
            return response.data;
        }catch(error){
            console.error('Erreur lors du changement d\'email:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur de changement d\'email' };
        }
    },

    // Renvoyer le code de verification
    ressendCode: async() => {
        try{
            const response = await api.post('/auth/resend-verification');
            return response.data;
        }catch(error){
            console.error('Erreur lors de la retransmission du code:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur de retransmission' };
        }
    },

    // Récupérer les informations de l'utilisateur connecté
    getMe: async () => {
        try{
            const response = await api.get('/auth/me');
            return response.data.data.user;
        }catch(error){
            console.error('Erreur lors de la récupération des informations de l\'utilisateur:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur de récupération des informations' };
        }
    },
  // Dans AuthService.js
getSubscriptionRequests: async (params) => {
    const res = await api.get('/superadmin/subscriptions/requests', { params });
    return res.data;
},

processSubscriptionRequest: async (id, body) => {
    const res = await api.put(`/superadmin/subscriptions/requests/${id}`, body);
    return res.data;
},

    //Deconexion
    logout: async () => {
        try{
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            return { success: true, message: 'Déconnexion réussie' };
        }catch(error){
            console.error('Erreur lors de la déconnexion:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur de déconnexion' };
        }
    },

    //Obetenir le token stocké
    getToken: async () => {
        try{
            return await AsyncStorage.getItem('token');
        }catch(error){
            console.error('Erreur lors de la récupération du token:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur de récupération du token' };
        }
    },

    // Obtenir l'utilisateur stocké
    getStoredUser: async () => {
        try{
            const userJson = await AsyncStorage.getItem('user');
            if (!userJson) {
                return null;
            }
            return JSON.parse(userJson);
        }catch(error){
            console.error('Erreur lors de la récupération de l\'utilisateur stocké:', error.response?.data || error.message);
            throw error.response?.data || { success: false, message: 'Erreur de récupération de l\'utilisateur stocké' };
        }
    },

     // ===== STATISTIQUES =====
  
  getGlobalStats: async () => {
    try {
      const response = await api.get('/superadmin/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur getGlobalStats:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  // ===== UTILISATEURS =====
  
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/superadmin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getAllUsers:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  suspendUser: async (userId, reason) => {
    try {
      const response = await api.post(`/superadmin/users/${userId}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error('Erreur suspendUser:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },
  activeUser: async (userId) => {
    try {
      const response = await api.post(`/superadmin/users/${userId}/active`);
      return response.data;
    } catch (error) {
      console.error('Erreur activeUser:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/superadmin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Erreur updateUserRole:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/superadmin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur deleteUser:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  createAdmin: async (adminData) => {
    try {
      const response = await api.post('/superadmin/admins', adminData);
      return response.data;
    } catch (error) {
      console.error('Erreur createAdmin:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  // ===== PHARMACIES =====
  
  getAllPharmacies: async (params = {}) => {
    try {
      const response = await api.get('/superadmin/pharmacies', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getAllPharmacies:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  validatePharmacy: async (pharmacyId) => {
    try {
      const response = await api.post(`/superadmin/pharmacies/${pharmacyId}/validate`);
      return response.data;
    } catch (error) {
      console.error('Erreur validatePharmacy:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  suspendPharmacy: async (pharmacyId, reason) => {
    try {
      const response = await api.post(`/superadmin/pharmacies/${pharmacyId}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error('Erreur suspendPharmacy:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  },

  // ===== ABONNEMENTS =====
  
  getSubscriptionHistory: async (params = {}) => {
    try {
      const response = await api.get('/superadmin/subscriptions/history', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur getSubscriptionHistory:', error.response?.data || error.message);
      throw error.response?.data || { success: false, message: 'Erreur' };
    }
  }
};



export default authService;
export {api, API_URL};
