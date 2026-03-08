// ============================================
// 🏥 DASHBOARD MANAGER (GÉRANT PHARMACIE)
// src/screens/manager/ManagerHomeScreen.js
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ManagerService from '../../services/ManagerService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

import EditMyPharmacyModal from '../../components/EditMyPharmacyModal';
import UpdateOrderStatusModal from '../../components/UpdateOrderSatusModal';
import ManagerProductsScreen from './ManagerProductsScreen';


export default function ManagerScreen({ navigation }) {
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [pharmacy, setPharmacy] = useState(null);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [showProductsModal, setShowProductsModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [pharmacyRes, statsRes, employeesRes, ordersRes, customersRes] = await Promise.all([
        ManagerService.getMyPharmacy(),
        ManagerService.getManagerStats(),
        ManagerService.getEmployees(),
        ManagerService.getOrders(),
        ManagerService.getCustomers()
      ]);

      console.log('🏥 Ma pharmacie:', pharmacyRes);
      
      setPharmacy(pharmacyRes.data.pharmacy);
      setStats(statsRes.data);
      setEmployees(employeesRes.data.employees || []);
      setOrders(ordersRes.data.orders || []);
      setCustomers(customersRes.data.customers || []);

    } catch (error) {
      console.error('❌ Erreur:', error);
      
      if (error.statusCode === 404) {
        Alert.alert(
          'Aucune pharmacie',
          'Vous n\'êtes pas encore assigné à une pharmacie. Contactez votre administrateur.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de charger les données');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowProductsModal = () => {
    setShowProductsModal(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleUpdateOrderStatus = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  }


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.roles.pharmacy.color} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!pharmacy) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏥</Text>
        <Text style={styles.emptyTitle}>Aucune pharmacie</Text>
        <Text style={styles.emptyText}>
          Vous n'êtes pas encore assigné à une pharmacie.{'\n'}
          Contactez votre administrateur.
        </Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={logout}>
          <Text style={styles.emptyBtnText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#ff9500', '#ff8000']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>🏥 Gérant</Text>
            <Text style={styles.headerSubtitle}>Gestion de ma pharmacie</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8}}>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.productsBtn}
              onPress={handleShowProductsModal}
            >
              <Ionicons name="medkit" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.pharmacyName}>
              📍 {pharmacy.name}
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {['stats', 'employees', 'orders', 'customers'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons 
                name={
                  tab === 'stats' ? 'stats-chart' : 
                  tab === 'employees' ? 'people' : 
                  tab === 'orders' ? 'cart' : 'person'
                }
                size={18}
                color={activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Modal Produits */}
<Modal
  visible={showProductsModal}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setShowProductsModal(false)}
>
  <View style={{ flex: 1, backgroundColor: COLORS.background }}>
    {/* Header du modal */}

    {/* Contenu : ton écran produits existant */}
    <ManagerProductsScreen
      embedded={true}
      onClose={() => setShowProductsModal(false)}
    />
  </View>
</Modal>
      </LinearGradient>

      {/* CONTENU */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'stats' && <StatsTab stats={stats} pharmacy={pharmacy} />}
        {activeTab === 'employees' && <EmployeesTab employees={employees} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} onUpdateStatus={handleUpdateOrderStatus} />}
        {activeTab === 'customers' && <CustomersTab customers={customers} />}
        <View style={{ height: 100 }} />
      </ScrollView>

      <EditMyPharmacyModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadDashboardData}
        pharmacy={pharmacy}
      />
      <UpdateOrderStatusModal
        visible={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSuccess={loadDashboardData}
      />


    </View>
  );
}

// =============================================
// ONGLET STATS
// =============================================
function StatsTab({ stats, pharmacy }) {
  if (!stats) {
    return (
      <View style={styles.tabContent}>
        <Text>Chargement des statistiques...</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>

      <View style={styles.pharmacyCard}>
        <View style={styles.pharmacyHeader}>
          <Ionicons name="medkit" size={32} color={COLORS.roles.pharmacy.color} />
          <View style={styles.pharmacyInfo}>
            <Text style={styles.pharmacyCardName}>{pharmacy.name}</Text>
            <Text style={styles.pharmacyCardCity}>📍 {pharmacy.city}</Text>
            <Text style={styles.pharmacyCardLicense}>🔑 {pharmacy.license}</Text>
          </View>
        </View>
        <View style={[
          styles.pharmacyStatus,
          { backgroundColor: pharmacy.isActive ? COLORS.successBg : COLORS.errorBg }
        ]}>
          <Text style={[
            styles.pharmacyStatusText,
            { color: pharmacy.isActive ? COLORS.success : COLORS.error }
          ]}>
            {pharmacy.isActive ? '✅ Active' : '⛔ Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          icon="cart" 
          label="Commandes" 
          value={stats.totalOrders || 0}
          color={COLORS.secondary}
        />
        <StatCard 
          icon="people" 
          label="Clients" 
          value={stats.totalCustomers || 0}
          color={COLORS.primary}
        />
        <StatCard 
          icon="person" 
          label="Employés" 
          value={stats.totalEmployees || 0}
          color={COLORS.info}
        />
        <StatCard 
          icon="cash" 
          label="Revenu" 
          value={stats.totalRevenue || '0 FCFA'}
          color={COLORS.success}
          isText
        />
      </View>
    </View>
  );
}

// =============================================
// ONGLET EMPLOYÉS
// =============================================
function EmployeesTab({ employees }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>👷 Employés ({employees.length})</Text>
      {employees.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👷</Text>
          <Text style={styles.emptyText}>Aucun employé</Text>
        </View>
      ) : (
        employees.map((employee) => (
          <View key={employee.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>
                  {employee.user?.firstName?.[0]}{employee.user?.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  {employee.user?.firstName} {employee.user?.lastName}
                </Text>
                <Text style={styles.cardSubtitle}>{employee.position}</Text>
                <Text style={styles.cardMeta}>{employee.user?.email}</Text>
              </View>
            </View>
            <View style={styles.salaryBadge}>
              <Ionicons name="cash" size={16} color={COLORS.success} />
              <Text style={styles.salaryText}>
                {employee.salary?.toLocaleString()} FCFA / {employee.salaryPeriod}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// =============================================
// ONGLET COMMANDES
// =============================================
function OrdersTab({ orders, onUpdateStatus }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📦 Commandes ({orders.length})</Text>
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Aucune commande</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Commande #{order.id?.slice(0, 8)}</Text>
                <Text style={styles.cardMeta}>
                  Client: {order.customerName || 'N/A'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getOrderStatusColor(order.status) }
              ]}>
                <Text style={styles.statusText}>{getOrderStatusLabel(order.status)}</Text>
              </View>
            </View>
            <Text style={styles.orderAmount}>
              💰 {order.total?.toLocaleString() || 0} FCFA
            </Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onUpdateStatus(order)}
            >
              <Text style={styles.actionBtnText}>Modifier le statut</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

// =============================================
// ONGLET CLIENTS
// =============================================
function CustomersTab({ customers }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>👥 Clients ({customers.length})</Text>
      {customers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>Aucun client</Text>
        </View>
      ) : (
        customers.map((customer) => (
          <View key={customer.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>
                  {customer.firstName?.[0]}{customer.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  {customer.firstName} {customer.lastName}
                </Text>
                <Text style={styles.cardMeta}>{customer.email}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// =============================================
// COMPOSANTS
// =============================================
function StatCard({ icon, label, value, color, isText }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {isText ? value : value?.toLocaleString()}
      </Text>
    </View>
  );
}

function getOrderStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    processing: 'En préparation',
    ready: 'Prête',
    delivered: 'Livrée',
    cancelled: 'Annulée'
  };
  return labels[status] || status;
}

function getOrderStatusColor(status) {
  const colors = {
    pending: COLORS.warningBg,
    processing: COLORS.infoBg,
    ready: COLORS.successBg,
    delivered: COLORS.success,
    cancelled: COLORS.errorBg
  };
  return colors[status] || COLORS.background;
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 16, fontSize: FONTS.md, color: COLORS.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: FONTS.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: COLORS.error, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.md },
  emptyBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.8)' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  userName: { fontSize: FONTS.md, fontWeight: '700', color: '#fff' },
  userEmail: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.8)' },
  pharmacyName: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)', marginTop: 2, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1 },
  tabContent: { padding: 20 },
  sectionTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  pharmacyCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 20 },
  pharmacyHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  pharmacyInfo: { flex: 1 },
  pharmacyCardName: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  pharmacyCardCity: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: 2 },
  pharmacyCardLicense: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  pharmacyStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, alignSelf: 'flex-start' },
  pharmacyStatusText: { fontSize: FONTS.sm, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, borderLeftWidth: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.textPrimary },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cardAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.roles.pharmacy.bg, alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { fontSize: FONTS.md, fontWeight: '800', color: COLORS.roles.pharmacy.color },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  cardSubtitle: { fontSize: FONTS.sm, color: COLORS.roles.pharmacy.color, fontWeight: '600', marginBottom: 2 },
  cardMeta: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  salaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.successBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm, alignSelf: 'flex-start' },
  salaryText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.success },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm },
  statusText: { fontSize: FONTS.xs, fontWeight: '700', color: COLORS.textPrimary },
  orderAmount: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.success, marginBottom: 8 },
  actionBtn: { backgroundColor: COLORS.roles.pharmacy.color, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },
  emptyState: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginTop: 20 },
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  productsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  productsBtnText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },
  modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.border || '#eee',
  backgroundColor: '#fff'
},
modalTitle: {
  fontSize: FONTS.lg,
  fontWeight: '800',
  color: COLORS.textPrimary
},
modalCloseBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: COLORS.background,
  alignItems: 'center',
  justifyContent: 'center'
},
});