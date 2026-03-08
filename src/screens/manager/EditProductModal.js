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

const FIELDS = [
  { key: 'name',             label: 'Nom du produit',   placeholder: 'Ex: Paracétamol 500mg', icon: 'medical-outline' },
  { key: 'category',         label: 'Catégorie',         placeholder: 'Ex: Analgésique',        icon: 'folder-outline' },
  { key: 'manufacturer',     label: 'Fabricant',         placeholder: 'Ex: Pfizer',             icon: 'business-outline' },
  { key: 'price',            label: 'Prix (FCFA)',        placeholder: '0',                      icon: 'cash-outline',         keyboard: 'numeric' },
  { key: 'minQuantityAlert', label: 'Alerte stock bas',  placeholder: '10',                     icon: 'alert-circle-outline', keyboard: 'numeric' },
];

export default function EditProductFormModal({ product, onSuccess, onCancel }) {
  if (!product) return null;

  const [form, setForm] = useState({
    name:             product.product?.name         || '',
    category:         product.product?.category     || '',
    manufacturer:     product.product?.manufacturer || '',
    price:            String(product.price          || ''),
    quantity:         String(product.quantity       || ''),
    minQuantityAlert: String(product.minQuantityAlert || '10'),
    description:      product.product?.description  || '',
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  const showToast = (type, title, message) =>
    setToast({ type, title, message, duration: 4000 });

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await ManagerService.updateProduct(product.id, form);
      showToast('success', '✅ Succès', 'Produit mis à jour avec succès');
      setTimeout(() => { onSuccess(); }, 1500);
    } catch (error) {
      showToast('error', '❌ Erreur', error.message || 'Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
      <LinearGradient colors={['#ff9500', '#ff8000']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="create" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Modifier le produit</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {product.product?.name}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── FORMULAIRE ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Badge stock actuel */}
        <View style={styles.stockBadge}>
          <View style={styles.stockItem}>
            <Ionicons name="cube-outline" size={18} color={COLORS.info} />
            <Text style={styles.stockLabel}>Stock actuel</Text>
            <Text style={styles.stockValue}>{product.quantity}</Text>
          </View>
          <View style={styles.stockDivider} />
          <View style={styles.stockItem}>
            <Ionicons name="cash-outline" size={18} color={COLORS.success} />
            <Text style={styles.stockLabel}>Prix actuel</Text>
            <Text style={styles.stockValue}>{product.price?.toLocaleString()} F</Text>
          </View>
        </View>

        {/* Champs */}
        {FIELDS.map(({ key, label, placeholder, icon, keyboard }) => (
          <View key={key} style={styles.fieldGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIcon}>
                <Ionicons name={icon} size={18} color={COLORS.roles.pharmacy.color} />
              </View>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textSecondary}
                value={form[key]}
                onChangeText={(v) => setForm(prev => ({ ...prev, [key]: v }))}
                keyboardType={keyboard || 'default'}
              />
            </View>
          </View>
        ))}

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputRow, { alignItems: 'flex-start', paddingTop: 12 }]}>
            <View style={styles.inputIcon}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.roles.pharmacy.color} />
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description du produit..."
              placeholderTextColor={COLORS.textSecondary}
              value={form.description}
              onChangeText={(v) => setForm(prev => ({ ...prev, description: v }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── FOOTER ACTIONS ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
          <Ionicons name="close-circle-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
          <LinearGradient colors={['#ff9500', '#ff8000']} style={styles.submitGradient}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Enregistrer</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.md,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Stock badge
  stockBadge: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stockDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  stockLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  stockValue: {
    fontSize: FONTS.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // Champs
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: FONTS.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  inputIcon: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 80,
    paddingTop: 4,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  cancelBtnText: {
    fontSize: FONTS.md,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  submitBtn: {
    flex: 2,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  submitBtnText: {
    fontSize: FONTS.md,
    fontWeight: '800',
    color: '#fff',
  },
});