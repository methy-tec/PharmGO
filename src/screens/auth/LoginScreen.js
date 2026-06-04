import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

import Toast from '../../components/Toast';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [toast, setToast] = useState(null);

    const showToast = (type, title, message) => {
        setToast({ type, title, message, duration: 4000 });
    }

    const valide = () => {
        const newErrors = {};

        if (!email) {
            newErrors.email = 'Email est requis';
        }else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email est invalide';
        }

        if (!password) {
            newErrors.password = 'Mot de passe est requis';
        }else if (password.length < 6) {
            newErrors.password = 'Mot de passe doit avoir au moins 6 caractères';
        }

        if (Object.keys(newErrors).length > 0) {
            showToast('error', 'Erreur de validation', 'Veuillez corriger les erreurs');
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!valide()) return;

        try{
            setLoading(true);
            const response = await login(email, password);

            if (response.success) {
                showToast('success', 'Connexion réussie', 'Bienvenue !');
            }

        }catch(error){
            showToast('error', 'Erreur de connexion',
                error.message || 'Email ou mot de passe incorrect'
            );
        }finally{
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
            >
                {/* header avec gradient */}
                <LinearGradient
                    colors={['#1a3a5c', '#2e7fbd']}
                    style={styles.header}
                    start={{ x: 0, y: 0}}
                    end={{ x: 1, y: 1}}
                >
                    <Image 
                        source={require('../../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.tagline}>Votre pharmacie en ligne</Text>
                    <Text style={styles.version}>v2.0</Text>
                </LinearGradient>

                {/* Formulaire */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Bon retour ! 👋</Text>
                    <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>

                    {/* Email  */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Entrez votre email"
                            value={email}
                            placeholderTextColor="#666"
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors({ ...errors, email: null});
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                    {/* Password  */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mot de passe"
                            placeholderTextColor="#666"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrors({ ...errors, password: null});
                            }}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.showPasswordIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    {/* Mot de passe oublié */}
                    <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ResetPassword')}>
                        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                    </TouchableOpacity>

                    {/* Button de Connexion */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient 
                            colors={['#1a3a5c', '#2e7fbd']}
                            style={styles.loginButtonGradient}
                            start={{ x: 0, y: 0}}
                            end={{ x: 1, y: 0}}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff"/>

                            ): (
                                <Text style={styles.loginButtonText}>Se connecter</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>ou</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Creer un compte */}
                    <TouchableOpacity 
                        style={styles.signupButton}
                        onPress={() => navigation.navigate('Register')}
                        >
                        <Text style={styles.signupButtonText}>
                            Pas de compte ? <Text style={styles.signupLink}>S'inscrire</Text>
                        </Text>
                    </TouchableOpacity>
                    
                </View>
            </ScrollView>
            {
                toast && (
                    <Toast
                        toast={toast}
                        onDismiss={() => setToast(null)}
                    />
                )
            }
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center'
    },
    logo: {
        width: 170,
        height: 170,
        marginBottom: 10
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 5
    },
    version: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500'
    },
    tagline: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500'
    },
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 32,
        marginTop: -20
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#333',
        marginBottom: 32
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    inputIcon: {
        marginRight:12
    },
    input:{
        flex: 1,
        height: 52,
        fontSize: 16,
        color: "#333"
    },
    eyeIcon: {
        padding: 8
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 13,
        marginLeft: 4,
        marginBottom: 12
    },
    forgotPassword:{
        alignSelf: 'flex-end',
        marginBottom: 24,
        marginTop: 8
    },
    forgotPasswordText: {
        color: '#2e7fbd',
        fontSize: 14,
        fontWeight: '600'
    },
    loginButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24
    },
    loginButtonGradient: {
        height: 54,
        alignItems: 'center',
        justifyContent: 'center'
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700'
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0'
    },
    dividerText: {
        color: '#999',
        marginHorizontal: 16,
        fontSize: 14,
        fontWeight: '600'
    },
    signupButton: {
        alignItems: 'center',
        paddingVertical:  16,
    },
    signupButtonText: {
        color: '#666',
        fontSize: 15,
    },
    signupLink: {
        color: '#2e7fbd',
        fontWeight: '700'
    }
})
