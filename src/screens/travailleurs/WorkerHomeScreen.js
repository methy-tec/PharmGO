// ============================================
// 🛒 DASHBOARD TRAVAILLEUR
// src/screens/worker/WorkerHomeScreen.js
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
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import WorkerService from '../../services/WorkerService';
import NewSaleModal from '../../components/NewSaleModal';
import Toast from '../../components/Toast';

import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

export default function WorkerHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [statsPeriod, setStatsPeriod] = useState('today');

  const [showNewSaleModal, setShowNewSaleModal] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) => {
    setToast({ type, title, message, duration: 3000 });
  };

  useEffect(() => {
    loadDashboardData();
  }, [statsPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, salesRes] = await Promise.all([
        WorkerService.getMySalesStats(statsPeriod),
        WorkerService.getMySales({ limit: 20 })
      ]);

      setStats(statsRes.data);
      setSales(salesRes.data.sales || []);

    } catch (error) {
      console.error('❌ Erreur:', error);
      showToast('error', '❌ Erreur', error.message || 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleNewSale = () => {
    setShowNewSaleModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.info} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>👷 Travailleur</Text>
            <Text style={styles.headerSubtitle}>Point de vente</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
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
          </View>
        </View>

        {/* BOUTON NOUVELLE VENTE (PRINCIPAL) */}
        <TouchableOpacity style={styles.newSaleBtn} onPress={handleNewSale}>
          <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.newSaleBtnGradient}>
            <Ionicons name="cart" size={24} color="#fff" />
            <Text style={styles.newSaleBtnText}>Nouvelle Vente</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.tabs}>
          {['stats', 'sales'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons 
                name={tab === 'stats' ? 'stats-chart' : 'receipt'}
                size={18}
                color={activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'stats' ? 'Statistiques' : 'Historique'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* CONTENU */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'stats' && (
          <StatsTab 
            stats={stats} 
            period={statsPeriod} 
            onPeriodChange={setStatsPeriod} 
          />
        )}
        {activeTab === 'sales' && <SalesTab sales={sales} />}
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

      <NewSaleModal
        visible={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
        onSuccess={loadDashboardData}
      />
    </View>
  );
}

// =============================================
// ONGLET STATISTIQUES
// =============================================
function StatsTab({ stats, period, onPeriodChange }) {
  if (!stats) {
    return (
      <View style={styles.tabContent}>
        <Text>Chargement des statistiques...</Text>
      </View>
    );
  }

  const periods = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: '7 jours' },
    { value: 'month', label: '30 jours' }
  ];

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📊 Mes performances</Text>

      {/* SÉLECTEUR PÉRIODE */}
      <View style={styles.periodSelector}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
            onPress={() => onPeriodChange(p.value)}
          >
            <Text style={[styles.periodBtnText, period === p.value && styles.periodBtnTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CARTES STATS */}
      <View style={styles.statsGrid}>
        <StatCard 
          icon="receipt-outline" 
          label="Ventes" 
          value={stats.totalSales || 0}
          color="#2196F3"
        />
        <StatCard 
          icon="cash-outline" 
          label="Chiffre d'affaires" 
          value={stats.totalRevenue || '0 FCFA'}
          color="#4CAF50"
          isText
        />
        <StatCard 
          icon="people-outline" 
          label="Clients" 
          value={stats.uniqueCustomers || 0}
          color="#FF9800"
        />
        <StatCard 
          icon="cube-outline" 
          label="Produits vendus" 
          value={stats.totalProductsSold || 0}
          color="#9C27B0"
        />
      </View>

      {/* INFO SUPPLÉMENTAIRE */}
      {stats.totalSales > 0 && (
        <View style={styles.infoCard}>
          <Ionicons name="trending-up" size={24} color={COLORS.success} />
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardTitle}>Excellent travail ! 🎉</Text>
            <Text style={styles.infoCardText}>
              Vous avez réalisé {stats.totalSales} vente{stats.totalSales > 1 ? 's' : ''} pour un montant de {stats.totalRevenue}.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// =============================================
// ONGLET HISTORIQUE VENTES
// =============================================
function SalesTab({ sales }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📦 Historique des ventes ({sales.length})</Text>
      
      {sales.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Aucune vente enregistrée</Text>
        </View>
      ) : (
        sales.map((sale) => (
          <View key={sale.id} style={styles.saleCard}>
            <View style={styles.saleHeader}>
              <View style={styles.saleInfo}>
                <Text style={styles.saleId}>#{sale.id?.slice(0, 8)}</Text>
                <Text style={styles.saleCustomer}>
                  {sale.customer 
                    ? `${sale.customer.firstName} ${sale.customer.lastName}`
                    : sale.customerName || 'Client sans compte'
                  }
                </Text>
                <Text style={styles.saleDate}>
                  {new Date(sale.createdAt).toLocaleString('fr-FR')}
                </Text>
              </View>
              <View style={styles.saleAmount}>
                <Text style={styles.saleAmountValue}>
                  {sale.totalAmount?.toLocaleString()} FCFA
                </Text>
                <View style={styles.paymentBadge}>
                  <Ionicons 
                    name={
                      sale.paymentMethod === 'cash' ? 'cash' : 
                      sale.paymentMethod === 'card' ? 'card' : 'phone-portrait'
                    } 
                    size={14} 
                    color={COLORS.success} 
                  />
                  <Text style={styles.paymentText}>
                    {sale.paymentMethod === 'cash' ? 'Espèces' : 
                     sale.paymentMethod === 'card' ? 'Carte' : 'Mobile'}
                  </Text>
                </View>
              </View>
            </View>

            {sale.items && sale.items.length > 0 && (
              <View style={styles.saleItems}>
                <Text style={styles.saleItemsTitle}>Produits :</Text>
                {sale.items.map((item, index) => (
                  <Text key={index} style={styles.saleItemText}>
                    • {item.productName} × {item.quantity}
                  </Text>
                ))}
              </View>
            )}
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

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 16, fontSize: FONTS.md, color: COLORS.textSecondary },
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
  newSaleBtn: { marginBottom: 16, borderRadius: RADIUS.lg, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  newSaleBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16 },
  newSaleBtnText: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1 },
  tabContent: { padding: 20 },
  sectionTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  periodSelector: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  periodBtnActive: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  periodBtnText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textSecondary },
  periodBtnTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, borderLeftWidth: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.textPrimary },
  infoCard: { flexDirection: 'row', backgroundColor: COLORS.successBg, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 12 },
  infoCardContent: { flex: 1 },
  infoCardTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.success, marginBottom: 4 },
  infoCardText: { fontSize: FONTS.sm, color: COLORS.success, lineHeight: 18 },
  emptyState: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginTop: 20 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: FONTS.md, color: COLORS.textSecondary, textAlign: 'center' },
  saleCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  saleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  saleInfo: { flex: 1 },
  saleId: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.info, marginBottom: 4 },
  saleCustomer: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  saleDate: { fontSize: FONTS.xs, color: COLORS.textSecondary },
  saleAmount: { alignItems: 'flex-end' },
  saleAmountValue: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.success, marginBottom: 4 },
  paymentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  paymentText: { fontSize: FONTS.xs, fontWeight: '600', color: COLORS.success },
  saleItems: { borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 12 },
  saleItemsTitle: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  saleItemText: { fontSize: FONTS.sm, color: COLORS.textPrimary, marginBottom: 4 }
});