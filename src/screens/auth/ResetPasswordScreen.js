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
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import authService from '../../services/AuthService';

import Toast from '../../components/Toast';

export default function ResetPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);

    const showToast = (type, title, message) => {
        setToast({ type, title, message, duration: 4000 });
    };

    const validate = () => {
        const newErrors = {};

        if (!email) {
            newErrors.email = 'Email est requis';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email est invalide';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            showToast('error', 'Erreur de validation', 'Veuillez corriger les erreurs');
            return false;
        }

        return true;
    };

    const handleResetPassword = async () => {
        if (!validate()) return;

        try {
            setLoading(true);

            const data = await authService.resetPassword(email);
            if (data.success) {
                showToast('success', 'Code envoyé', 'Vérifiez votre boîte mail');
                // Naviguer vers l'écran de vérification du code
                setTimeout(() => navigation.navigate('VerifyEmail', { email, mode: 'reset' }), 1500);
            } else {
                showToast('error', 'Erreur', data.message || 'Une erreur est survenue');
            }

        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible de contacter le serveur');
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
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#00b368', '#008C52']}
                    style={styles.header}
                >
                    <Text style={styles.headerIcon}>🔐</Text>
                    <Text style={styles.headerTitle}>Mot de passe oublié</Text>
                    <Text style={styles.headerSubtitle}>
                        Entrez votre email pour recevoir un code de réinitialisation
                    </Text>
                </LinearGradient>

                {/* Formulaire */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Réinitialisation</Text>
                    <Text style={styles.subtitle}>
                        Un code vous sera envoyé par email
                    </Text>

                    {/* Email */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#666"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Entrez votre email"
                            placeholderTextColor="#666"
                            value={email}
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
                        <Text style={styles.errorText}>{errors.email}</Text>
                    )}

                    {/* Bouton envoyer */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#00b368', '#008C52']}
                            style={styles.submitButtonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Envoyer le code</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Retour connexion */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Ionicons name="arrow-back-outline" size={16} color="#00b368" />
                        <Text style={styles.backButtonText}>Retour à la connexion</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {toast && (
                <Toast toast={toast} onDismiss={() => setToast(null)} />
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 56,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 20,
    },
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
        fontSize: 26,
        fontWeight: '800',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        marginBottom: 32,
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
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 13,
        marginLeft: 4,
        marginBottom: 12,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 24,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonGradient: {
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 16,
    },
    backButtonText: {
        color: '#00b368',
        fontSize: 15,
        fontWeight: '600',
    },
});