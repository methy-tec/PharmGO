import React, { createContext, useState, useContext, useEffect} from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from "../services/AuthService";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }
    return context;
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Verifier si l'utilisateur est connecte au demarrage
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try{
            const token = await authService.getToken();
            const storedUser = await authService.getStoredUser();

            if (token && storedUser) {
                setUser(storedUser);
                setIsAuthenticated(true);
            }
        }catch(error){
            console.error('Erreur checkAuth:', error);
        }finally{
            setIsLoading(false);
        }
    };

    // Inscription
    const register = async (userData) => {
        try{
            const response = await authService.register(userData);
            if (response.success) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            }
            return response;
        }catch(error){
            throw error;
        }
    };

    // Connexion
    const login = async (email, password) => {
        try{
            const response = await authService.login(email, password);

            if (response.success) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            }
            return response;
        }catch(error){
            throw error;
        }
    };

    // Verifier l'email
    const verifyEmail = async (code) => {
        try{
            const response = await authService.verifyEmail(code);
            if (response.success) {
                // Rafraîchir le profil
                const updatedUser = await authService.getMe();
                setUser(updatedUser);
                console.log("USER APRÈS VERIFICATION :", updatedUser);
                console.log("isEmailVerified :", updatedUser?.isEmailVerified);
            }
            return response;
        }catch(error){
            throw error;
        }
    };
    // password reset
    const resetPassword = async (email, newPassword) =>{
        try{
            const response = await authService.resetPassword(email, newPassword);
            return response;
        }catch(error){
            throw error;
        }
    }


    //Deconnexion
    const logout = async () => {
        try{
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
        }catch(error){
            throw error;
        }
    };

    // Rafraichir le profil
    const refreshUser = async () => {
        const user = await authService.getMe();
        setUser(user);
        await AsyncStorage.setItem('user', JSON.stringify(user));
    };

    // ========================================
    // SUPER ADMIN METHODS
    // ========================================

    // --- STATISTIQUES ---
    const getGlobalStats = async () => {
        try {
            return await authService.getGlobalStats();
        } catch (error) {
            throw error;
        }
    };

    // --- UTILISATEURS ---
    const getAllUsers = async (params = {}) => {
        try {
            return await authService.getAllUsers(params);
        } catch (error) {
            throw error;
        }
    };

    const suspendUser = async (userId, reason) => {
        try {
            return await authService.suspendUser(userId, reason);
        } catch (error) {
            throw error;
        }
    };

    const updateUserRole = async (userId, role) => {
        try {
            return await authService.updateUserRole(userId, role);
        } catch (error) {
            throw error;
        }
    };

    const deleteUser = async (userId) => {
        try {
            return await authService.deleteUser(userId);
        } catch (error) {
            throw error;
        }
    };

    const createAdmin = async (adminData) => {
        try {
            return await authService.createAdmin(adminData);
        } catch (error) {
            throw error;
        }
    };

    // --- PHARMACIES ---
    const getAllPharmacies = async (params = {}) => {
        try {
            return await authService.getAllPharmacies(params);
        } catch (error) {
            throw error;
        }
    };

    const validatePharmacy = async (pharmacyId) => {
        try {
            return await authService.validatePharmacy(pharmacyId);
        } catch (error) {
            throw error;
        }
    };

    const suspendPharmacy = async (pharmacyId, reason) => {
        try {
            return await authService.suspendPharmacy(pharmacyId, reason);
        } catch (error) {
            throw error;
        }
    };

    // --- ABONNEMENTS ---
    const getSubscriptionHistory = async (params = {}) => {
        try {
            return await authService.getSubscriptionHistory(params);
        } catch (error) {
            throw error;
        }
    };

    const value = {
        user,
        setUser,
        isLoading,
        isAuthenticated,
        isEmailVerified: user?.isEmailVerified || false,
        register,
        login,
        resetPassword,
        logout,
        verifyEmail,
        refreshUser,
        // SuperAdmin methods
        getGlobalStats,
        getAllUsers,
        suspendUser,
        updateUserRole,
        deleteUser,
        createAdmin,
        getAllPharmacies,
        validatePharmacy,
        suspendPharmacy,
        getSubscriptionHistory,
    };

    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;