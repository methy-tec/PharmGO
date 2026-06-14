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
    };

    const valide = () => {
        const newErrors = {};

        if (!email) {
            newErrors.email = 'Email est requis';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email est invalide';
        }

        if (!password) {
            newErrors.password = 'Mot de passe est requis';
        } else if (password.length < 6) {
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

        try {
            setLoading(true);
            const response = await login(email, password);

            if (response.success) {
                showToast('success', 'Connexion réussie', 'Bienvenue !');
            }
        } catch (error) {
            showToast('error', 'Erreur de connexion',
                error.message || 'Email ou mot de passe incorrect'
            );
        } finally {
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
                {/* Header avec gradient */}
                <LinearGradient
                    colors={['#00b368', '#008C52']}
                    style={styles.header}
                >
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('../../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.globalFont, styles.tagline]}>Votre pharmacie en ligne</Text>
                </LinearGradient>

                {/* Formulaire */}
                <View style={styles.formContainer}>
                    <Text style={[styles.globalFont, styles.title]}>Bienvenue sur PharmaGo</Text>

                    {/* Email */}
                    <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.globalFont, styles.input]}
                            placeholder="Entrez votre e-mail"
                            value={email}
                            placeholderTextColor="#aaa"
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors({ ...errors, email: null });
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    {errors.email && (
                        <Text style={[styles.globalFont, styles.errorText]}>
                            <Ionicons name="alert-circle-outline" size={12} /> {errors.email}
                        </Text>
                    )}

                    {/* Password */}
                    <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.globalFont, styles.input]}
                            placeholder="Mot de passe"
                            placeholderTextColor="#aaa"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrors({ ...errors, password: null });
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
                    {errors.password && (
                        <Text style={[styles.globalFont, styles.errorText]}>
                            <Ionicons name="alert-circle-outline" size={12} /> {errors.password}
                        </Text>
                    )}

                    {/* Mot de passe oublié */}
                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => navigation.navigate('ResetPassword')}
                    >
                        <Text style={[styles.globalFont, styles.forgotPasswordText]}>
                            Mot de passe oublié ?
                        </Text>
                    </TouchableOpacity>

                    {/* Bouton Connexion */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#00b368', '#008C52']}
                            style={styles.loginButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={[styles.globalFont, styles.loginButtonText]}>
                                    Connectez-vous pour continuer
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={[styles.globalFont, styles.dividerText]}>ou</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Créer un compte */}
                    <TouchableOpacity
                        style={styles.signupButton}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={[styles.globalFont, styles.signupButtonText]}>
                            Pas de compte ?{' '}
                            <Text style={[styles.globalFont, styles.signupLink]}>S'inscrire</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {toast && (
                <Toast
                    toast={toast}
                    onDismiss={() => setToast(null)}
                />
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    globalFont: {
        fontFamily: 'Times New Roman',
    },
    scrollContainer: {
        flexGrow: 1,
    },

    // ── Header ──────────────────────────────────────────
    header: {
        paddingTop: 70,
        paddingBottom: 50,
        alignItems: 'center',
    },
    logoWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
    },
    logo: {
        width: 90,
        height: 90,
    },
    appName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 3,
        marginBottom: 4,
    },
    tagline: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '400',
        letterSpacing: 0.5,
    },

    // ── Formulaire ──────────────────────────────────────
    formContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 32,
        marginTop: -20,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#888',
        marginBottom: 28,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    inputError: {
        borderColor: '#ff3b30',
        backgroundColor: '#fff5f5',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 16,
        color: '#333',
    },
    showPasswordIcon: {
        padding: 4,
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginLeft: 4,
        marginBottom: 12,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
        marginTop: 4,
    },
    forgotPasswordText: {
        color: '#008C52',
        fontSize: 14,
        fontWeight: '600',
    },

    // ── Bouton ──────────────────────────────────────────
    loginButton: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#008C52',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonGradient: {
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // ── Divider ─────────────────────────────────────────
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        color: '#aaa',
        marginHorizontal: 16,
        fontSize: 14,
    },

    // ── Inscription ─────────────────────────────────────
    signupButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    signupButtonText: {
        color: '#888',
        fontSize: 15,
    },
    signupLink: {
        color: '#008C52',
        fontWeight: '700',
    },
});