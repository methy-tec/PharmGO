// ============================================
// 💊 ÉCRAN GESTION PRODUITS (MANAGER)
// src/screens/manager/ManagerProductsScreen.js
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ManagerService from '../../services/ManagerService';
import AddProductModal from './AddProductModal';
import EditProductFormModal from './EditProductModal';
import UpdateStockFormModal from './UpdateStockFormModal';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

import Toast from '../../components/Toast';
import DeleteModal from '../../components/DeleteModal';


export default function ManagerProductsScreen({ navigation, embedded = false, onClose }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modals intégrés (pour mode embedded où navigation n'est pas dispo)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // MOdal pour supprimer
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast pour notifications
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message, duration: 4000 });
  };

  useEffect(() => {
    loadProducts();
  }, [filterLowStock]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await ManagerService.getProducts({
        search: searchQuery,
        lowStock: filterLowStock
      });
      setProducts(response.data.pharmacyProducts || []);
    } catch (error) {
      console.error('Erreur loadProducts:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleSearch = () => loadProducts();

  const handleDelete = (product) => {
    setProductToDelete(product);
    setDeleteModalVisible(true);
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await ManagerService.deleteProduct(productToDelete.id);
      
      setDeleteModalVisible(false);
      setProductToDelete(null);

      showToast('success', '✅Success', 'Produit supprimé avec sucès');

      loadProducts();
    } catch (error) {

      showToast('error', '❌Erreur', error.message || 'Impossible de supprimer le produit');
    } finally {
      setDeleting(false);
    }
  };

  // Navigation adaptée selon le mode
  const handleAddProduct = () => {
      setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
      setSelectedProduct(product);
      setShowEditModal(true);
  };

  const handleUpdateStock = (product) => {
    if (embedded) {
      setSelectedProduct(product);
      setShowStockModal(true);
    } else {
      navigation.navigate('UpdateStock', { product });
    }
  };

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { label: 'Rupture', color: COLORS.error };
    if (product.quantity <= product.minQuantityAlert) return { label: 'Stock bas', color: COLORS.warning };
    return { label: 'En stock', color: COLORS.success };
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.roles.pharmacy.color} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
        <View style={styles.embeddedHeader}>
          <Text style={styles.embeddedTitle}>💊 Mes Produits</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.addBtnEmbedded} onPress={handleAddProduct}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtnEmbedded} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

      {/* ── BARRE DE RECHERCHE ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); loadProducts(); }}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, filterLowStock && styles.filterBtnActive]}
          onPress={() => setFilterLowStock(!filterLowStock)}
        >
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={filterLowStock ? '#fff' : COLORS.warning}
          />
          <Text style={[styles.filterBtnText, filterLowStock && styles.filterBtnTextActive]}>
            Stock bas
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LISTE PRODUITS ── */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.countText}>
          {products.length} produit{products.length > 1 ? 's' : ''}
        </Text>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyTitle}>Aucun produit</Text>
            <Text style={styles.emptyText}>Commencez par ajouter vos premiers produits</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleAddProduct}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.emptyBtnText}>Ajouter un produit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          products.map((product) => {
            const status = getStockStatus(product);
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.product?.name}</Text>
                    <Text style={styles.productCategory}>{product.product?.category}</Text>
                    {product.product?.manufacturer && (
                      <Text style={styles.productMeta}>📦 {product.product.manufacturer}</Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.productDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="cube-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.detailText}>Stock : {product.quantity}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="cash-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.detailText}>{product.price?.toLocaleString()} FCFA</Text>
                    </View>
                  </View>
                  {product.expiryDate && (
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.detailText}>
                        Exp: {new Date(product.expiryDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnStock]}
                    onPress={() => handleUpdateStock(product)}
                  >
                    <Ionicons name="cube" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnEdit]}
                    onPress={() => handleEditProduct(product)}
                  >
                    <Ionicons name="create-outline" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDelete]}
                    onPress={() => handleDelete(product)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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

      
      <AddProductModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadProducts();
        }}
      />

      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {setShowEditModal(false); setSelectedProduct(null);} }
      >
        <EditProductFormModal
          product={selectedProduct}
          onSuccess={() => { setShowEditModal(false); setSelectedProduct(null); loadProducts(); }}
          onCancel={() => { setShowEditModal(false); setSelectedProduct(null); }}
          onClose={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        visible={showStockModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {setShowStockModal(false); setSelectedProduct(null);} }
        >

        <UpdateStockFormModal
          product={selectedProduct}
          onClose={() => setShowStockModal(false)}
          onSuccess={() => { setShowStockModal(false); setSelectedProduct(null); loadProducts(); }}
          onCancel={() => { setShowStockModal(false); setSelectedProduct(null); }}
        />
      </Modal>

      <DeleteModal
        visible={deleteModalVisible}
        title='Supprimer le produit'
        message="Voulez-vous vraiment supprimer ce produit ?"
        itemName={productToDelete?.name}
        loading={deleting}
        onCancel={() => {
          setDeleteModalVisible(false);
          setProductToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: FONTS.md, color: COLORS.textSecondary },

  // Header navigation normale
  header: { paddingTop: 50, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.xl, fontWeight: '800', color: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Header mode embedded
  embeddedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  embeddedTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary },
  addBtnEmbedded: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.roles.pharmacy.color, alignItems: 'center', justifyContent: 'center' },
  closeBtnEmbedded: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },

  // Recherche
  searchSection: { padding: 20, flexDirection: 'row', gap: 10 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, height: 45, fontSize: FONTS.md, marginLeft: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
  filterBtnText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.warning },
  filterBtnTextActive: { color: '#fff' },

  // Liste
  content: { flex: 1, paddingHorizontal: 20 },
  countText: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: 12, fontWeight: '600' },
  emptyState: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: FONTS.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.roles.pharmacy.color, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md },
  emptyBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
  productCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  productCategory: { fontSize: FONTS.sm, color: COLORS.roles.pharmacy.color, fontWeight: '600', marginBottom: 2 },
  productMeta: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, alignSelf: 'flex-start' },
  statusText: { fontSize: FONTS.xs, fontWeight: '700' },
  productDetails: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  detailText: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  productActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md },
  actionBtnStock: { backgroundColor: COLORS.info },
  actionBtnEdit: { backgroundColor: COLORS.roles.pharmacy.color },
  actionBtnDelete: { backgroundColor: COLORS.error, flex: 0, paddingHorizontal: 16 },
  actionBtnText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },

  // Modals internes
  innerModal: { flex: 1, backgroundColor: COLORS.background },
  innerModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  innerModalTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary },

  // Stock form
  stockCurrentBadge: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  stockCurrentLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: 4 },
  stockCurrentValue: { fontSize: 40, fontWeight: '800', color: COLORS.textPrimary },
  operationRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  operationBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: '#fff' },
  operationBtnText: { fontSize: FONTS.xs, fontWeight: '700', color: COLORS.textSecondary },
});