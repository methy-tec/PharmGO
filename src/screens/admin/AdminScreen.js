import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, Animated
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

// ─── Config plans (alignée sur SUBSCRIPTION_LIMITS backend) ─────────────────
const PLAN_CONFIG = {
  free:     { color: '#999',    icon: 'ribbon-outline',    label: 'Gratuit',  desc: '1 pharmacie · 2 employés',    price: 0 },
  basic:    { color: '#007aff', icon: 'star-outline',      label: 'Basic',    desc: '10 pharmacies · 20 employés/pharmacie',  price: 9.99 },
  standard: { color: '#ff9500', icon: 'flash-outline',     label: 'Standard', desc: '20 pharmacies · 50 employés/pharmacie', price: 14.99 },
  premium:  { color: '#6c2bd9', icon: 'diamond-outline',   label: 'Premium',  desc: 'Illimité',                           price: 19.99 },
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

      // Toujours charger stats + pharmacies
      const [statsRes, pharmaciesRes] = await Promise.all([
        AdminService.getMyStats(),
        AdminService.getMyPharmacies(),
      ]);

      const statsData = statsRes.data;
      setStats(statsData);
      setStatsRestricted(statsRes.restricted === true);
      setPharmacies(pharmaciesRes.data.pharmacies || []);

      // Commandes & clients : seulement si le plan le permet
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
      await AdminService.requestSubscriptionUpgrade({ subscriptionType, durationMonths });
      setUpgradeModal(false);
      showToast('success', '✅ Demande envoyée', 'En attente de validation par le superadmin');
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

  // ── Rendu ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.roles.admin.color} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Onglets : masquer Orders/Clients si plan free
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
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowAddEmployeeModal(true)}>
              <Ionicons name="person-add" size={20} color="#fff" />
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

        {/* Onglets dynamiques */}
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
    </View>
  );
}

// ─── ONGLET STATS ────────────────────────────────────────────────────────────
function StatsTab({ stats, pharmaciesCount, restricted, plan, onUpgrade }) {

  // Plan free → bannière d'upgrade + seul le nombre de pharmacies
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

        {/* Seule stat disponible */}
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

      {/* Rapports avancés (standard + premium) */}
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

      {/* Carte plan actuel */}
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

      {/* Récapitulatif des features du plan */}
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

      {/* Button de reabonnement */}
      <View style={{ gap: 10, marginTop: 15}}>
        {/** Le button reabonnement s'affiche si l'utilisateur n'est pas sur le plan gratuit */}
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

          {/* Bouton de changement de plan  */}
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

      {/* Historique */}
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

  // Initialisation automatique du plan si c'est un reabonnement
  useEffect(() =>{
    if (visible){
      if (isRenewalOnly){
        setSelectedPlan(currentPlan);
      }else{
        setSelectedPlan('');
      }
    }
  },[visible, isRenewalOnly, currentPlan]);

  //Filtrage des plans dynamiquement selon l'action
  const plans = Object.entries(PLAN_CONFIG)
    .filter(([key])=>{
      if (key === 'free') return false;
      if(isRenewalOnly) {
        return key === currentPlan; // Uniquement afficher le plan actuel pour reabonnement
      }else {
        return key !== currentPlan;  // Cacher le plan actuel pour un upgrade
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
                <Text style={{fontSize: 17, fontWeight: '800', color: '#fff' }} >
                  {isRenewalOnly ? "Demande de reabonnement" : "Changement d'abonnement"}
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

          <ScrollView style={{ padding: 20 }}>

            {/* Sélection du plan */}
            <Text style={[styles.sectionTitle, {marginBottom: 12}]}>
              {isRenewalOnly ? "Votre plan a renouveler" : "Choisir un plan"}
            </Text>

            {plans.map(plan => (
              <TouchableOpacity
                key={plan.key}
                disabled={isRenewalOnly} // Bloquer sur le plan actuel en cas de  renouvellement
                style={[subStyles.planOption,
                  selectedPlan === plan.key && { borderColor: plan.color, backgroundColor: plan.color + '10' }
                ]}
                onPress={() => setSelectedPlan(plan.key)}
              >
                <View style={[subStyles.planOptionIcon, { backgroundColor: plan.color + '20' }]}>
                  <Ionicons name={plan.icon} size={20} color={plan.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[subStyles.planOptionLabel, selectedPlan === plan.key && { color: plan.color }]}>
                    {plan.label}
                  </Text>
                  <Text style={subStyles.planOptionDesc}>{plan.desc}</Text>
                  <Text style={[subStyles.planOptionPrice, { color: plan.color }]}>
                    {plan.price} $ / mois
                  </Text>
                </View>
                {!isRenewalOnly && (
                  <View style={[subStyles.radioOuter, selectedPlan === plan.key && { borderColor: plan.color }]}>
                    {selectedPlan === plan.key && (
                      <View style={[subStyles.radioInner, { backgroundColor: plan.color }]} />
                    )}
                  </View>
                )}
                
              </TouchableOpacity>
            ))}

            {/* Durée */}
            <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>Durée</Text>
            <View style={subStyles.durationRow}>
              {[1, 3, 6, 12].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[subStyles.durationBtn, durationMonths === m && subStyles.durationBtnActive]}
                  onPress={() => setDurationMonths(m)}
                >
                  <Text style={[subStyles.durationBtnText, durationMonths === m && subStyles.durationBtnTextActive]}>
                    {m} mois
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Récapitulatif prix */}
            {selectedPlan && (
              <View style={subStyles.priceSummary}>
                <Text style={subStyles.priceSummaryLabel}>Total estimé</Text>
                <Text style={[subStyles.priceSummaryValue, { color: selectedCfg?.color }]}>
                  {totalPrice} $
                </Text>
                <Text style={subStyles.priceSummaryMeta}>
                  {selectedCfg?.price} $ × {durationMonths} mois
                </Text>
              </View>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Boutons */}
          <View style={{ flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
            <TouchableOpacity
              style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd',
                alignItems: 'center', justifyContent: 'center' }}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#666' }}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[subStyles.upgradeBtn, { marginTop: 20, backgroundColor: '#008C52' }, !selectedPlan && { opacity: 0.5 }]} 
              onPress={handleConfirm}
              disabled={loading || !selectedPlan}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Envoyer la demande</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, isText }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{isText ? value : value?.toLocaleString()}</Text>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText:      { marginTop: 16, fontSize: FONTS.md, color: COLORS.textSecondary },
  header:           { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle:      { fontSize: FONTS.xxl, fontWeight: '800', color: '#fff' },
  headerSubtitle:   { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.8)' },
  headerActionBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoutBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  userInfo:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar:           { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  userName:         { fontSize: FONTS.md, fontWeight: '700', color: '#fff' },
  userEmail:        { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.8)' },
  userSubscription: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)' },
  planPill:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  planPillText:     { fontSize: 11, fontWeight: '700', color: '#fff' },
  tabs:             { flexDirection: 'row', gap: 6 },
  tab:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive:        { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabText:          { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTextActive:    { color: '#fff' },
  content:          { flex: 1 },
  tabContent:       { padding: 20 },
  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle:     { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  subsectionTitle:  { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  addBtn:           { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.roles.admin.color, alignItems: 'center', justifyContent: 'center' },
  statsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard:         { width: '47%', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, borderLeftWidth: 4 },
  statIcon:         { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel:        { fontSize: FONTS.xs, color: COLORS.textSecondary, marginBottom: 4 },
  statValue:        { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.textPrimary },
  card:             { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 12 },
  cardHeader:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon:         { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  cardInfo:         { flex: 1 },
  cardTitle:        { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  cardMeta:         { fontSize: FONTS.sm, color: COLORS.textSecondary },
  statusBadge:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  statusText:       { fontSize: FONTS.xs, fontWeight: '700' },
  cardActions:      { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  editBtn:          { backgroundColor: COLORS.info,  padding: 8, borderRadius: RADIUS.sm },
  deleteBtn:        { backgroundColor: COLORS.error, padding: 8, borderRadius: RADIUS.sm },
  emptyState:       { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginTop: 20 },
  emptyIcon:        { fontSize: 48, marginBottom: 12 },
  emptyText:        { fontSize: FONTS.md, color: COLORS.textSecondary, marginBottom: 16 },
  emptyBtn:         { backgroundColor: COLORS.roles.admin.color, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md },
  emptyBtnText:     { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },
  reportSubtitle:   { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  reportRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 12, marginBottom: 6, gap: 8 },
  reportRowRank:    { fontSize: FONTS.sm, fontWeight: '800', color: COLORS.textSecondary, width: 24 },
  reportRowLabel:   { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary },
  reportRowValue:   { fontSize: FONTS.sm, fontWeight: '800', color: COLORS.success },
  reportRowMeta:    { fontSize: FONTS.xs, color: COLORS.textSecondary },
  renewalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34a853', // Vert distinct pour le réabonnement
    paddingVertical: 12,
    borderRadius: 12,
  },
  durationBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  durationBtnText: {
    color: '#333',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  }
});

const upgradeStyles = StyleSheet.create({
  banner:        { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#007aff' + '40', borderStyle: 'dashed' },
  bannerIconWrap:{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#007aff' + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bannerTitle:   { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  bannerDesc:    { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  bannerBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#007aff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  bannerBtnText: { fontSize: FONTS.sm, fontWeight: '800', color: '#fff' },
});

const subStyles = StyleSheet.create({
  currentPlanCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 2 },
  planIconWrap:      { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  planName:          { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  planDesc:          { fontSize: 13, color: '#666' },
  planExpiry:        { fontSize: 12, color: '#999', marginTop: 4 },
  planTrial:         { fontSize: 12, color: '#ff9500', marginTop: 4, fontWeight: '600' },
  featuresBox:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, gap: 10 },
  featureRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureLabel:      { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  upgradeBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.roles.admin.color, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  upgradeBtnText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
  pendingBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff8dc', borderRadius: 10, padding: 12, marginBottom: 8 },
  pendingBannerText: { flex: 1, fontSize: 13, color: '#856404', fontWeight: '500' },
  requestItem:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#eee' },
  requestItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  requestPlanBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5 },
  requestPlanText:   { fontSize: 12, fontWeight: '800' },
  requestDuration:   { fontSize: 13, color: '#999', fontWeight: '600' },
  requestPrice:      { fontSize: 13, fontWeight: '700', color: COLORS.success, flex: 1 },
  statusPill:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusPillText:    { fontSize: 11, fontWeight: '700' },
  requestDate:       { fontSize: 12, color: '#aaa' },
  rejectReason:      { fontSize: 13, color: '#cc0000', fontStyle: 'italic', marginTop: 6 },
  planOption:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#eee', backgroundColor: '#fff', marginBottom: 10 },
  planOptionIcon:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  planOptionLabel:   { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
  planOptionDesc:    { fontSize: 13, color: '#999' },
  planOptionPrice:   { fontSize: 13, fontWeight: '700', marginTop: 2 },
  radioOuter:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  radioInner:        { width: 10, height: 10, borderRadius: 5 },
  durationRow:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  durationBtn:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0' },
  durationBtnActive: { backgroundColor: COLORS.roles.admin.color },
  durationBtnText:   { fontSize: 13, fontWeight: '700', color: '#666' },
  durationBtnTextActive: { color: '#fff' },
  priceSummary:      { backgroundColor: '#f8f9ff', borderRadius: 12, padding: 16, marginTop: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e0e7ff' },
  priceSummaryLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  priceSummaryValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  priceSummaryMeta:  { fontSize: 12, color: '#aaa' },
});