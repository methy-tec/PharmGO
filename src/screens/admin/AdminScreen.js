import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Animated, Modal } from 'react-native';
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


export default function AdminHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  //🗑 Modal pour supprimer
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pharmacyToDelete, setPharmacyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);
  
  const [subscriptionRequests, setSubscriptionRequests] = useState([]);
  const [subLoading,           setSubLoading]           = useState(false);
  const [requesting,           setRequesting]           = useState(false);
  const [upgradeModal,         setUpgradeModal]         = useState(false);

  const showToast = (type, title, message) => {
    setToast({
      type,
      title,
      message,
      duration: 4000
    });
  };

  const handleModalSuccess = (type, message) => {
    showToast(
      type,
      type === 'success' ? '✅ Succès' : '❌ Erreur',
      message,
    );
    loadDashboardData();
  };



  useEffect(() => { loadDashboardData(); }, []);
  useEffect(() => {
  if (activeTab === 'subscription') loadSubscriptionRequests();
}, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, pharmaciesRes, ordersRes, customersRes] = await Promise.all([
        AdminService.getMyStats(),
        AdminService.getMyPharmacies(),
        AdminService.getMyOrders({ limit: 10 }),
        AdminService.getMyCustomers({ limit: 10 })
      ]);

      console.log('📊 Stats Admin:', statsRes);
      
      setStats(statsRes.data);
      setPharmacies(pharmaciesRes.data.pharmacies || []);
      setOrders(ordersRes.data.orders || []);
      setCustomers(customersRes.data.customers || []);

    } catch (error) {
      console.error('❌ Erreur:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };
  

// Après loadDashboardData
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
    showToast('error', 'Erreur', err.message);
  } finally {
    setRequesting(false);
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCreatePharmacy = () => {
    setShowCreateModal(true);
  };

  const handlePharmacyCreated = () => {
    loadDashboardData();
    setShowCreateModal(false);
  }

  const handleViewPharmacy = (pharmacy) => {
    navigation.navigate('PharmacyEmployeesScreen', { pharmacy });
  };

  const handleUpdatePharmacy = async(pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setShowEditModal(true);
  }

  const handleDeletePharmacy = (pharmacy) => {
    setPharmacyToDelete(pharmacy);
    setDeleteModalVisible(true);
  };
  const handleDeleteConfirm = async () => {
    try{
      setDeleting(true);
      
      await AdminService.deletePharmacy(pharmacyToDelete.id);

      setDeleteModalVisible(false);
      setPharmacyToDelete(null);

      showToast('success', '✅ Succès', 'Pharmacie supprimée avec succès');

      loadDashboardData();

    } catch (error) {
      handleModalSuccess('error', '❌ Erreur', error.message || 'Impossible de supprimer la pharmacie');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.roles.admin.color} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00b368', '#008C52']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>🛡️ Admin</Text>
            <Text style={styles.headerSubtitle}>Gestion de mes pharmacies</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8}}>
            <TouchableOpacity 
              style={styles.headerActionBtn}
              onPress={() => setShowAddEmployeeModal(true)}
            >
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
          <View>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userSubscription}>
              {user?.subscriptionType?.toUpperCase()} • {pharmacies.length} pharmacie(s)
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {['stats', 'pharmacies', 'orders', 'customers', 'subscription'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons 
                name={
                  tab === 'stats' ? 'stats-chart' : 
                  tab === 'pharmacies' ? 'medkit' : 
                  tab === 'orders' ? 'cart' : 
                  tab === 'customers' ? 'people' : 
                  'card'
                }
                size={18}
                color={activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'stats'       ? 'Stats'   :
                tab === 'pharmacies'  ? 'Pharmas' :
                tab === 'orders'      ? 'Orders'  :
                tab === 'customers'   ? 'Clients' :
                'Abonnement'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {activeTab === 'stats' && <StatsTab stats={stats} pharmaciesCount={pharmacies.length} />}
        {activeTab === 'pharmacies' && (
          <PharmaciesTab 
            pharmacies={pharmacies} 
            onViewPharmacy={handleViewPharmacy}
            onCreatePharmacy={handleCreatePharmacy}
            onUpdatePharmacy={handleUpdatePharmacy}
            onDeletePharmacy={handleDeletePharmacy}
          />
        )}
        {activeTab === 'orders' && <OrdersTab orders={orders} />}
        {activeTab === 'customers' && <CustomersTab customers={customers} />}
        {activeTab === 'subscription' && (
  <SubscriptionTab
    user={user}
    requests={subscriptionRequests}
    loading={subLoading}
    onRequestUpgrade={() => setUpgradeModal(true)}
  />
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

      {/* Modal Ajout d'employé */}
      <AddEmployeeModal
        visible={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        onSuccess={handleModalSuccess}
        pharmacies={pharmacies}
      />

      {/* Modal Creation pharmacie */}
      <CreatePharmacyModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handlePharmacyCreated}
    />
      {/* Modal Edition pharmacie */}
      <EditPharmacyModal
        visible={showEditModal}
        pharmacy={selectedPharmacy}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleModalSuccess}
      />
      {/* Modal Suppression pharmacie */}
      <DeleteModal
        visible={deleteModalVisible}
        title='Supprimer la pharmacie ?'
        message="Voulez-vous vraiment supprimer"
        itemName={pharmacyToDelete?.name}
        loading={deleting}
        onCancel={() => {
          setDeleteModalVisible(false);
          setPharmacyToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
      <UpgradeModal
          visible={upgradeModal}
          loading={requesting}
          currentPlan={user?.subscriptionType}
          onClose={() => setUpgradeModal(false)}
          onConfirm={handleRequestUpgrade}
      />
    </View>
  );
}

// ONGLET STATS
function StatsTab({ stats, pharmaciesCount }) {
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
      <View style={styles.statsGrid}>
        <StatCard 
          icon="medkit" 
          label="Mes pharmacies" 
          value={pharmaciesCount}
          color={COLORS.roles.admin.color}
        />
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
          icon="cash" 
          label="Revenu" 
          value={stats.totalRevenue || '0 FCFA'}
          color={COLORS.success}
          isText
        />
      </View>

      <Text style={styles.subsectionTitle}>📅 Ce mois</Text>
      <View style={styles.statsGrid}>
        <StatCard 
          icon="trending-up" 
          label="Nouvelles commandes" 
          value={stats.monthlyOrders || 0}
          color={COLORS.info}
        />
        <StatCard 
          icon="person-add" 
          label="Nouveaux clients" 
          value={stats.monthlyCustomers || 0}
          color={COLORS.success}
        />
      </View>

      {/* Modal Creation pharmacie */}
    </View>
  );
}

// ONGLET PHARMACIES
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
            <TouchableOpacity
              onPress={() => onViewPharmacy(p)}
              style={styles.cardHeader}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="medkit" size={24} color={COLORS.roles.admin.color} />
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  <Text style={styles.cardMeta}>📍 {p.city}</Text>
                </View>

                <View style={[
                  styles.statusBadge,
                  { backgroundColor: p.isActive ? COLORS.successBg : COLORS.errorBg }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: p.isActive ? COLORS.success : COLORS.error }
                  ]}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* ACTIONS */}
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={styles.editBtn} 
                  onPress={() => onUpdatePharmacy(p)}>
                  <Ionicons name="create-outline" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => onDeletePharmacy(p)}>
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
          </View>
        ))
      )}
    </View>
  );
}

// ONGLET COMMANDES
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
        orders.map((order, index) => (
          <View key={order.id || index} style={styles.card}>
            <Text style={styles.cardTitle}>Commande #{order.id?.slice(0, 8)}</Text>
            <Text style={styles.cardMeta}>
              {order.customer?.firstName || ''} {order.customer?.lastName || ''} • {order.total || '0'} FCFA
            </Text>
            <Text style={styles.cardMeta}>
              🏥 {order.pharmacy?.name } • {order.status} 
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

// ONGLET CLIENTS
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
        customers.map((customer, index) => (
          <View key={customer.id || index} style={styles.card}>
            <Text style={styles.cardTitle}>
              {customer.firstName} {customer.lastName}
            </Text>
            <Text style={styles.cardMeta}>{customer.email}</Text>
          </View>
        ))
      )}
    </View>
  );
}
function SubscriptionTab({ user, requests, loading, onRequestUpgrade }) {
  const planConfig = {
    free:       { color: '#999',    icon: 'ribbon-outline',   label: 'Gratuit',      desc: '2 pharmacies · 4 employés/pharma' },
    basic:      { color: '#007aff', icon: 'star-outline',     label: 'Basic',        desc: '5 pharmacies · 10 employés/pharma' },
    premium:    { color: '#ff9500', icon: 'star-half-outline', label: 'Premium',     desc: '20 pharmacies · 50 employés/pharma' },
    enterprise: { color: '#6c2bd9', icon: 'diamond-outline',  label: 'Enterprise',  desc: 'Illimité' },
  };

  const current = planConfig[user?.subscriptionType] || planConfig.free;
  const hasPending = requests.some(r => r.status === 'pending');

  return (
    <View style={styles.tabContent}>
      {/* Carte plan actuel */}
      <View style={[subAdminStyles.currentPlanCard, { borderColor: current.color }]}>
        <View style={[subAdminStyles.planIconWrap, { backgroundColor: current.color + '20' }]}>
          <Ionicons name={current.icon} size={28} color={current.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Plan actuel</Text>
          <Text style={[subAdminStyles.planName, { color: current.color }]}>
            {current.label}
          </Text>
          <Text style={subAdminStyles.planDesc}>{current.desc}</Text>
          {user?.subscriptionExpiry && (
            <Text style={subAdminStyles.planExpiry}>
              📅 Expire le {new Date(user.subscriptionExpiry).toLocaleDateString('fr-FR')}
            </Text>
          )}
          {user?.trialEndsAt && (
            <Text style={subAdminStyles.planTrial}>
              ⏳ Essai jusqu'au {new Date(user.trialEndsAt).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
      </View>

      {/* Bouton upgrade */}
      <TouchableOpacity
        style={[subAdminStyles.upgradeBtn, hasPending && { opacity: 0.5 }]}
        onPress={onRequestUpgrade}
        disabled={hasPending}
      >
        <Ionicons name="arrow-up-circle" size={20} color="#fff" />
        <Text style={subAdminStyles.upgradeBtnText}>
          {hasPending ? 'Demande en cours...' : 'Demander un abonnement'}
        </Text>
      </TouchableOpacity>

      {hasPending && (
        <View style={subAdminStyles.pendingBanner}>
          <Ionicons name="time-outline" size={16} color="#856404" />
          <Text style={subAdminStyles.pendingBannerText}>
            Une demande est en attente de validation par le superadmin.
          </Text>
        </View>
      )}

      {/* Historique des demandes */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        📋 Mes demandes
      </Text>

      {loading ? (
        <ActivityIndicator color={COLORS.roles.admin.color} style={{ marginTop: 20 }} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Aucune demande effectuée</Text>
        </View>
      ) : (
        requests.map(req => {
          const cfg = planConfig[req.requestedPlan] || planConfig.free;
          return (
            <View key={req.id} style={[
              subAdminStyles.requestItem,
              req.status === 'approved' && { borderColor: '#c8e6c9', backgroundColor: '#f9fff9' },
              req.status === 'rejected' && { borderColor: '#ffd6d6', backgroundColor: '#fff9f9' },
            ]}>
              <View style={subAdminStyles.requestItemHeader}>
                <View style={[subAdminStyles.requestPlanBadge, { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}>
                  <Text style={[subAdminStyles.requestPlanText, { color: cfg.color }]}>
                    {req.requestedPlan?.toUpperCase()}
                  </Text>
                </View>
                <Text style={subAdminStyles.requestDuration}>· {req.durationMonths} mois</Text>
                <View style={[
                  subAdminStyles.statusPill,
                  req.status === 'pending'  && { backgroundColor: '#fff3cd' },
                  req.status === 'approved' && { backgroundColor: '#d4edda' },
                  req.status === 'rejected' && { backgroundColor: '#f8d7da' },
                ]}>
                  <Text style={[
                    subAdminStyles.statusPillText,
                    req.status === 'pending'  && { color: '#856404' },
                    req.status === 'approved' && { color: '#155724' },
                    req.status === 'rejected' && { color: '#721c24' },
                  ]}>
                    {req.status === 'pending'  ? '⏳ En attente' :
                     req.status === 'approved' ? '✅ Approuvé'   : '❌ Rejeté'}
                  </Text>
                </View>
              </View>
              <Text style={subAdminStyles.requestDate}>
                📅 {new Date(req.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </Text>
              {req.status === 'rejected' && req.rejectReason && (
                <Text style={subAdminStyles.rejectReason}>💬 {req.rejectReason}</Text>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}
function UpgradeModal({ visible, loading, currentPlan, onClose, onConfirm }) {
  const [selectedPlan,     setSelectedPlan]     = useState('');
  const [durationMonths,   setDurationMonths]   = useState(1);

  const plans = [
    { key: 'basic',      label: 'Basic',      color: '#007aff', desc: '5 pharmacies · 10 employés' },
    { key: 'standard',    label: 'Standard',    color: '#ff9500', desc: '20 pharmacies · 50 employés' },
    { key: 'premium', label: 'Premium', color: '#6c2bd9', desc: 'Illimité' },
  ].filter(p => p.key !== currentPlan);

  const handleConfirm = () => {
    if (!selectedPlan) return;
    onConfirm({ subscriptionType: selectedPlan, durationMonths });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
          <LinearGradient colors={['#00b368', '#008C52']} style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="arrow-up-circle" size={22} color="#fff" />
              </View>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>Demande d'abonnement</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Demande au gerent de systeme</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={{ padding: 20 }}>
            {/* Sélection plan */}
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Choisir un plan</Text>
            {plans.map(plan => (
              <TouchableOpacity
                key={plan.key}
                style={[subAdminStyles.planOption,
                  selectedPlan === plan.key && { borderColor: plan.color, backgroundColor: plan.color + '10' }
                ]}
                onPress={() => setSelectedPlan(plan.key)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[subAdminStyles.planOptionLabel, selectedPlan === plan.key && { color: plan.color }]}>
                    {plan.label}
                  </Text>
                  <Text style={subAdminStyles.planOptionDesc}>{plan.desc}</Text>
                </View>
                <View style={[subAdminStyles.radioOuter, selectedPlan === plan.key && { borderColor: plan.color }]}>
                  {selectedPlan === plan.key && (
                    <View style={[subAdminStyles.radioInner, { backgroundColor: plan.color }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Durée */}
            <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>Durée</Text>
            <View style={subAdminStyles.durationRow}>
              {[1, 3, 6, 12].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[subAdminStyles.durationBtn, durationMonths === m && subAdminStyles.durationBtnActive]}
                  onPress={() => setDurationMonths(m)}
                >
                  <Text style={[subAdminStyles.durationBtnText, durationMonths === m && subAdminStyles.durationBtnTextActive]}>
                    {m} mois
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
            <TouchableOpacity
              style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}
              onPress={onClose} disabled={loading}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#666' }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[{ flex: 2, height: 50, borderRadius: 12, backgroundColor: '#00b368', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
                (!selectedPlan || loading) && { opacity: 0.4 }
              ]}
              onPress={handleConfirm}
              disabled={!selectedPlan || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <><Ionicons name="send" size={16} color="#fff" /><Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Envoyer la demande</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// COMPOSANTS
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
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FONTS.lg, fontWeight: '800', color: '#fff' },
  userName: { fontSize: FONTS.md, fontWeight: '700', color: '#fff' },
  userEmail: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.8)' },
  userSubscription: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1 },
  tabContent: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary },
  subsectionTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.roles.admin.color, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, borderLeftWidth: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginBottom: 4 },
  statValue: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.textPrimary },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  cardMeta: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  statusText: { fontSize: FONTS.xs, fontWeight: '700' },
  emptyState: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginTop: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FONTS.md, color: COLORS.textSecondary, marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.roles.admin.color, paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.md },
  emptyBtnText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10
  },
  editBtn: {
    backgroundColor: COLORS.info,
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  deleteBtn: {
    backgroundColor: COLORS.error,
    padding: 8,
    borderRadius: RADIUS.sm,
  },
});
const subAdminStyles = StyleSheet.create({
  currentPlanCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 2 },
  planIconWrap:       { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  planName:           { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  planDesc:           { fontSize: 13, color: '#666' },
  planExpiry:         { fontSize: 12, color: '#999', marginTop: 4 },
  planTrial:          { fontSize: 12, color: '#ff9500', marginTop: 4, fontWeight: '600' },
  upgradeBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.roles.admin.color, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  upgradeBtnText:     { fontSize: 15, fontWeight: '800', color: '#fff' },
  pendingBanner:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff8dc', borderRadius: 10, padding: 12, marginBottom: 8 },
  pendingBannerText:  { flex: 1, fontSize: 13, color: '#856404', fontWeight: '500' },
  requestItem:        { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#eee' },
  requestItemHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  requestPlanBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5 },
  requestPlanText:    { fontSize: 12, fontWeight: '800' },
  requestDuration:    { fontSize: 13, color: '#999', fontWeight: '600', flex: 1 },
  statusPill:         { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusPillText:     { fontSize: 11, fontWeight: '700' },
  requestDate:        { fontSize: 12, color: '#aaa' },
  rejectReason:       { fontSize: 13, color: '#cc0000', fontStyle: 'italic', marginTop: 6 },
  planOption:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#eee', backgroundColor: '#fff', marginBottom: 10 },
  planOptionLabel:    { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
  planOptionDesc:     { fontSize: 13, color: '#999' },
  radioOuter:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  radioInner:         { width: 10, height: 10, borderRadius: 5 },
  durationRow:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  durationBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0' },
  durationBtnActive:  { backgroundColor: COLORS.roles.admin.color },
  durationBtnText:    { fontSize: 13, fontWeight: '700', color: '#666' },
  durationBtnTextActive: { color: '#fff' },
});