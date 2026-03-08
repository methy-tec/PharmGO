// ============================================
// 🏥 MODAL MODIFICATION PHARMACIE (MANAGER)
// src/screens/manager/EditPharmacyModal.js
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ManagerService from '../services/ManagerService';
import Toast from './Toast';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

export default function EditPharmacyModal({ visible, onClose, onSuccess, pharmacy }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    deliveryAvailable: false,
    deliveryRadius: '',
    deliveryFee: ''
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) => {
    setToast({ type, title, message, duration: 4000 });
  };

  // Charger les données de la pharmacie
  useEffect(() => {
    if (pharmacy && visible) {
      setFormData({
        name: pharmacy.name || '',
        description: pharmacy.description || '',
        address: pharmacy.address || '',
        city: pharmacy.city || '',
        phone: pharmacy.phone || '',
        email: pharmacy.email || '',
        latitude: pharmacy.latitude?.toString() || '',
        longitude: pharmacy.longitude?.toString() || '',
        deliveryAvailable: pharmacy.deliveryAvailable || false,
        deliveryRadius: pharmacy.deliveryRadius?.toString() || '',
        deliveryFee: pharmacy.deliveryFee?.toString() || ''
      });
    }
  }, [pharmacy, visible]);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (!formData.address.trim()) newErrors.address = 'Adresse requise';
    if (!formData.city.trim()) newErrors.city = 'Ville requise';
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Téléphone requis';
    } else if (!/^\+?[0-9]{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro invalide';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('error', 'Erreur', 'Veuillez vérifier les champs requis');
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        deliveryAvailable: formData.deliveryAvailable,
        deliveryRadius: formData.deliveryRadius ? parseInt(formData.deliveryRadius) : null,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : null
      };

      const response = await ManagerService.updatePharmacyInfo(updateData);

      if (response.success) {
        showToast('success', '✅ Mis à jour !', 'Les informations de la pharmacie ont été mises à jour.');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      showToast('error', 'Erreur', error.message || 'Impossible de mettre à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!pharmacy) return null;

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
        {/* HEADER */}
        <LinearGradient colors={['#ff9500', '#ff8000']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Modifier la pharmacie</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        {/* FORMULAIRE */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            
            {/* Infos non modifiables */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>
                  Vous ne pouvez pas modifier : Licence, Propriétaire, Abonnement
                </Text>
                <Text style={styles.infoMeta}>
                  🔑 Licence : {pharmacy.license}
                </Text>
              </View>
            </View>

            {/* Nom */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom de la pharmacie *</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <Ionicons name="medkit-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Pharmacie Centrale"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description de la pharmacie"
                  value={formData.description}
                  onChangeText={(text) => updateField('description', text)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Adresse */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Adresse *</Text>
              <View style={[styles.inputContainer, errors.address && styles.inputError]}>
                <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 123 Rue de la Paix"
                  value={formData.address}
                  onChangeText={(text) => updateField('address', text)}
                />
              </View>
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* Ville */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ville *</Text>
              <View style={[styles.inputContainer, errors.city && styles.inputError]}>
                <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Brazzaville"
                  value={formData.city}
                  onChangeText={(text) => updateField('city', text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>

            {/* Téléphone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Téléphone *</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="+242 123 456 789"
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email (optionnel)</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="contact@pharmacie.com"
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Coordonnées GPS */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Coordonnées GPS (optionnel)</Text>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Ionicons name="navigate-outline" size={20} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Latitude"
                    value={formData.latitude}
                    onChangeText={(text) => updateField('latitude', text)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Ionicons name="navigate-outline" size={20} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Longitude"
                    value={formData.longitude}
                    onChangeText={(text) => updateField('longitude', text)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Livraison */}
            <View style={styles.fieldGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => updateField('deliveryAvailable', !formData.deliveryAvailable)}
              >
                <View style={[styles.checkbox, formData.deliveryAvailable && styles.checkboxActive]}>
                  {formData.deliveryAvailable && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Livraison disponible</Text>
              </TouchableOpacity>

              {formData.deliveryAvailable && (
                <>
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={styles.input}
                        placeholder="Rayon (km)"
                        value={formData.deliveryRadius}
                        onChangeText={(text) => updateField('deliveryRadius', text)}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={styles.input}
                        placeholder="Frais (FCFA)"
                        value={formData.deliveryFee}
                        onChangeText={(text) => updateField('deliveryFee', text)}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </>
              )}
            </View>

          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
        {
          toast && <Toast 
           toast={toast}
           onDismiss={() => setToast(null)}
          />
        }

        {/* BOUTON SUBMIT */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={['#ff9500', '#ff8000']}
              style={styles.submitBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.submitBtnText}>Enregistrer les modifications</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.xl, fontWeight: '800', color: '#fff' },
  content: { flex: 1 },
  form: { padding: 20 },
  infoBox: { flexDirection: 'row', backgroundColor: COLORS.infoBg, padding: 12, borderRadius: RADIUS.md, marginBottom: 20, gap: 10 },
  infoTextContainer: { flex: 1 },
  infoText: { fontSize: FONTS.sm, color: COLORS.info, fontWeight: '600', marginBottom: 4 },
  infoMeta: { fontSize: FONTS.xs, color: COLORS.info },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, height: 50, fontSize: FONTS.md, color: COLORS.textPrimary, marginLeft: 12 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  errorText: { fontSize: FONTS.xs, color: COLORS.error, marginTop: 4, marginLeft: 4 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: COLORS.roles.pharmacy.color, borderColor: COLORS.roles.pharmacy.color },
  checkboxLabel: { fontSize: FONTS.md, color: COLORS.textPrimary, fontWeight: '600' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  submitBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGradient: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' }
});