// ============================================
// 🛒 MODAL NOUVELLE VENTE (TRAVAILLEUR)
// src/screens/worker/NewSaleModal.js
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
import WorkerService from '../services/WorkerService';
import Toast from './Toast';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces', icon: 'cash' }
];

export default function NewSaleModal({ visible, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Client, 2: Produits, 3: Paiement
  
  // Client
  const [customerMode, setCustomerMode] = useState('with'); // 'with' | 'without'
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  
  // Produits
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cart, setCart] = useState([]);
  
  // Paiement
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) => {
    setToast({ type, title, message, duration: 4000 });
  };

  useEffect(() => {
    if (visible && step === 2) {
      loadProducts();
    }
  }, [visible, step, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await WorkerService.getProducts({ search: searchQuery });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erreur loadProducts:', error);
      showToast('error', '❌ Erreur', error.message || 'Erreur réseau');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearchCustomer = async () => {
    if (!customerEmail.trim()) {
      showToast('error', '❌ Erreur', 'Entrez l\'email du client');
      return;
    }

    try {
      setSearchingCustomer(true);
      const response = await WorkerService.searchCustomer(customerEmail);
      setCustomerData(response.data.customer);
      showToast('success', '✅ Client trouvé', `${response.data.customer.firstName} ${response.data.customer.lastName}`);
    } catch (error) {
      console.error('Erreur searchCustomer:', error);
      showToast('error', '❌ Client non trouvé', error.message || 'Aucun compte avec cet email');
      setCustomerData(null);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Validation client
      if (customerMode === 'with' && !customerData) {
        showToast('error', '❌ Client requis', 'Recherchez un client ou passez en mode invité');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validation panier
      if (cart.length === 0) {
        showToast('error', '❌ Panier vide', 'Ajoutez au moins un produit');
        return;
      }
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      if (existing.quantity >= product.quantity) {
        showToast('error', '❌ Stock insuffisant', `Maximum disponible: ${product.quantity}`);
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.product.name,
        price: product.price,
        maxQuantity: product.quantity,
        quantity: 1
      }]);
    }
  };

  const updateCartQuantity = (productId, quantity) => {
    const product = cart.find(item => item.id === productId);
    
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else if (quantity > product.maxQuantity) {
      showToast('error', '❌ Stock insuffisant', `Maximum: ${product.maxQuantity}`);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmitSale = async () => {
    if (!paymentMethod) {
      showToast('error', '❌ Erreur', 'Sélectionnez une méthode de paiement');
      return;
    }

    try {
      setSubmitting(true);

      const saleData = {
        items: cart.map(item => ({
          pharmacyProductId: item.id,
          quantity: item.quantity
        })),
        paymentMethod,
        notes: notes.trim() || null
      };

      // Ajouter les infos client selon le mode
      if (customerMode === 'with' && customerData) {
        saleData.customerEmail = customerData.email;
      } else if (customerMode === 'without') {
        saleData.customerName = guestName.trim() || 'Client sans compte';
        saleData.customerPhone = guestPhone.trim() || null;
      }

      const response = await WorkerService.createSale(saleData);

      if (response.success) {
        showToast('success', '✅ Vente enregistrée !', `Montant total: ${getTotalAmount().toLocaleString()} FCFA`);
        setTimeout(() => { onSuccess(); onClose(); }, 1500);
      }
    } catch (error) {
      console.error('Erreur submitSale:', error);
      showToast('error', '❌ Erreur', error.message || 'Impossible d\'enregistrer la vente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCustomerMode('with');
    setCustomerEmail('');
    setCustomerData(null);
    setGuestName('');
    setGuestPhone('');
    setSearchQuery('');
    setCart([]);
    setPaymentMethod('cash');
    setNotes('');
    onClose();
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
        <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Nouvelle Vente</Text>
              <Text style={styles.headerStep}>Étape {step}/3</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* INDICATEURS D'ÉTAPES */}
          <View style={styles.stepsIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
            </View>
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
            </View>
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 3 && styles.stepDotTextActive]}>3</Text>
            </View>
          </View>
        </LinearGradient>

        {/* CONTENU */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ÉTAPE 1 : CLIENT */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>👤 Informations client</Text>

              {/* MODE CLIENT */}
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeBtn, customerMode === 'with' && styles.modeBtnActive]}
                  onPress={() => setCustomerMode('with')}
                >
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={customerMode === 'with' ? '#fff' : COLORS.info} 
                  />
                  <Text style={[styles.modeBtnText, customerMode === 'with' && styles.modeBtnTextActive]}>
                    Avec compte
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, customerMode === 'without' && styles.modeBtnActive]}
                  onPress={() => setCustomerMode('without')}
                >
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={customerMode === 'without' ? '#fff' : COLORS.textSecondary} 
                  />
                  <Text style={[styles.modeBtnText, customerMode === 'without' && styles.modeBtnTextActive]}>
                    Client invité
                  </Text>
                </TouchableOpacity>
              </View>

              {customerMode === 'with' ? (
                <View>
                  <Text style={styles.label}>Email du client</Text>
                  <View style={styles.searchContainer}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={styles.input}
                        placeholder="client@exemple.com"
                        value={customerEmail}
                        onChangeText={setCustomerEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.searchBtn}
                      onPress={handleSearchCustomer}
                      disabled={searchingCustomer}
                    >
                      {searchingCustomer ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons name="search" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {customerData && (
                    <View style={styles.customerCard}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                      <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>
                          {customerData.firstName} {customerData.lastName}
                        </Text>
                        <Text style={styles.customerMeta}>{customerData.email}</Text>
                        {customerData.phone && (
                          <Text style={styles.customerMeta}>📞 {customerData.phone}</Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Nom (optionnel)</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: Jean Dupont"
                        value={guestName}
                        onChangeText={setGuestName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Téléphone (optionnel)</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
                      <TextInput
                        style={styles.input}
                        placeholder="+242 123 456 789"
                        value={guestPhone}
                        onChangeText={setGuestPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ÉTAPE 2 : PRODUITS */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>🛒 Sélection des produits</Text>

              {/* RECHERCHE */}
              <View style={styles.inputContainer}>
                <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* PANIER */}
              {cart.length > 0 && (
                <View style={styles.cartSection}>
                  <Text style={styles.cartTitle}>Panier ({cart.length})</Text>
                  {cart.map((item) => (
                    <View key={item.id} style={styles.cartItem}>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemPrice}>
                          {item.price.toLocaleString()} FCFA × {item.quantity}
                        </Text>
                      </View>
                      <View style={styles.cartItemActions}>
                        <TouchableOpacity
                          style={styles.cartBtn}
                          onPress={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          <Ionicons name="remove" size={16} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.cartQuantity}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.cartBtn}
                          onPress={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          <Ionicons name="add" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cartBtn, styles.cartBtnDelete]}
                          onPress={() => removeFromCart(item.id)}
                        >
                          <Ionicons name="trash" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <View style={styles.cartTotal}>
                    <Text style={styles.cartTotalLabel}>Total</Text>
                    <Text style={styles.cartTotalValue}>
                      {getTotalAmount().toLocaleString()} FCFA
                    </Text>
                  </View>
                </View>
              )}

              {/* LISTE PRODUITS */}
              <Text style={styles.productsTitle}>Produits disponibles</Text>
              {loadingProducts ? (
                <ActivityIndicator color={COLORS.info} style={{ marginTop: 20 }} />
              ) : products.length === 0 ? (
                <Text style={styles.emptyText}>Aucun produit trouvé</Text>
              ) : (
                products.map((product) => (
                  <View key={product.id} style={styles.productCard}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.product.name}</Text>
                      <Text style={styles.productCategory}>{product.product.category}</Text>
                      <Text style={styles.productPrice}>
                        {product.price.toLocaleString()} FCFA
                      </Text>
                      <Text style={styles.productStock}>
                        Stock: {product.quantity}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => addToCart(product)}
                    >
                      <Ionicons name="add-circle" size={32} color={COLORS.success} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ÉTAPE 3 : PAIEMENT */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>💳 Paiement</Text>

              {/* RÉCAPITULATIF */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Récapitulatif</Text>
                {customerMode === 'with' && customerData && (
                  <Text style={styles.summaryText}>
                    Client: {customerData.firstName} {customerData.lastName}
                  </Text>
                )}
                {customerMode === 'without' && guestName && (
                  <Text style={styles.summaryText}>Client: {guestName}</Text>
                )}
                <Text style={styles.summaryText}>Produits: {cart.length}</Text>
                <Text style={styles.summaryTotal}>
                  Total: {getTotalAmount().toLocaleString()} FCFA
                </Text>
              </View>

              {/* MÉTHODE DE PAIEMENT */}
              <Text style={styles.label}>Méthode de paiement</Text>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.paymentOption,
                    paymentMethod === method.value && styles.paymentOptionActive
                  ]}
                  onPress={() => setPaymentMethod(method.value)}
                >
                  <Ionicons 
                    name={method.icon} 
                    size={24} 
                    color={paymentMethod === method.value ? COLORS.info : COLORS.textSecondary} 
                  />
                  <Text style={[
                    styles.paymentLabel,
                    paymentMethod === method.value && styles.paymentLabelActive
                  ]}>
                    {method.label}
                  </Text>
                  {paymentMethod === method.value && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.info} />
                  )}
                </TouchableOpacity>
              ))}

              {/* NOTES */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Notes (optionnel)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Notes additionnelles..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
        {
          toast && (
            <Toast
              toast={toast}
              onDismiss={() => setToast(null)}
            />
          )
        }

        {/* BOUTONS NAVIGATION */}
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={handlePreviousStep}>
              <Ionicons name="arrow-back" size={20} color={COLORS.info} />
              <Text style={styles.backBtnText}>Retour</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.nextBtn, (step === 1 || submitting) && styles.nextBtnDisabled]}
            onPress={step === 3 ? handleSubmitSale : handleNextStep}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.nextBtnGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {step === 3 ? 'Valider la vente' : 'Suivant'}
                  </Text>
                  <Ionicons name={step === 3 ? 'checkmark' : 'arrow-forward'} size={20} color="#fff" />
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
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: FONTS.xl, fontWeight: '800', color: '#fff' },
  headerStep: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  stepsIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#fff' },
  stepDotText: { fontSize: FONTS.sm, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  stepDotTextActive: { color: COLORS.info },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#fff' },
  content: { flex: 1 },
  stepContent: { padding: 20 },
  stepTitle: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 20 },
  modeSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.border },
  modeBtnActive: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  modeBtnText: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textSecondary },
  modeBtnTextActive: { color: '#fff' },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  searchContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  input: { flex: 1, height: 50, fontSize: FONTS.md, color: COLORS.textPrimary, marginLeft: 12 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  searchBtn: { width: 50, height: 50, borderRadius: RADIUS.md, backgroundColor: COLORS.info, alignItems: 'center', justifyContent: 'center' },
  customerCard: { flexDirection: 'row', backgroundColor: COLORS.successBg, borderRadius: RADIUS.md, padding: SPACING.md, gap: 12 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.success, marginBottom: 4 },
  customerMeta: { fontSize: FONTS.sm, color: COLORS.success },
  fieldGroup: { marginBottom: 16 },
  cartSection: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 20 },
  cartTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  cartItemPrice: { fontSize: FONTS.xs, color: COLORS.textSecondary },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.info, alignItems: 'center', justifyContent: 'center' },
  cartBtnDelete: { backgroundColor: COLORS.error },
  cartQuantity: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, minWidth: 24, textAlign: 'center' },
  cartTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: COLORS.border },
  cartTotalLabel: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary },
  cartTotalValue: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.success },
  productsTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  emptyText: { fontSize: FONTS.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 },
  productCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  productInfo: { flex: 1 },
  productName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  productCategory: { fontSize: FONTS.xs, color: COLORS.info, marginBottom: 4 },
  productPrice: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.success, marginBottom: 2 },
  productStock: { fontSize: FONTS.xs, color: COLORS.textSecondary },
  addBtn: { justifyContent: 'center', alignItems: 'center', paddingLeft: 12 },
  summaryCard: { backgroundColor: COLORS.infoBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 20 },
  summaryTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.info, marginBottom: 8 },
  summaryText: { fontSize: FONTS.sm, color: COLORS.info, marginBottom: 4 },
  summaryTotal: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.info, marginTop: 8 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 12, borderWidth: 2, borderColor: COLORS.border },
  paymentOptionActive: { borderColor: COLORS.info, backgroundColor: COLORS.infoBg },
  paymentLabel: { flex: 1, fontSize: FONTS.md, fontWeight: '600', color: COLORS.textSecondary },
  paymentLabelActive: { color: COLORS.info },
  footer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: RADIUS.md, backgroundColor: COLORS.background },
  backBtnText: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.info },
  nextBtn: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnGradient: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' }
});