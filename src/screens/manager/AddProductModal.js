// ============================================
// 💊 MODAL AJOUT PRODUIT (MANAGER)
// src/screens/manager/AddProductModal.js
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ManagerService from '../../services/ManagerService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import Toast from '../../components/Toast';

const CATEGORIES = [
  'Analgésiques',
  'Antibiotiques',
  'Antihistaminiques',
  'Antihypertenseurs',
  'Antidiabétiques',
  'Vitamines',
  'Suppléments',
  'Dermatologie',
  'Gastro-entérologie',
  'Cardiologie',
  'Autre'
];

export default function AddProductModal({ visible, onClose, onSuccess}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Product
    name: '',
    description: '',
    barcode: '',
    category: '',
    manufacturer: '',
    requiresPrescription: false,
    
    // PharmacyProduct
    price: '',
    originalPrice: '',
    quantity: '',
    minQuantityAlert: '10',
    expiryDate: '',
    batchNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [showCategories, setShowCategories] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) => {
    setToast({ type, title, message, duration: 4000 });
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nom requis';
    if (!formData.category) newErrors.category = 'Catégorie requise';
    if (!formData.price) newErrors.price = 'Prix requis';
    if (!formData.quantity) newErrors.quantity = 'Quantité requise';

    if (formData.price && (isNaN(formData.price) || parseFloat(formData.price) <= 0)) {
      newErrors.price = 'Prix invalide';
    }

    if (formData.quantity && (isNaN(formData.quantity) || parseInt(formData.quantity) < 0)) {
      newErrors.quantity = 'Quantité invalide';
    }

    if (Object.keys(newErrors).length > 0) {
      showToast('error', 'Erreur', 'Veuillez remplir tous les champs requis');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const productData = {
        // Product
        name: formData.name,
        description: formData.description || null,
        barcode: formData.barcode || null,
        category: formData.category,
        manufacturer: formData.manufacturer || null,
        requiresPrescription: formData.requiresPrescription,
        
        // PharmacyProduct
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        quantity: parseInt(formData.quantity),
        minQuantityAlert: formData.minQuantityAlert ? parseInt(formData.minQuantityAlert) : 10,
        expiryDate: formData.expiryDate || null,
        batchNumber: formData.batchNumber || null
      };

      const response = await ManagerService.createProduct(productData);

      if (response.success) {
        showToast('success', '✅ Produit créé !', `${formData.name} a été ajouté avec succès.`);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 800);
      }
    } catch (error) {
      console.error('Erreur création produit:', error);
      showToast('error', 'Erreur', error.message || 'Impossible de créer le produit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      barcode: '',
      category: '',
      manufacturer: '',
      requiresPrescription: false,
      price: '',
      originalPrice: '',
      quantity: '',
      minQuantityAlert: '10',
      expiryDate: '',
      batchNumber: ''
    });
    onClose();
    setErrors({});
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
        {/* HEADER */}
        <LinearGradient colors={['#ff9500', '#ff8000']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nouveau Produit</Text>
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
            
            {/* SECTION PRODUIT */}
            <Text style={styles.sectionTitle}>Informations du produit</Text>

            {/* Nom */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom du médicament *</Text>
              <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                <Ionicons name="medical-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Paracétamol 500mg"
                  placeholderTextColor="#666"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Catégorie */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Catégorie *</Text>
              <TouchableOpacity
                style={[styles.inputContainer, errors.category && styles.inputError]}
                onPress={() => setShowCategories(!showCategories)}
              >
                <Ionicons name="folder-outline" size={20} color={COLORS.textSecondary} />
                <Text style={[styles.input, !formData.category && styles.placeholder]}>
                  {formData.category || 'Sélectionner une catégorie'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              
              {showCategories && (
                <View style={styles.categoryList}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.categoryOption}
                      onPress={() => {
                        updateField('category', cat);
                        setShowCategories(false);
                      }}
                    >
                      <Text style={styles.categoryText}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description du produit"
                  placeholderTextColor="#666"
                  value={formData.description}
                  onChangeText={(text) => updateField('description', text)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Code-barres */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Code-barres (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="barcode-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 3700123456789"
                  placeholderTextColor="#666"
                  value={formData.barcode}
                  onChangeText={(text) => updateField('barcode', text)}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Fabricant */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Fabricant (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Pfizer"
                  placeholderTextColor="#666"
                  value={formData.manufacturer}
                  onChangeText={(text) => updateField('manufacturer', text)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Ordonnance requise */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => updateField('requiresPrescription', !formData.requiresPrescription)}
            >
              <View style={[styles.checkbox, formData.requiresPrescription && styles.checkboxActive]}>
                {formData.requiresPrescription && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Ordonnance requise</Text>
            </TouchableOpacity>

            {/* SECTION STOCK */}
            <Text style={styles.sectionTitle}>Stock et prix</Text>

            {/* Prix */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prix de vente (FCFA) *</Text>
              <View style={[styles.inputContainer, errors.price && styles.inputError]}>
                <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 5000"
                  placeholderTextColor="#666"
                  value={formData.price}
                  onChangeText={(text) => updateField('price', text)}
                  keyboardType="number-pad"
                />
              </View>
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            {/* Prix original (optionnel) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Prix original (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 6000"
                  placeholderTextColor="#666"
                  value={formData.originalPrice}
                  onChangeText={(text) => updateField('originalPrice', text)}
                  keyboardType="number-pad"
                />
              </View>
              <Text style={styles.hint}>💡 Pour afficher une réduction</Text>
            </View>

            {/* Quantité */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Quantité en stock *</Text>
              <View style={[styles.inputContainer, errors.quantity && styles.inputError]}>
                <Ionicons name="cube-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 100"
                  placeholderTextColor="#666"
                  value={formData.quantity}
                  onChangeText={(text) => updateField('quantity', text)}
                  keyboardType="number-pad"
                />
              </View>
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>

            {/* Alerte stock */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Alerte stock bas (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 10"
                  value={formData.minQuantityAlert}
                  onChangeText={(text) => updateField('minQuantityAlert', text)}
                  keyboardType="number-pad"
                />
              </View>
              <Text style={styles.hint}>⚠️ Alerte si stock ≤ cette valeur</Text>
            </View>

            {/* Date d'expiration */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date d'expiration (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD (ex: 2025-12-31)"
                  placeholderTextColor="#666"
                  value={formData.expiryDate}
                  onChangeText={(text) => updateField('expiryDate', text)}
                />
              </View>
            </View>

            {/* Numéro de lot */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Numéro de lot (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="layers-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: BATCH-2025-001"
                  placeholderTextColor="#666"
                  value={formData.batchNumber}
                  onChangeText={(text) => updateField('batchNumber', text)}
                />
              </View>
            </View>

          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {toast && (
          <Toast
            toast={toast}
            onDismiss={() => setToast(null)}
          />
        )}

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
                  <Text style={styles.submitBtnText}>Créer le produit</Text>
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
  sectionTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginTop: 20, marginBottom: 16 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, height: 50, fontSize: FONTS.md, color: COLORS.textPrimary, marginLeft: 12 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  placeholder: { color: COLORS.textSecondary },
  errorText: { fontSize: FONTS.xs, color: COLORS.error, marginTop: 4, marginLeft: 4 },
  hint: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginTop: 6, fontStyle: 'italic' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: COLORS.roles.pharmacy.color, borderColor: COLORS.roles.pharmacy.color },
  checkboxLabel: { fontSize: FONTS.md, color: COLORS.textPrimary, fontWeight: '600' },
  categoryList: { backgroundColor: '#fff', borderRadius: RADIUS.md, marginTop: 8, borderWidth: 1, borderColor: COLORS.border },
  categoryOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  categoryText: { fontSize: FONTS.md, color: COLORS.textPrimary },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  submitBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGradient: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' }
});