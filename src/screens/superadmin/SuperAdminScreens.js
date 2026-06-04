import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    RefreshControl, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/AuthService';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';
import Toast from '../../components/Toast';

// Tabs
import StatsTab         from './../../components/tabs/StatsTab';
import UsersTab         from '../../components/tabs/UsersTab';
import PharmaciesTab    from '../../components/tabs/PharmaciesTab';
import SubscriptionsTab from '../../components/tabs/SubscriptionsTab';

// Modals
import ConfirmLogoutModal  from '../../components/modals/ConfirmLogoutModal';
import ActiveModal         from '../../components/modals/ActiveModal';
import ConfirmDeleteModal  from '../../components/modals/ConfirmDeleteModal';
import SuspendModal        from '../../components/modals/SuspendModal';
import PharmacyActionModal from '../../components/modals/PharmacyActionModal';
import UpdateRoleModal     from '../../components/modals/UpdateRoleModal';
import CreateAdminModal    from '../../components/modals/CreateAdminModal';
import RejectRequestModal  from '../../components/modals/RejectRequestModal';

// ─── Config onglets ──────────────────────────────────────────────────────────
const TABS = [
    { key: 'stats',         icon: 'stats-chart',  label: 'Stats'        },
    { key: 'users',         icon: 'people',       label: 'Users'        },
    { key: 'pharmacies',    icon: 'medkit',       label: 'Pharmas'      },
    { key: 'subscriptions', icon: 'card',         label: 'Abonnements'  },
];

// ─── Composant principal ─────────────────────────────────────────────────────
export default function SuperAdminScreens() {
    const {
        user, logout,
        getGlobalStats, getAllUsers, getAllPharmacies,
        validatePharmacy, suspendPharmacy, getSubscriptionHistory,
    } = useAuth();

    // ── UI state ─────────────────────────────────────────────────────────────
    const [activeTab,  setActiveTab]  = useState('stats');
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toast,      setToast]      = useState(null);

    // ── Data ─────────────────────────────────────────────────────────────────
    const [stats,      setStats]      = useState(null);
    const [users,      setUsers]      = useState([]);
    const [pharmacies, setPharmacies] = useState([]);

    // ── Pharmacy detail ───────────────────────────────────────────────────────
    const [selectedPharmacy,    setSelectedPharmacy]    = useState(null);
    const [subscriptionHistory, setSubscriptionHistory] = useState([]);
    const [historyLoading,      setHistoryLoading]      = useState(false);

    // ── Subscriptions ─────────────────────────────────────────────────────────
    const [subscriptionsRequests, setSubscriptionsRequests] = useState([]);
    const [subRequestsLoading,    setSubRequestsLoading]    = useState(false);
    const [processingRequestId,   setProcessingRequestId]   = useState(null);

    // ── Modal states ──────────────────────────────────────────────────────────
    const [logoutModal,      setLogoutModal]      = useState(false);
    const [createAdminModal, setCreateAdminModal] = useState(false);

    const [deleteModal,  setDeleteModal]  = useState({ visible: false, userId: null,    userName: '' });
    const [suspendModal, setSuspendModal] = useState({ visible: false, userId: null,    userName: '' });
    const [activeModal,  setActiveModal]  = useState({ visible: false, userId: null,    userName: '' });
    const [roleModal,    setRoleModal]    = useState({ visible: false, userId: null,    userName: '', currentRole: '' });
    const [rejectModal,  setRejectModal]  = useState({ visible: false, requestId: null, userName: '' });

    const [pharmacyModal, setPharmacyModal] = useState({
        visible: false, type: null, pharmacyId: null, pharmacyName: '',
    });

    // ── Loading flags ─────────────────────────────────────────────────────────
    const [deleting,              setDeleting]              = useState(false);
    const [suspending,            setSuspending]            = useState(false);
    const [activating,            setActivating]            = useState(false);
    const [updatingRole,          setUpdatingRole]          = useState(false);
    const [pharmacyActionLoading, setPharmacyActionLoading] = useState(false);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const showToast = (type, title, message) =>
        setToast({ type, title, message, duration: 4000 });

    // ── Chargement initial ────────────────────────────────────────────────────
    useEffect(() => { loadDashboardData(); }, []);

    useEffect(() => {
        if (activeTab === 'subscriptions') loadSubscriptionsRequests();
    }, [activeTab]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, usersRes, pharmaciesRes] = await Promise.all([
                getGlobalStats(),
                getAllUsers({ limit: 20 }),
                getAllPharmacies({ limit: 30 }),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.users || []);
            setPharmacies(pharmaciesRes.data.pharmacies || []);
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    // ── Subscriptions ─────────────────────────────────────────────────────────
    const loadSubscriptionsRequests = async () => {
        try {
            setSubRequestsLoading(true);
            const res = await authService.getSubscriptionRequests({ status: 'all' });
            setSubscriptionsRequests(res.data?.requests || []);
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible de charger les demandes');
        } finally {
            setSubRequestsLoading(false);
        }
    };

    const handleApproveRequest = async (requestId) => {
        try {
            setProcessingRequestId(requestId);
            await authService.processSubscriptionRequest(requestId, { action: 'approve' });
            showToast('success', '✅ Succès', 'Demande d\'abonnement approuvée');
            loadSubscriptionsRequests();
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible d\'approuver la demande');
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleRejectRequest = async (requestId, rejectReason) => {
        try {
            setProcessingRequestId(requestId);
            await authService.processSubscriptionRequest(requestId, { action: 'reject', rejectReason });
            setRejectModal({ visible: false, requestId: null, userName: '' });
            showToast('success', '✅ Succès', 'Demande d\'abonnement rejetée');
            loadSubscriptionsRequests();
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible de rejeter la demande');
        } finally {
            setProcessingRequestId(null);
        }
    };

    // ── Pharmacies ────────────────────────────────────────────────────────────
    const handleValidate = (pharmacy) =>
        setPharmacyModal({ visible: true, type: 'validate', pharmacyId: pharmacy.id, pharmacyName: pharmacy.name });

    const handleSuspendPharmacy = (pharmacy) =>
        setPharmacyModal({ visible: true, type: 'suspend', pharmacyId: pharmacy.id, pharmacyName: pharmacy.name });

    const closePharmacyModal = () =>
        setPharmacyModal({ visible: false, type: null, pharmacyId: null, pharmacyName: '' });

    const confirmPharmacyAction = async (reason = '') => {
        const { type, pharmacyId } = pharmacyModal;
        setPharmacyActionLoading(true);
        try {
            if (type === 'validate') {
                await validatePharmacy(pharmacyId);
                setPharmacies(prev =>
                    prev.map(p => p.id === pharmacyId ? { ...p, status: 'active', isValidated: true } : p)
                );
                showToast('success', '✅ Succès', 'Pharmacie validée avec succès');
            } else if (type === 'suspend') {
                await suspendPharmacy(pharmacyId, reason);
                setPharmacies(prev =>
                    prev.map(p => p.id === pharmacyId ? { ...p, status: 'suspended', isSuspended: true } : p)
                );
                showToast('success', '✅ Succès', 'Pharmacie suspendue');
            }
            closePharmacyModal();
        } catch (err) {
            showToast('error', 'Erreur', err.message || 'Action impossible');
        } finally {
            setPharmacyActionLoading(false);
        }
    };

    const loadSubscriptionHistoryForPharmacy = async (pharmacyId) => {
        try {
            setHistoryLoading(true);
            const res = await getSubscriptionHistory({ pharmacyId });
            setSubscriptionHistory(res.data?.subscriptions || []);
        } catch (err) {
            console.error(err);
            setSubscriptionHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // ── Users ─────────────────────────────────────────────────────────────────
    const handleDeleteUser  = (userId, userName) => setDeleteModal({ visible: true, userId, userName });
    const handleSuspendUser = (userId, userName) => setSuspendModal({ visible: true, userId, userName });
    const handleActiveUser  = (userId, userName) => setActiveModal({ visible: true, userId, userName });
    const handleUpdateRole  = (userId, userName, currentRole) =>
        setRoleModal({ visible: true, userId, userName, currentRole });

    const confirmDelete = async () => {
        try {
            setDeleting(true);
            await authService.deleteUser(deleteModal.userId);
            setUsers(prev => prev.filter(u => u.id !== deleteModal.userId));
            setDeleteModal({ visible: false, userId: null, userName: '' });
            showToast('success', '✅ Succès', 'Utilisateur supprimé');
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible de supprimer');
        } finally {
            setDeleting(false);
        }
    };

    const confirmSuspend = async (reason) => {
        try {
            setSuspending(true);
            await authService.suspendUser(suspendModal.userId, reason);
            setUsers(prev => prev.map(u =>
                u.id === suspendModal.userId ? { ...u, isSuspended: true, status: 'suspended' } : u
            ));
            setSuspendModal({ visible: false, userId: null, userName: '' });
            showToast('success', '✅ Succès', 'Utilisateur suspendu');
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible de suspendre');
        } finally {
            setSuspending(false);
        }
    };

    const confirmActive = async () => {
        try {
            setActivating(true);
            await authService.activeUser(activeModal.userId);
            setUsers(prev => prev.map(u =>
                u.id === activeModal.userId ? { ...u, isSuspended: false, status: 'active' } : u
            ));
            setActiveModal({ visible: false, userId: null, userName: '' });
            showToast('success', '✅ Succès', 'Utilisateur réactivé');
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible d\'activer');
        } finally {
            setActivating(false);
        }
    };

    const confirmUpdateRole = async (newRole) => {
        try {
            setUpdatingRole(true);
            await authService.updateUserRole(roleModal.userId, newRole);
            setUsers(prev => prev.map(u =>
                u.id === roleModal.userId ? { ...u, role: newRole } : u
            ));
            setRoleModal({ visible: false, userId: null, userName: '', currentRole: '' });
            showToast('success', '✅ Succès', 'Rôle modifié avec succès');
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible de modifier le rôle');
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleAdminCreated = (newAdmin) => {
        setUsers(prev => [newAdmin, ...prev]);
        setCreateAdminModal(false);
        showToast('success', '✅ Succès', 'Admin créé avec succès');
    };

    // ── Loading screen ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c2bd9" />
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <LinearGradient colors={['#6c2bd9', '#9c27b0']} style={styles.header}>

                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Système de contrôle</Text>
                        <Text style={styles.headerSubtitle}>Contrôle total de Pharma Go</Text>
                    </View>
                    <View style={styles.headerActions}>
                        {activeTab === 'users' && (
                            <TouchableOpacity
                                style={styles.createAdminBtn}
                                onPress={() => setCreateAdminModal(true)}
                            >
                                <Ionicons name="person-add" size={16} color="#6c2bd9" />
                                <Text style={styles.createAdminBtnText}>+ Admin</Text>
                            </TouchableOpacity>
                        )}
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
                    <View>
                        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>
                </View>

                {/* ✅ CORRIGÉ : ScrollView horizontal comme dans AdminHomeScreen */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.tabs}>
                        {TABS.map(tab => (
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

            {/* ── Contenu ──────────────────────────────────────────────────── */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {activeTab === 'stats' && (
                    <StatsTab stats={stats} />
                )}
                {activeTab === 'users' && (
                    <UsersTab
                        users={users}
                        onDeleteUser={handleDeleteUser}
                        onSuspendUser={handleSuspendUser}
                        onActiveUser={handleActiveUser}
                        onUpdateRole={handleUpdateRole}
                        onCreateAdmin={() => setCreateAdminModal(true)}
                    />
                )}
                {activeTab === 'pharmacies' && (
                    <PharmaciesTab
                        pharmacies={pharmacies}
                        onValidate={handleValidate}
                        onSuspend={handleSuspendPharmacy}
                        selectedPharmacy={selectedPharmacy}
                        setSelectedPharmacy={(ph) => {
                            setSelectedPharmacy(ph);
                            if (!ph) setSubscriptionHistory([]);
                        }}
                        subscriptionHistory={subscriptionHistory}
                        historyLoading={historyLoading}
                        loadHistory={loadSubscriptionHistoryForPharmacy}
                    />
                )}
                {activeTab === 'subscriptions' && (
                    <SubscriptionsTab
                        requests={subscriptionsRequests}
                        loading={subRequestsLoading}
                        processingId={processingRequestId}
                        onApprove={handleApproveRequest}
                        onReject={(id, name) => setRejectModal({ visible: true, requestId: id, userName: name })}
                        onRefresh={loadSubscriptionsRequests}
                    />
                )}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ── Toast — en overlay absolu, hors du ScrollView ─────────────── */}
            {toast && (
                <Toast toast={toast} onDismiss={() => setToast(null)} />
            )}

            {/* ── Modals ────────────────────────────────────────────────────── */}
            <CreateAdminModal
                visible={createAdminModal}
                onClose={() => setCreateAdminModal(false)}
                onSuccess={handleAdminCreated}
            />
            <ConfirmDeleteModal
                visible={deleteModal.visible}
                userName={deleteModal.userName}
                loading={deleting}
                onCancel={() => setDeleteModal({ visible: false, userId: null, userName: '' })}
                onConfirm={confirmDelete}
            />
            <SuspendModal
                visible={suspendModal.visible}
                userName={suspendModal.userName}
                loading={suspending}
                onCancel={() => setSuspendModal({ visible: false, userId: null, userName: '' })}
                onConfirm={confirmSuspend}
            />
            <ActiveModal
                visible={activeModal.visible}
                userName={activeModal.userName}
                loading={activating}                          // ✅ était `active` (booléen mal nommé)
                onCancel={() => setActiveModal({ visible: false, userId: null, userName: '' })}
                onConfirm={confirmActive}
            />
            <UpdateRoleModal
                visible={roleModal.visible}
                userName={roleModal.userName}
                currentRole={roleModal.currentRole}
                loading={updatingRole}
                onCancel={() => setRoleModal({ visible: false, userId: null, userName: '', currentRole: '' })}
                onConfirm={confirmUpdateRole}
            />
            <PharmacyActionModal
                visible={pharmacyModal.visible}
                type={pharmacyModal.type}
                pharmacyName={pharmacyModal.pharmacyName}
                loading={pharmacyActionLoading}
                onClose={closePharmacyModal}
                onConfirm={confirmPharmacyAction}
            />
            <RejectRequestModal
                visible={rejectModal.visible}
                userName={rejectModal.userName}
                loading={processingRequestId === rejectModal.requestId}
                onCancel={() => setRejectModal({ visible: false, requestId: null, userName: '' })}
                onConfirm={(reason) => handleRejectRequest(rejectModal.requestId, reason)}
            />
            <ConfirmLogoutModal
                visible={logoutModal}
                onCancel={() => setLogoutModal(false)}
                onConfirm={() => { setLogoutModal(false); logout(); }}
            />
        </View>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    // Layout
    container:          { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText:        { marginTop: 16, fontSize: 16, color: '#666' },
    content:            { flex: 1 },

    // Header
    header:             { paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20 },
    headerTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle:        { fontSize: 24, fontWeight: '800', color: '#fff' },
    headerSubtitle:     { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    headerActions:      { flexDirection: 'row', alignItems: 'center', gap: 8 },

    createAdminBtn:     {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#fff', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 7,
    },
    createAdminBtnText: { fontSize: 13, fontWeight: '700', color: '#6c2bd9' },
    logoutBtn:          {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },

    // User info
    userInfo:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    avatar:             {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText:         { fontSize: 16, fontWeight: '800', color: '#fff' },
    userName:           { fontSize: 16, fontWeight: '700', color: '#fff' },
    userEmail:          { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    // Tabs — ✅ aligné sur AdminHomeScreen (horizontal scroll)
    tabs:               { flexDirection: 'row', gap: 10, paddingBottom: 5 },
    tab:                {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabActive:          { backgroundColor: 'rgba(255,255,255,0.25)' },
    tabText:            { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
    tabTextActive:      { color: '#fff', fontWeight: '700' },
});