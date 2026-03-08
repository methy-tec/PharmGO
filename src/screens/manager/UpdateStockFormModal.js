import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ManagerService from '../../services/ManagerService';
import Toast from '../../components/Toast';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

const OPERATIONS = [
  { key: 'add',      label: '➕ Ajouter', color: COLORS.success },
  { key: 'subtract', label: '➖ Retirer', color: COLORS.warning },
  { key: 'set',      label: '🎯 Définir', color: COLORS.info },
];

export default function UpdateStockFormModal({ product, onSuccess, onCancel }) {
  if (!product) return null;

  const [quantity,  setQuantity]  = useState('');
  const [operation, setOperation] = useState('add');
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (type, title, message) =>
    setToast({ type, title, message, duration: 4000 });

  // Calcul prévisualisation
  const preview = () => {
    const q = parseInt(quantity) || 0;
    const current = product.quantity || 0;
    if (operation === 'add')      return current + q;
    if (operation === 'subtract') return Math.max(0, current - q);
    if (operation === 'set')      return q;
    return current;
  };

  const handleSubmit = async () => {
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 0) {
      showToast('error', '❌ Erreur', 'Veuillez entrer une quantité valide');
      return;
    }
    try {
      setSaving(true);
      await ManagerService.updateStock(product.id, {   // ← fix: 'form' → objet correct
        quantity: parseInt(quantity),
        operation
      });
      showToast('success', '✅ Succès', 'Stock mis à jour avec succès');
      setTimeout(() => { onSuccess(); }, 1500);
    } catch (error) {
      showToast('error', '❌ Erreur', error.message || 'Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const selectedOp = OPERATIONS.find(o => o.key === operation);

  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
      <LinearGradient colors={['#007aff', '#0055cc']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="cube" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Mettre à jour le stock</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {product.product?.name}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── STOCK ACTUEL vs APERÇU ── */}
        <View style={styles.stockBadge}>
          <View style={styles.stockItem}>
            <Ionicons name="cube-outline" size={20} color={COLORS.info} />
            <Text style={styles.stockLabel}>Stock actuel</Text>
            <Text style={styles.stockValue}>{product.quantity}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
          </View>
          <View style={styles.stockItem}>
            <Ionicons
              name="cube"
              size={20}
              color={selectedOp?.color || COLORS.textSecondary}
            />
            <Text style={styles.stockLabel}>Après modification</Text>
            <Text style={[styles.stockValue, { color: selectedOp?.color }]}>
              {quantity ? preview() : '—'}
            </Text>
          </View>
        </View>

        {/* ── OPÉRATION ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Opération</Text>
          <View style={styles.operationRow}>
            {OPERATIONS.map(op => (
              <TouchableOpacity
                key={op.key}
                style={[
                  styles.operationBtn,
                  operation === op.key && { backgroundColor: op.color, borderColor: op.color }
                ]}
                onPress={() => setOperation(op.key)}
              >
                <Text style={[
                  styles.operationBtnText,
                  operation === op.key && { color: '#fff' }
                ]}>
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── QUANTITÉ ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Quantité</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputIcon}>
              <Ionicons name="layers-outline" size={18} color="#007aff" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50"
              placeholderTextColor={COLORS.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
          <Ionicons name="close-circle-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
          <LinearGradient colors={['#007aff', '#0055cc']} style={styles.submitGradient}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Confirmer</Text>
                </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: { paddingTop: 16, paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.md, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Stock badge
  stockBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  stockItem: { flex: 1, alignItems: 'center', gap: 6 },
  arrowContainer: { paddingHorizontal: 8 },
  stockLabel: { fontSize: FONTS.xs, color: COLORS.textSecondary, fontWeight: '600' },
  stockValue: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.textPrimary },

  // Opérations
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  operationRow: { flexDirection: 'row', gap: 8 },
  operationBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', backgroundColor: '#fff' },
  operationBtnText: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textSecondary },

  // Input
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  inputIcon: { width: 46, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: COLORS.border, paddingVertical: 14 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: FONTS.xl, fontWeight: '700', color: COLORS.textPrimary },

  // Footer
  footer: { flexDirection: 'row', gap: 12, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  cancelBtnText: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textSecondary },
  submitBtn: { flex: 2, borderRadius: RADIUS.md, overflow: 'hidden' },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitBtnText: { fontSize: FONTS.md, fontWeight: '800', color: '#fff' },
});