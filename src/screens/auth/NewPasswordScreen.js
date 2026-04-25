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

const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    if (password.length < 6) return { score: 1, label: 'Faible', color: '#ff3b30' };
    
    let score = 1;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Faible', color: '#ff3b30' };
    if (score === 3) return { score, label: 'Moyen', color: '#ff9500' };
    return { score, label: 'Fort', color: '#00b368' };
};

export default function NewPasswordScreen({ navigation, route }) {
    const { email, code } = route.params;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);

    const strength = getPasswordStrength(password);

    const showToast = (type, title, message) => {
        setToast({ type, title, message, duration: 4000 });
    };

    const validate = () => {
        const newErrors = {};

        if (!password) {
            newErrors.password = 'Mot de passe est requis';
        } else if (password.length < 6) {
            newErrors.password = 'Minimum 6 caractères';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            showToast('error', 'Erreur de validation', 'Veuillez corriger les erreurs');
            return false;
        }

        return true;
    };

    const handleSavePassword = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            const data = await authService.setNewPassword(email, code, password);

            if (data.success) {
                showToast('success', 'Mot de passe mis à jour', 'Vous pouvez vous connecter');
                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }, 1500);
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
                    <Text style={styles.headerIcon}>🔑</Text>
                    <Text style={styles.headerTitle}>Nouveau mot de passe</Text>
                    <Text style={styles.headerSubtitle}>
                        Choisissez un mot de passe sécurisé
                    </Text>
                </LinearGradient>

                {/* Formulaire */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Réinitialisation</Text>
                    <Text style={styles.subtitle}>Minimum 6 caractères</Text>

                    {/* Nouveau mot de passe */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#666"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Nouveau mot de passe"
                            placeholderTextColor="#666"
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
                            style={styles.eyeIcon}
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
                        <Text style={styles.errorText}>{errors.password}</Text>
                    )}

                    {/* Barre de force */}
                    {password.length > 0 && (
                        <View style={styles.strengthContainer}>
                            <Text style={styles.strengthLabel}>Force du mot de passe</Text>
                            <View style={styles.strengthBars}>
                                {[1, 2, 3, 4].map((bar) => (
                                    <View
                                        key={bar}
                                        style={[
                                            styles.strengthBar,
                                            {
                                                backgroundColor:
                                                    bar <= strength.score
                                                        ? strength.color
                                                        : '#e0e0e0',
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.strengthText, { color: strength.color }]}>
                                {strength.label}
                            </Text>
                        </View>
                    )}

                    {/* Confirmer mot de passe */}
                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color="#666"
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmer le mot de passe"
                            placeholderTextColor="#666"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setErrors({ ...errors, confirmPassword: null });
                            }}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons
                                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>
                    {/* Indicateur de correspondance */}
                    {confirmPassword.length > 0 && (
                        <Text
                            style={[
                                styles.matchText,
                                { color: password === confirmPassword ? '#00b368' : '#ff3b30' },
                            ]}
                        >
                            {password === confirmPassword
                                ? '✓ Les mots de passe correspondent'
                                : '✗ Les mots de passe ne correspondent pas'}
                        </Text>
                    )}
                    {errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}

                    {/* Bouton enregistrer */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSavePassword}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#00b368', '#008C52']}
                            style={styles.submitButtonGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    Enregistrer le mot de passe
                                </Text>
                            )}
                        </LinearGradient>
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
    eyeIcon: {
        padding: 8,
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 13,
        marginLeft: 4,
        marginBottom: 12,
    },
    strengthContainer: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    strengthLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        marginBottom: 6,
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 4,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
    },
    matchText: {
        fontSize: 13,
        marginLeft: 4,
        marginBottom: 12,
        fontWeight: '500',
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 16,
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
        fontSize: 17,
        fontWeight: '700',
    },
});