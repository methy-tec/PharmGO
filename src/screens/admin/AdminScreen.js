import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import AdminService from '../../services/AdminService';
import AddEmployeeModal from './AddEmployeeModal';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

import CreatePharmacyModal from '../../components/CreatePharmacyModal';
import EditPharmacyModal from '../../components/EditPharmacyModal';
import Toast from '../../components/Toast';
import DeleteModal from '../../components/DeleteModal';
import ConfirmLogoutModal from '../../components/modals/ConfirmLogoutModal';

// ─── Config plans (alignée sur SUBSCRIPTION_LIMITS backend) ─────────────────
const PLAN_CONFIG = {
  free:     { color: '#999',    icon: 'ribbon-outline',    label: 'Gratuit',  desc: '1 pharmacie · 2 employés',    price: 0 },
  basic:    { color: '#007aff', icon: 'star-outline',      label: 'Basic',    desc: '10 pharmacies · 20 employés/pharmacie',  price: 9.99 },
  standard: { color: '#ff9500', icon: 'flash-outline',     label: 'Standard', desc: '20 pharmacies · 50 employés/pharmacie', price: 14.99 },
  premium:  { color: '#6c2bd9', icon: 'diamond-outline',   label: 'Premium',  desc: 'Illimité',                                  price: 19.99 },
};

// ─── Features par plan (miroir du backend) ───────────────────────────────────
const PLAN_FEATURES = {
  free:     { analytics: false, advancedReports: false, orders: false, customers: false },
  basic:    { analytics: true,  advancedReports: false, orders: true,  customers: true  },
  standard: { analytics: true,  advancedReports: true,  orders: true,  customers: true  },
  premium:  { analytics: true,  advancedReports: true,  orders: true,  customers: true  },
};

const hasFeature = (plan, feature) => PLAN_FEATURES[plan]?.[feature] ?? false;

// ─── Composant principal ─────────────────────────────────────────────────────
export default function AdminHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [logoutModal, setLogoutModal] = useState(false);

  const [activeTab,    setActiveTab]    = useState('stats');
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const [stats,       setStats]       = useState(null);
  const [pharmacies,  setPharmacies]  = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [customers,   setCustomers]   = useState([]);
  const [statsRestricted, setStatsRestricted] = useState(false);

  const [showCreateModal,     setShowCreateModal]     = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditModal,       setShowEditModal]       = useState(false);
  const [selectedPharmacy,    setSelectedPharmacy]    = useState(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pharmacyToDelete,   setPharmacyToDelete]   = useState(null);
  const [deleting,           setDeleting]           = useState(false);

  const [toast, setToast] = useState(null);

  const [subscriptionRequests, setSubscriptionRequests] = useState([]);
  const [subLoading,           setSubLoading]           = useState(false);
  const [requesting,           setRequesting]           = useState(false);
  const [upgradeModal,         setUpgradeModal]         = useState(false);

  // Demande de reabonnement
  const [isRenewalOnly, setIsRenewalOnly] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const currentPlan = user?.subscriptionType || 'free';

  const showToast = (type, title, message) =>
    setToast({ type, title, message, duration: 4000 });

  const handleModalSuccess = (type, message) => {
    showToast(type, type === 'success' ? '✅ Succès' : '❌ Erreur', message);
    loadDashboardData();
  };

  // ── Chargement ─────────────────────────────────────────────────────────────
  useEffect(() => { loadDashboardData(); }, []);
  useEffect(() => {
    if (activeTab === 'subscription') loadSubscriptionRequests();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, pharmaciesRes] = await Promise.all([
        AdminService.getMyStats(),
        AdminService.getMyPharmacies(),
      ]);

      const statsData = statsRes.data;
      setStats(statsData);
      setStatsRestricted(statsRes.restricted === true);
      setPharmacies(pharmaciesRes.data.pharmacies || []);

      if (hasFeature(currentPlan, 'orders')) {
        const [ordersRes, customersRes] = await Promise.all([
          AdminService.getMyOrders({ limit: 10 }),
          AdminService.getMyCustomers({ limit: 10 }),
        ]);
        setOrders(ordersRes.data.orders || []);
        setCustomers(customersRes.data.customers || []);
      } else {
        setOrders([]);
        setCustomers([]);
      }

    } catch (error) {
      console.error('❌ Erreur loadDashboardData:', error);
      showToast('error', 'Erreur', error.message || 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionRequests = async () => {
    try {
      setSubLoading(true);
      const res = await AdminService.getMySubscriptionRequests();
      setSubscriptionRequests(res.data?.requests || []);
    } catch (err) {
      showToast('error', 'Erreur', err.message);
    } finally {
      setSubLoading(false);
    }
  };

  const handleRequestUpgrade = async ({ subscriptionType, durationMonths }) => {
    try {
      setRequesting(true);
      
      if (isRenewalOnly) {
        // 🔄 Route de renouvellement simple (Même plan)
        await AdminService.requestSubscriptionRenewal({ subscriptionType, durationMonths });
        showToast('success', '✅ Renouvellement envoyé', 'Votre demande de réabonnement est en attente');
      } else {
        // 🚀 Route de changement d'abonnement (Upgrade / Downgrade)
        await AdminService.requestSubscriptionUpgrade({ subscriptionType, durationMonths });
        showToast('success', '✅ Demande envoyée', 'Votre demande de changement de plan est en attente');
      }
      setUpgradeModal(false);
      loadSubscriptionRequests();
    } catch (err) {
      showToast('error', 'Erreur', err.response?.data?.message || err.message);
    } finally {
      setRequesting(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // ── Handlers pharmacies ────────────────────────────────────────────────────
  const handleViewPharmacy    = (p) => navigation.navigate('PharmacyEmployeesScreen', { pharmacy: p });
  const handleUpdatePharmacy  = (p) => { setSelectedPharmacy(p); setShowEditModal(true); };
  const handleDeletePharmacy  = (p) => { setPharmacyToDelete(p); setDeleteModalVisible(true); };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await AdminService.deletePharmacy(pharmacyToDelete.id);
      setDeleteModalVisible(false);
      setPharmacyToDelete(null);
      showToast('success', '✅ Succès', 'Pharmacie supprimée avec succès');
      loadDashboardData();
    } catch (error) {
      showToast('error', '❌ Erreur', error.message || 'Impossible de supprimer la pharmacie');
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { key: 'stats',        icon: 'stats-chart', label: 'Stats'      },
    { key: 'pharmacies',   icon: 'medkit',      label: 'Pharmas'    },
    ...(hasFeature(currentPlan, 'orders')    ? [{ key: 'orders',    icon: 'cart',    label: 'Orders'  }] : []),
    ...(hasFeature(currentPlan, 'customers') ? [{ key: 'customers', icon: 'people',  label: 'Clients' }] : []),
    { key: 'subscription', icon: 'card',        label: 'Abonnement' },
  ];

  return (
    <View style={styles.container}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#00b368', '#008C52']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>🛡️ Admin</Text>
            <Text style={styles.headerSubtitle}>Gestion de mes pharmacies</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
              <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowAddEmployeeModal(true)}>
              <Ionicons name="person-add" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutModal(true)}>
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
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={[styles.planPill, { backgroundColor: (PLAN_CONFIG[currentPlan]?.color || '#999') + '30' }]}>
                <Ionicons name={PLAN_CONFIG[currentPlan]?.icon || 'ribbon-outline'} size={11} color="#fff" />
                <Text style={styles.planPillText}>{PLAN_CONFIG[currentPlan]?.label || currentPlan}</Text>
              </View>
              <Text style={styles.userSubscription}>• {pharmacies.length} pharmacie(s)</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)'}
                />
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* ── Contenu ───────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'stats' && (
          <StatsTab
            stats={stats}
            pharmaciesCount={pharmacies.length}
            restricted={statsRestricted}
            plan={currentPlan}
            onUpgrade={() => { setActiveTab('subscription'); setUpgradeModal(true); }}
          />
        )}
        {activeTab === 'pharmacies' && (
          <PharmaciesTab
            pharmacies={pharmacies}
            onViewPharmacy={handleViewPharmacy}
            onCreatePharmacy={() => setShowCreateModal(true)}
            onUpdatePharmacy={handleUpdatePharmacy}
            onDeletePharmacy={handleDeletePharmacy}
          />
        )}
        {activeTab === 'orders'    && <OrdersTab    orders={orders} />}
        {activeTab === 'customers' && <CustomersTab customers={customers} />}
        {activeTab === 'subscription' && (
          <SubscriptionTab
            user={user}
            requests={subscriptionRequests}
            loading={subLoading}
            onRequestUpgrade={() => { setIsRenewalOnly(false); setUpgradeModal(true);}}
            onRequestRenewal={() => { setIsRenewalOnly(true); setUpgradeModal(true);}}
          />
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AddEmployeeModal
        visible={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        onSuccess={handleModalSuccess}
        pharmacies={pharmacies}
      />
      <CreatePharmacyModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => { loadDashboardData(); setShowCreateModal(false); }}
      />
      <EditPharmacyModal
        visible={showEditModal}
        pharmacy={selectedPharmacy}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
      />
      <DeleteModal
        visible={deleteModalVisible}
        title="Supprimer la pharmacie ?"
        message="Voulez-vous vraiment supprimer"
        itemName={pharmacyToDelete?.name}
        loading={deleting}
        onCancel={() => { setDeleteModalVisible(false); setPharmacyToDelete(null); }}
        onConfirm={handleDeleteConfirm}
      />
      <UpgradeModal
        visible={upgradeModal}
        loading={requesting}
        currentPlan={currentPlan}
        isRenewalOnly={isRenewalOnly}
        onClose={() => setUpgradeModal(false)}
        onConfirm={handleRequestUpgrade}
      />
      <ConfirmLogoutModal 
        visible={logoutModal}
        onCancel={() => setLogoutModal(false)}
        onConfirm={() => { setLogoutModal(false); logout(); }}
      />
    </View>
  );
}

// ─── ONGLET STATS ────────────────────────────────────────────────────────────
function StatsTab({ stats, pharmaciesCount, restricted, plan, onUpgrade }) {
  if (restricted) {
    return (
      <View style={styles.tabContent}>
        <View style={upgradeStyles.banner}>
          <View style={upgradeStyles.bannerIconWrap}>
            <Ionicons name="lock-closed" size={28} color={PLAN_CONFIG.basic.color} />
          </View>
          <Text style={upgradeStyles.bannerTitle}>Statistiques limitées</Text>
          <Text style={upgradeStyles.bannerDesc}>
            Votre plan gratuit affiche uniquement le nombre de pharmacies.{'\n'}
            Passez au plan <Text style={{ fontWeight: '800', color: PLAN_CONFIG.basic.color }}>Basic</Text> ou supérieur pour accéder aux stats complètes.
          </Text>
          <TouchableOpacity style={upgradeStyles.bannerBtn} onPress={onUpgrade}>
            <Ionicons name="arrow-up-circle" size={16} color="#fff" />
            <Text style={upgradeStyles.bannerBtnText}>Améliorer mon plan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="medkit"
            label="Mes pharmacies"
            value={pharmaciesCount}
            color={COLORS.roles.admin.color}
          />
        </View>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.tabContent}>
        <ActivityIndicator color={COLORS.roles.admin.color} />
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="medkit"  label="Mes pharmacies" value={pharmaciesCount}            color={COLORS.roles.admin.color} />
        <StatCard icon="cart"    label="Commandes"       value={stats.totalOrders    || 0} color={COLORS.secondary} />
        <StatCard icon="people"  label="Clients"         value={stats.totalCustomers || 0} color={COLORS.primary} />
        <StatCard icon="cash"    label="Revenu"          value={stats.totalRevenue   || '0 FCFA'} color={COLORS.success} isText />
      </View>

      <Text style={styles.subsectionTitle}>📅 Ce mois</Text>
      <View style={styles.statsGrid}>
        <StatCard icon="trending-up"  label="Nouvelles commandes" value={stats.monthlyOrders    || 0} color={COLORS.info} />
        <StatCard icon="person-add"   label="Nouveaux clients"    value={stats.monthlyCustomers || 0} color={COLORS.success} />
      </View>

      {stats.advancedReports && (
        <>
          <Text style={styles.subsectionTitle}>📈 Rapports avancés</Text>

          {stats.advancedReports.revenueByPharmacy?.length > 0 && (
            <>
              <Text style={styles.reportSubtitle}>Revenu par pharmacie</Text>
              {stats.advancedReports.revenueByPharmacy.map((row, i) => (
                <View key={i} style={styles.reportRow}>
                  <Text style={styles.reportRowLabel}>{row.pharmacy?.name || '—'}</Text>
                  <Text style={styles.reportRowValue}>{row.revenue || 0} FCFA</Text>
                  <Text style={styles.reportRowMeta}>{row.ordersCount} cmd</Text>
                </View>
              ))}
            </>
          )}

          {stats.advancedReports.topProducts?.length > 0 && (
            <>
              <Text style={[styles.reportSubtitle, { marginTop: 16 }]}>Top 5 produits vendus</Text>
              {stats.advancedReports.topProducts.map((row, i) => (
                <View key={i} style={styles.reportRow}>
                  <Text style={styles.reportRowRank}>#{i + 1}</Text>
                  <Text style={[styles.reportRowLabel, { flex: 1 }]}>{row.productName}</Text>
                  <Text style={styles.reportRowMeta}>{row.totalQuantity} unités</Text>
                  <Text style={styles.reportRowValue}>{row.totalRevenue} FCFA</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
}

// ─── ONGLET PHARMACIES ───────────────────────────────────────────────────────
function PharmaciesTab({ pharmacies, onViewPharmacy, onCreatePharmacy, onUpdatePharmacy, onDeletePharmacy }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏥 Mes pharmacies ({pharmacies.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onCreatePharmacy}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {pharmacies.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏥</Text>
          <Text style={styles.emptyText}>Aucune pharmacie</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={onCreatePharmacy}>
            <Text style={styles.emptyBtnText}>Créer ma première pharmacie</Text>
          </TouchableOpacity>
        </View>
      ) : (
        pharmacies.map(p => (
          <View key={p.id} style={styles.card}>
            <TouchableOpacity onPress={() => onViewPharmacy(p)} style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Ionicons name="medkit" size={24} color={COLORS.roles.admin.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.cardMeta}>📍 {p.city}</Text>
                {p.employees?.length > 0 && (
                  <Text style={styles.cardMeta}>👥 {p.employees.length} employé(s)</Text>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: p.isActive ? COLORS.successBg : COLORS.errorBg }]}>
                <Text style={[styles.statusText, { color: p.isActive ? COLORS.success : COLORS.error }]}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn}   onPress={() => onUpdatePharmacy(p)}>
                <Ionicons name="create-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeletePharmacy(p)}>
                <Ionicons name="trash-outline"  size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ─── ONGLET COMMANDES ────────────────────────────────────────────────────────
function OrdersTab({ orders }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📦 Commandes ({orders.length})</Text>
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Aucune commande</Text>
        </View>
      ) : (
        orders.map((order, i) => (
          <View key={order.id || i} style={styles.card}>
            <Text style={styles.cardTitle}>Commande #{order.id?.slice(0, 8)}</Text>
            <Text style={styles.cardMeta}>
              {order.customer?.firstName} {order.customer?.lastName} • {order.total || 0} FCFA
            </Text>
            <Text style={styles.cardMeta}>🏥 {order.pharmacy?.name} • {order.status}</Text>
          </View>
        ))
      )}
    </View>
  );
}

// ─── ONGLET CLIENTS ──────────────────────────────────────────────────────────
function CustomersTab({ customers }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>👥 Mes clients ({customers.length})</Text>
      {customers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>Aucun client</Text>
        </View>
      ) : (
        customers.map((c, i) => (
          <View key={c.id || i} style={styles.card}>
            <Text style={styles.cardTitle}>{c.firstName} {c.lastName}</Text>
            <Text style={styles.cardMeta}>{c.email}</Text>
            {c.phone && <Text style={styles.cardMeta}>📞 {c.phone}</Text>}
          </View>
        ))
      )}
    </View>
  );
}

// ─── ONGLET ABONNEMENT ───────────────────────────────────────────────────────
function SubscriptionTab({ user, requests, loading, onRequestUpgrade, onRequestRenewal }) {
  const plan    = user?.subscriptionType || 'free';
  const current = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  const hasPending = requests.some(r => r.status === 'pending');

  return (
    <View style={styles.tabContent}>
      <View style={[subStyles.currentPlanCard, { borderColor: current.color }]}>
        <View style={[subStyles.planIconWrap, { backgroundColor: current.color + '20' }]}>
          <Ionicons name={current.icon} size={28} color={current.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Plan actuel</Text>
          <Text style={[subStyles.planName, { color: current.color }]}>{current.label}</Text>
          <Text style={subStyles.planDesc}>{current.desc}</Text>
          {user?.subscriptionExpiry && (
            <Text style={subStyles.planExpiry}>
              📅 Expire le {new Date(user.subscriptionExpiry).toLocaleDateString('fr-FR')}
            </Text>
          )}
          {user?.trialEndsAt && (
            <Text style={subStyles.planTrial}>
              ⏳ Essai jusqu'au {new Date(user.trialEndsAt).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
      </View>

      <View style={subStyles.featuresBox}>
        {[
          { key: 'analytics',      label: 'Statistiques',        icon: 'stats-chart-outline' },
          { key: 'advancedReports',label: 'Rapports avancés',    icon: 'bar-chart-outline'   },
          { key: 'orders',         label: 'Accès commandes',     icon: 'cart-outline'        },
          { key: 'customers',      label: 'Accès clients',       icon: 'people-outline'      },
        ].map(f => {
          const active = hasFeature(plan, f.key);
          return (
            <View key={f.key} style={subStyles.featureRow}>
              <Ionicons name={f.icon} size={16} color={active ? COLORS.success : '#ccc'} />
              <Text style={[subStyles.featureLabel, !active && { color: '#ccc' }]}>{f.label}</Text>
              <Ionicons
                name={active ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={active ? COLORS.success : '#ccc'}
              />
            </View>
          );
        })}
      </View>

      <View style={{ gap: 10, marginTop: 15}}>
        {plan !== 'free' && (
          <TouchableOpacity
            style={[subStyles.reneWalBtn, hasPending && { opacity: 0.5}]}
            onPress={onRequestRenewal}
            disabled={hasPending}
          >
            <Ionicons name="refresh-circle" size={20} color="#fff"/>
            <Text style={subStyles.upgradeBtnText}>
              {hasPending ? 'Demande en cours...' : 'Renouveler mon abonnement actuel'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[subStyles.upgradeBtn, hasPending && { opacity: 0.5 }]}
          onPress={onRequestUpgrade}
          disabled={hasPending}
        >
          <Ionicons name="arrow-up-circle" size={20} color="#fff" />
          <Text style={subStyles.upgradeBtnText}>
            {hasPending ? 'Demande en cours...' : 'Demander un abonnement'}
          </Text>
        </TouchableOpacity>
      </View>

      {hasPending && (
        <View style={subStyles.pendingBanner}>
          <Ionicons name="time-outline" size={16} color="#856404" />
          <Text style={subStyles.pendingBannerText}>
            Une demande est en attente de validation par le superadmin.
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📋 Mes demandes</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.roles.admin.color} style={{ marginTop: 20 }} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Aucune demande effectuée</Text>
        </View>
      ) : (
        requests.map(req => {
          const cfg = PLAN_CONFIG[req.requestedPlan] || PLAN_CONFIG.free;
          return (
            <View key={req.id} style={[
              subStyles.requestItem,
              req.status === 'approved' && { borderColor: '#c8e6c9', backgroundColor: '#f9fff9' },
              req.status === 'rejected' && { borderColor: '#ffd6d6', backgroundColor: '#fff9f9' },
            ]}>
              <View style={subStyles.requestItemHeader}>
                <View style={[subStyles.requestPlanBadge, { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}>
                  <Text style={[subStyles.requestPlanText, { color: cfg.color }]}>
                    {req.requestedPlan?.toUpperCase()}
                  </Text>
                </View>
                <Text style={subStyles.requestDuration}>· {req.durationMonths} mois</Text>
                {req.price != null && (
                  <Text style={subStyles.requestPrice}>{req.price} FCFA</Text>
                )}
                <View style={[
                  subStyles.statusPill,
                  req.status === 'pending'  && { backgroundColor: '#fff3cd' },
                  req.status === 'approved' && { backgroundColor: '#d4edda' },
                  req.status === 'rejected' && { backgroundColor: '#f8d7da' },
                ]}>
                  <Text style={[
                    subStyles.statusPillText,
                    req.status === 'pending'  && { color: '#856404' },
                    req.status === 'approved' && { color: '#155724' },
                    req.status === 'rejected' && { color: '#721c24' },
                  ]}>
                    {req.status === 'pending'  ? '⏳ En attente' :
                     req.status === 'approved' ? '✅ Approuvé'   : '❌ Rejeté'}
                  </Text>
                </View>
              </View>
              <Text style={subStyles.requestDate}>
                📅 {new Date(req.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </Text>
              {req.status === 'rejected' && req.rejectReason && (
                <Text style={subStyles.rejectReason}>💬 {req.rejectReason}</Text>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

// ─── MODAL UPGRADE ───────────────────────────────────────────────────────────
function UpgradeModal({ visible, loading, currentPlan, isRenewalOnly, onClose, onConfirm }) {
  const [selectedPlan,   setSelectedPlan]   = useState('');
  const [durationMonths, setDurationMonths] = useState(1);

  useEffect(() => {
    if (visible) {
      if (isRenewalOnly) {
        setSelectedPlan(currentPlan);
      } else {
        setSelectedPlan('');
      }
    }
  }, [visible, isRenewalOnly, currentPlan]);

  const plans = Object.entries(PLAN_CONFIG)
    .filter(([key]) => {
      if (key === 'free') return false;
      if (isRenewalOnly) {
        return key === currentPlan;
      } else {
        return key !== currentPlan;
      }
    })
    .map(([key, val]) => ({ key, ...val }));

  const selectedCfg  = PLAN_CONFIG[selectedPlan];
  const totalPrice   = selectedCfg ? selectedCfg.price * durationMonths : 0;

  const handleConfirm = () => {
    if (!selectedPlan) return;
    onConfirm({ subscriptionType: selectedPlan, durationMonths });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>

          {/* En-tête */}
          <LinearGradient
            colors={['#00b368', '#008C52']}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={isRenewalOnly ? "refresh-circle" : "arrow-up-circle"} size={22} color="#fff" />
              </View>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>
                  {isRenewalOnly ? "Demande de réabonnement" : "Changement d'abonnement"}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Plan actuel : {PLAN_CONFIG[currentPlan]?.label}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center' }}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Contenu Scrollable */}
          <ScrollView style={{ padding: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 }}>
              {isRenewalOnly ? "Confirmez votre plan à renouveler :" : "Sélectionnez votre nouveau plan :"}
            </Text>

            {plans.map(item => {
              const isSelected = selectedPlan === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  disabled={isRenewalOnly} // Bloqué sur le plan actuel en mode renouvellement
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16,
                    borderWidth: 2, borderColor: isSelected ? item.color : '#f0f0f0',
                    backgroundColor: isSelected ? item.color + '05' : '#fff', marginBottom: 12, gap: 14
                  }}
                  onPress={() => setSelectedPlan(item.key)}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: item.color + '15',
                    alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#222' }}>{item.label}</Text>
                    <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{item.desc}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: item.color }}>{item.price} $</Text>
                    <Text style={{ fontSize: 11, color: '#999' }}>/mois</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Durée */}
            {selectedPlan ? (
              <View style={{ marginTop: 8, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 12 }}>Durée de l'engagement :</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[1, 3, 6, 12].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
                        alignItems: 'center', justifyContent: 'center',
                        borderColor: durationMonths === m ? '#00b368' : '#ddd',
                        backgroundColor: durationMonths === m ? '#e6f7f0' : '#fff'
                      }}
                      onPress={() => setDurationMonths(m)}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: durationMonths === m ? '#00b368' : '#555' }}>
                        {m} M
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer fixe */}
          <View style={{ padding: 20, borderTopWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#777' }}>Total estimé</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#222' }}>
                {totalPrice > 0 ? `${totalPrice.toFixed(2)} $` : 'Gratuit'}
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: selectedPlan ? '#00b368' : '#ccc',
                paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
                flexDirection: 'row', alignItems: 'center', gap: 8
              }}
              disabled={loading || !selectedPlan}
              onPress={handleConfirm}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {isRenewalOnly ? "Envoyer le renouvellement" : "Envoyer la demande"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// Les styles factices indispensables pour éviter les crashs si non déclarés
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666' },
  header: { paddingPadding: 20, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerActionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#008C52' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  planPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  planPillText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  userSubscription: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  tabs: { flexDirection: 'row', gap: 10, paddingBottom: 5 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tabTextActive: { color: '#008C52', fontWeight: '700' },
  content: { flex: 1, padding: 15 },
  tabContent: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  subsectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#555', marginTop: 20, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00b368', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e6f7f0', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  cardMeta: { fontSize: 12, color: '#777', marginTop: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
  editBtn: { padding: 6, backgroundColor: '#ff9500', borderRadius: 8 },
  deleteBtn: { padding: 6, backgroundColor: '#ff3b30', borderRadius: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  emptyState: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: '#999', fontSize: 14 },
  emptyBtn: { marginTop: 15, backgroundColor: '#00b368', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  reportSubtitle: { fontSize: 13, fontWeight: 'bold', color: '#666', marginTop: 10, marginBottom: 8 },
  reportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  reportRowRank: { width: 24, fontSize: 13, fontWeight: 'bold', color: '#999' },
  reportRowLabel: { fontSize: 13, color: '#333' },
  reportRowValue: { fontSize: 13, fontWeight: 'bold', color: '#222', marginLeft: 10 },
  reportRowMeta: { fontSize: 11, color: '#999', marginLeft: 10 }
});

const subStyles = StyleSheet.create({
  currentPlanCard: { flexDirection: 'row', gap: 16, padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, marginBottom: 15 },
  planIconWrap: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  planDesc: { fontSize: 13, color: '#666', marginTop: 4 },
  planExpiry: { fontSize: 12, color: '#ff9500', fontWeight: '600', marginTop: 6 },
  planTrial: { fontSize: 12, color: '#007aff', fontWeight: '600', marginTop: 6 },
  featuresBox: { backgroundColor: '#fff', borderRadius: 16, padding: 15 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  featureLabel: { flex: 1, fontSize: 13, color: '#444' },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#007aff', padding: 14, borderRadius: 14 },
  reneWalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ff9500', padding: 14, borderRadius: 14 },
  upgradeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  pendingBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fff3cd', padding: 12, borderRadius: 12, marginTop: 10 },
  pendingBannerText: { flex: 1, fontSize: 12, color: '#856404' },
  requestItem: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  requestItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  requestPlanBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  requestPlanText: { fontSize: 10, fontWeight: 'bold' },
  requestDuration: { fontSize: 12, color: '#666', flex: 1 },
  requestPrice: { fontSize: 13, fontWeight: 'bold', color: '#333', marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: 'bold' },
  requestDate: { fontSize: 11, color: '#999', marginTop: 6 },
  rejectReason: { fontSize: 12, color: '#ff3b30', marginTop: 4, backgroundColor: '#fff3cd', padding: 6, borderRadius: 6 }
});

const upgradeStyles = StyleSheet.create({
  banner: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eee', marginBottom: 15 },
  bannerIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  bannerDesc: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#007aff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 14 },
  bannerBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' }
});

function StatCard({ icon, label, value, color, isText }) {
  return (
    <View style={[styles.card, { flex: 1, minWidth: '45%', marginBottom: 0 }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ fontSize: 12, color: '#777', marginTop: 8 }}>{label}</Text>
      <Text style={{ fontSize: isText ? 15 : 20, fontWeight: 'bold', color: '#222', marginTop: 2 }}>{value}</Text>
    </View>
  );
}