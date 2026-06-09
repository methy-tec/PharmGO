import React, { useEffect, useState } from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View, Text, StyleSheet, AppState } from "react-native";

// Ecrans Auth
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";
import ChangeEmailScreen from "../screens/auth/ChangeEmailScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import NewPasswordScreen from "../screens/auth/NewPasswordScreen";

// Ecrans Home
import HomeScreen from "../screens/HomeScreen";
import PharmacyEmployeesScreen from "../screens/admin/PharmacyEmployeeScreen";
import ProfileScreen from "../screens/profiles/ProfileScreen";

// Ecrans Super Admin et Admin
import SuperAdminScreens from "../screens/superadmin/SuperAdminScreens";
import AdminHomeScreen from "../screens/admin/AdminScreen";

// Ecran Manager
import ManagerScreen from "../screens/manager/ManagerScreen";

// Ecran Worker
import WorkerHomeScreen from "../screens/travailleurs/WorkerHomeScreen";

// Ecran User
import UserScreen from "../screens/user/UserScreen";

// APP update
import { checkForAppUpdate } from "../hooks/usAppUpdate";

const Stack = createNativeStackNavigator();

// ----------------- NAVIGATORS -----------------
function AuthNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            
            <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
            
        </Stack.Navigator>
    );
}

function AppNavigator() {
    const { user } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user?.role === 'superadmin' && (
                <Stack.Screen name="SuperAdmin" component={SuperAdminScreens} />
            )}
            {user?.role === 'admin' && (
                <>
                    <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
                    <Stack.Screen name="PharmacyEmployeesScreen" component={PharmacyEmployeesScreen} />
                </>
            )}
            {user?.role === 'manager' && (
                <Stack.Screen name="Manager" component={ManagerScreen} />
            )}
            {user?.role === 'travailleur' && (
                <Stack.Screen name="WorkerHome" component={WorkerHomeScreen} />
            )}
            {user?.role === 'user' && (
                <Stack.Screen name="User" component={UserScreen} />
            )}
            {!user?.role && (
                <Stack.Screen name="Home" component={HomeScreen} />
            )}

            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        </Stack.Navigator>
    );
}

// ----------------- LOADING SCREEN -----------------
function LoadingScreen() {
    return (
        <View style={styles.loadingContainer}>
            <Text style={styles.loadingLogo}>💊</Text>
            <Text style={styles.loadingText}>PharmaGO</Text>
            <ActivityIndicator size="large" color="#00b368" style={{ marginTop: 20 }} />
        </View>
    );
}

// ----------------- ROOT NAVIGATOR -----------------
export default function RootNavigator() {
    const { isAuthenticated, isLoading, user } = useAuth();

    useEffect(() => {
    if (!isLoading) {
      // On vérifie la mise à jour une fois que l'app est chargée
      checkForAppUpdate();
    }
  }, [isLoading]);

    console.log('📍 Navigation State:', {
        isAuthenticated,
        isLoading,
        user: user ? { email: user.email, isEmailVerified: user.isEmailVerified } : null
    });

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
         <NavigationContainer>
            {/* Si pas connecté OU user est null -> AuthNavigator */}
            {!isAuthenticated || !user ? (
                <AuthNavigator />
            ) 
            : !user.isEmailVerified ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
                    <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
                </Stack.Navigator>
            ) 
            : (
                <AppNavigator />
            )}
        </NavigationContainer>
    );
}

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingLogo: {
        fontSize: 64,
        marginBottom: 10
    },
    loadingText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#00b368'
    }
});