import React, { useState, useEffect, useRef } from "react";
import {
    Modal, View, Text, TextInput, KeyboardAvoidingView,
    TouchableOpacity, StyleSheet, Platform, ScrollView,
    ActivityIndicator, Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AdminService from "../services/AdminService";
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";

// ─── TOAST CONFIG ────────────────────────────────────────────────────────────
const TOAST_TYPES = {
    success: {
        icon:    'checkmark-circle',
        colors:  ['#00b368', '#008C52'],
        bg:      '#f0fdf4',
        border:  '#86efac',
        title:   '#14532d',
        text:    '#166534',
    },
    error: {
        icon:    'close-circle',
        colors:  ['#ef4444', '#dc2626'],
        bg:      '#fef2f2',
        border:  '#fca5a5',
        title:   '#7f1d1d',
        text:    '#991b1b',
    },
    warning: {
        icon:    'warning',
        colors:  ['#f59e0b', '#d97706'],
        bg:      '#fffbeb',
        border:  '#fcd34d',
        title:   '#78350f',
        text:    '#92400e',
    },
    upgrade: {
        icon:    'lock-closed',
        colors:  ['#8b5cf6', '#6c2bd9'],
        bg:      '#f5f3ff',
        border:  '#c4b5fd',
        title:   '#3b0764',
        text:    '#4c1d95',
    },
};

// ─── TOAST COMPONENT ─────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity    = useRef(new Animated.Value(0)).current;
    const cfg        = TOAST_TYPES[toast.type] || TOAST_TYPES.error;

    useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0, useNativeDriver: true,
                tension: 80, friction: 10,
            }),
            Animated.timing(opacity, {
                toValue: 1, duration: 200, useNativeDriver: true,
            }),
        ]).start();

        // Auto dismiss après 4s
        const timer = setTimeout(() => dismiss(), toast.duration || 4000);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -120, duration: 250, useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0, duration: 200, useNativeDriver: true,
            }),
        ]).start(() => onDismiss());
    };

    return (
        <Animated.View style={[
            styles.toast,
            { transform: [{ translateY }], opacity, borderColor: cfg.border, backgroundColor: cfg.bg }
        ]}>
            {/* Barre colorée à gauche */}
            <LinearGradient colors={cfg.colors} style={styles.toastAccent} />

            {/* Icône */}
            <View style={[styles.toastIconWrap, { backgroundColor: cfg.colors[0] + '20' }]}>
                <Ionicons name={cfg.icon} size={22} color={cfg.colors[0]} />
            </View>

            {/* Texte */}
            <View style={styles.toastBody}>
                <Text style={[styles.toastTitle, { color: cfg.title }]}>{toast.title}</Text>
                <Text style={[styles.toastMessage, { color: cfg.text }]}>{toast.message}</Text>
                {toast.action && (
                    <TouchableOpacity style={[styles.toastAction, { borderColor: cfg.colors[0] }]} onPress={toast.action.onPress}>
                        <Text style={[styles.toastActionText, { color: cfg.colors[0] }]}>{toast.action.label}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Bouton fermer */}
            <TouchableOpacity style={styles.toastClose} onPress={dismiss}>
                <Ionicons name="close" size={16} color={cfg.text} />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function CreatePharmacyModal({ visible, onClose, onSuccess }) {
    const [loading,   setLoading]   = useState(false);
    const [formData,  setFormData]  = useState({
        name: '', description: '', address: '', city: '',
        phone: '', email: '', latitude: '', longitude: '',
        deliveryAvailable: false, deliveryRadius: '', deliveryFee: ''
    });
    const [errors,  setErrors]  = useState({});
    const [toast,   setToast]   = useState(null);

    // Fonction pour recuperer la localisation
    const getLocation = async () => {
        // Demander la permission de localisation
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            showToast('warning', '⚠️ Permission refusée', 'Veuillez permettre l\'accès à la localisation.');
            return;
        }

        // Recuperer la position actuelle
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        // Mettre à jour les champs de latitude et longitude
        setFormData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }));
    };
    useEffect(() => {
        if (visible) {
            getLocation();
        }
    }, [visible]);
    
    const showToast = (type, title, message, action = null, duration = 4000) => {
        setToast({ type, title, message, action, duration });
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = () => {
        const e = {};
        if (!formData.name.trim())    e.name    = 'Le nom est requis';
        if (!formData.address.trim()) e.address = "L'adresse est requise";
        if (!formData.city.trim())    e.city    = 'La ville est requise';
        if (!formData.phone.trim()) {
            e.phone = 'Le téléphone est requis';
        } else if (!/^\+?[0-9]{9,15}$/.test(formData.phone.replace(/\s+/g, ''))) {
            e.phone = 'Numéro invalide';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            e.email = "L'email est invalide";
        }
        if (!formData.latitude || !formData.longitude) {
            e.location = 'Coordonnées GPS requises';
        }
        setErrors(e);
        if (Object.keys(e).length > 0) {
            showToast('warning', '⚠️ Formulaire incomplet', 'Veuillez corriger les champs en rouge.');
        }
        return Object.keys(e).length === 0;
    };

    const handleClose = () => {
        setFormData({
            name: '', description: '', address: '', city: '',
            phone: '', email: '', latitude: '', longitude: '',
            deliveryAvailable: false, deliveryRadius: '', deliveryFee: ''
        });
        setErrors({});
        setToast(null);
        onClose();
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            setLoading(true);

            const pharmacyData = {
                ...formData,
                latitude:       parseFloat(formData.latitude),
                longitude:      parseFloat(formData.longitude),
                deliveryRadius: formData.deliveryAvailable ? parseFloat(formData.deliveryRadius) : null,
                deliveryFee:    formData.deliveryAvailable ? parseFloat(formData.deliveryFee)    : null,
            };

            const response = await AdminService.createPharmacy(pharmacyData);
            const license  = response.data?.license || '—';

            // ✅ Toast succès, puis fermeture après 1.5s
            showToast(
                'success',
                '✅ Pharmacie créée !',
                `Licence : ${license} · En attente de validation.`,
                null,
                1500
            );

            setTimeout(() => {
                onSuccess(response.data?.pharmacy);
                handleClose();
            }, 1600);

        } catch (rawError) {
            const statusCode      = rawError?.statusCode || rawError?.status || null;
            const requiresUpgrade = rawError?.requiresUpgrade || rawError?.data?.requiresUpgrade || false;
            const message         = rawError?.message || rawError?.data?.message || 'Une erreur inattendue est survenue.';

            console.error('❌ Erreur création pharmacie:', { message, statusCode, requiresUpgrade });

            if (requiresUpgrade) {
                showToast(
                    'upgrade',
                    '🔒 Limite atteinte',
                    message,
                    { label: 'Voir les plans →', onPress: () => { /* navigation */ } },
                    6000
                );
            } else {
                showToast(
                    'error',
                    getErrorTitle(statusCode),
                    message,
                    null,
                    5000
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <LinearGradient colors={['#00b368', '#008C52']} style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Créer une pharmacie</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                {/* ✅ Toast flottant ancré sous le header */}
                {toast && (
                    <Toast
                        key={toast.message + toast.type}
                        toast={toast}
                        onDismiss={() => setToast(null)}
                    />
                )}

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.form}>

                        {/* Nom */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Nom de la pharmacie *</Text>
                            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                                <Ionicons name="medkit-outline" size={20} color={COLORS.textSecondary} />
                                <TextInput style={styles.input} placeholder="Ex: Pharmacie Centrale" value={formData.name} onChangeText={t => updateField('name', t)} autoCapitalize="words" />
                            </View>
                            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                            <Text style={styles.infoMessage}>ℹ️ Le numéro de licence sera généré automatiquement selon votre abonnement.</Text>
                        </View>

                        {/* Description */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Description (optionnel)</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
                                <TextInput style={[styles.input, styles.textArea]} placeholder="Description de la pharmacie" value={formData.description} onChangeText={t => updateField('description', t)} multiline numberOfLines={3} />
                            </View>
                        </View>

                        {/* Adresse */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Adresse *</Text>
                            <View style={[styles.inputContainer, errors.address && styles.inputError]}>
                                <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                                <TextInput style={styles.input} placeholder="Ex: 123 Rue de la Paix" value={formData.address} onChangeText={t => updateField('address', t)} />
                            </View>
                            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                        </View>

                        {/* Ville */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Ville *</Text>
                            <View style={[styles.inputContainer, errors.city && styles.inputError]}>
                                <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} />
                                <TextInput style={styles.input} placeholder="Ex: Brazzaville" value={formData.city} onChangeText={t => updateField('city', t)} autoCapitalize="words" />
                            </View>
                            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                        </View>

                        {/* Téléphone */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Téléphone *</Text>
                            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                                <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
                                <TextInput style={styles.input} placeholder="+242 123 456 789" value={formData.phone} onChangeText={t => updateField('phone', t)} keyboardType="phone-pad" />
                            </View>
                            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                        </View>

                        {/* Email */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Email (optionnel)</Text>
                            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                                <TextInput style={styles.input} placeholder="contact@pharmacie.com" value={formData.email} onChangeText={t => updateField('email', t.toLowerCase())} keyboardType="email-address" autoCapitalize="none" />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* GPS */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Coordonnées GPS *</Text>
                            <View style={styles.row}>
                                <View style={[styles.halfInput, errors.location && styles.inputError]}>
                                    <Ionicons name="navigate-outline" size={20} color={COLORS.textSecondary} />
                                    <TextInput style={styles.input} placeholder="Latitude" value={formData.latitude} onChangeText={t => updateField('latitude', t)} keyboardType="decimal-pad" />
                                </View>
                                <View style={[styles.halfInput, errors.location && styles.inputError]}>
                                    <Ionicons name="navigate-outline" size={20} color={COLORS.textSecondary} />
                                    <TextInput style={styles.input} placeholder="Longitude" value={formData.longitude} onChangeText={t => updateField('longitude', t)} keyboardType="decimal-pad" />
                                </View>
                            </View>
                            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
                            <Text style={styles.hint}>💡 Utilisez Google Maps pour obtenir les coordonnées exactes</Text>
                        </View>

                        {/* Livraison */}
                        <View style={styles.fieldGroup}>
                            <TouchableOpacity style={styles.checkboxContainer} onPress={() => updateField('deliveryAvailable', !formData.deliveryAvailable)}>
                                <View style={[styles.checkbox, formData.deliveryAvailable && styles.checkboxActive]}>
                                    {formData.deliveryAvailable && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                                <Text style={styles.checkboxLabel}>Livraison disponible</Text>
                            </TouchableOpacity>
                            {formData.deliveryAvailable && (
                                <View style={styles.row}>
                                    <View style={styles.halfInput}>
                                        <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                                        <TextInput style={styles.input} placeholder="Rayon (km)" value={formData.deliveryRadius} onChangeText={t => updateField('deliveryRadius', t)} keyboardType="number-pad" />
                                    </View>
                                    <View style={styles.halfInput}>
                                        <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} />
                                        <TextInput style={styles.input} placeholder="Frais (FCFA)" value={formData.deliveryFee} onChangeText={t => updateField('deliveryFee', t)} keyboardType="number-pad" />
                                    </View>
                                </View>
                            )}
                        </View>

                    </View>
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <LinearGradient colors={['#00b368', '#008C52']} style={styles.submitBtnGradient}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                    <Text style={styles.submitBtnText}>Créer la pharmacie</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </Modal>
    );
}

function getErrorTitle(statusCode) {
    switch (statusCode) {
        case 400: return '⚠️ Données invalides';
        case 401: return '🔐 Non authentifié';
        case 403: return '🔒 Accès refusé';
        case 404: return '🔍 Ressource introuvable';
        case 429: return '⏱️ Trop de requêtes';
        case 500: return '🔧 Erreur serveur';
        default:  return '❌ Erreur';
    }
}

const styles = StyleSheet.create({
    container:          { flex: 1, backgroundColor: COLORS.background },
    header:             { paddingTop: 50, paddingBottom: 20 },
    headerContent:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    closeBtn:           { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle:        { fontSize: FONTS.xl, fontWeight: '800', color: '#fff' },

    // ─── Toast ───────────────────────────────────────────────────────────────
    toast: {
        position:        'absolute',
        top:             10,
        left:            16,
        right:           16,
        zIndex:          999,
        flexDirection:   'row',
        alignItems:      'flex-start',
        borderRadius:    14,
        borderWidth:     1.5,
        overflow:        'hidden',
        shadowColor:     '#000',
        shadowOpacity:   0.12,
        shadowOffset:    { width: 0, height: 4 },
        shadowRadius:    12,
        elevation:       8,
    },
    toastAccent:        { width: 5, alignSelf: 'stretch' },
    toastIconWrap:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', margin: 12, marginRight: 0 },
    toastBody:          { flex: 1, paddingVertical: 12, paddingHorizontal: 10 },
    toastTitle:         { fontSize: 13, fontWeight: '800', marginBottom: 2 },
    toastMessage:       { fontSize: 12, lineHeight: 17, fontWeight: '500' },
    toastAction:        { marginTop: 8, alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    toastActionText:    { fontSize: 12, fontWeight: '700' },
    toastClose:         { padding: 10, paddingTop: 12 },

    // ─── Form ─────────────────────────────────────────────────────────────────
    content:            { flex: 1 },
    form:               { padding: 20 },
    fieldGroup:         { marginBottom: 20 },
    label:              { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
    inputContainer:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
    inputError:         { borderColor: COLORS.error },
    input:              { flex: 1, height: 50, fontSize: FONTS.md, color: COLORS.textPrimary, marginLeft: 12 },
    textArea:           { height: 80, paddingTop: 12, textAlignVertical: 'top' },
    row:                { flexDirection: 'row', gap: 12 },
    halfInput:          { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
    errorText:          { fontSize: FONTS.xs, color: COLORS.error, marginTop: 4, marginLeft: 4 },
    hint:               { fontSize: FONTS.xs, color: COLORS.textSecondary, marginTop: 6, fontStyle: 'italic' },
    checkboxContainer:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    checkbox:           { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    checkboxActive:     { backgroundColor: COLORS.roles.admin.color, borderColor: COLORS.roles.admin.color },
    checkboxLabel:      { fontSize: FONTS.md, color: COLORS.textPrimary, fontWeight: '600' },
    footer:             { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
    submitBtn:          { borderRadius: RADIUS.md, overflow: 'hidden' },
    submitBtnDisabled:  { opacity: 0.6 },
    submitBtnGradient:  { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    submitBtnText:      { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
    infoMessage:        { fontSize: FONTS.xs, color: COLORS.info, marginTop: 6, fontStyle: 'italic', backgroundColor: COLORS.infoBg, padding: 8, borderRadius: 6 },
});