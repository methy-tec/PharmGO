import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/AuthService';
import AuthContext, { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import Toast from '../../components/Toast';

// Tabs
import StatsTab from './../../components/tabs/StatsTab';
import UsersTab         from '../../components/tabs/UsersTab';
import PharmaciesTab    from '../../components/tabs/PharmaciesTab';
import SubscriptionsTab from '../../components/tabs/SubscriptionsTab';

//Modal 
import ConfirmLogoutModal from '../../components/modals/ConfirmLogoutModal';
import ActiveModal from '../../components/modals/ActiveModal';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import SuspendModal from '../../components/modals/SuspendModal';
import PharmacyActionModal from '../../components/modals/PharmacyActionModal';
import UpdateRoleModal from '../../components/modals/UpdateRoleModal';
import CreateAdminModal from '../../components/modals/CreateAdminModal';
import RejectRequestModal from '../../components/modals/RejectRequestModal.js';

const ROLES = ['user', 'pharmacie', 'admin'];

export default function SuperAdminScreens(){
    const { user, logout, getGlobalStats, getAllUsers, getAllPharmacies, validatePharmacy, suspendPharmacy, getSubscriptionHistory} = useAuth();
    const [logoutModal, setLogoutModal] = useState(false);

    const [activeTab, setActiveTab] = useState('stats');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats]  = useState(null);
    const [users, setUsers] = useState([]);
    const [pharmacies, setPharmacies] = useState([]);
    
    // Pharmacies states
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [subscriptionHistory, setSubscriptionHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // ✅ FIX : pharmacyName (pas name) dans le state
    const [pharmacyModal, setPharmacyModal] = useState({
        visible: false,
        type: null,
        pharmacyId: null,
        pharmacyName: ''   // ← était 'name', corrigé en 'pharmacyName'
    });

    // Modals users
    const [createAdminModal, setCreateAdminModal] = useState(false);
    const [deleteModal,  setDeleteModal]  = useState({ visible: false, userId: null, userName: '' });
    const [suspendModal, setSuspendModal] = useState({ visible: false, userId: null, userName: '' });
    // Ajouter ces states manquants en haut du composant
    const [activeModal, setActiveModal] = useState({ visible: false, userId: null, userName: '' });
    const [active, setActive] = useState(false);
    const [roleModal,    setRoleModal]    = useState({ visible: false, userId: null, userName: '', currentRole: '' });

    // Loading states
    const [deleting,         setDeleting]          = useState(false);
    const [suspending,       setSuspending]         = useState(false);
    const [updatingRole,     setUpdatingRole]       = useState(false);
    const [pharmacyActionLoading, setPharmacyActionLoading] = useState(false);

    // Toast state
    const [toast, setToast] = useState(null);

    // ── SUBSCRIPTIONS ────────────────────────────────────────────────────────
    const [subscriptionsRequests, setSubscriptionsRequests] = useState([]);
    const [subRequestsLoading, setSubRequestsLoading] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState(null);
    const [rejectModal, setRejectModal] = useState({ visible: false, requestId: null, userName: '' });
    
    const showToast = (type, title, message) => {
        setToast({ type, title, message, duration: 4000 });
    }

    // Ajoute ce useEffect séparé pour le chargement initial
    useEffect(() => { loadDashboardData(); }, []);

    useEffect(() => {
        if(activeTab === 'subscriptions') loadSubscriptionsRequests();
    }, [activeTab]);


    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, usersRes, pharmaciesRes] = await Promise.all([
                getGlobalStats(),
                getAllUsers({ limit: 20 }),
                getAllPharmacies({ limit: 30 })
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.users || []);
            setPharmacies(pharmaciesRes.data.pharmacies || []);
        } catch(error) {
            showToast('error', 'Erreur', error.message || 'Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const loadSubscriptionsRequests = async () => {
        try {
            setSubRequestsLoading(true);
            const res = await authService.getSubscriptionRequests({ status: 'all' }); // ← CORRECT
            setSubscriptionsRequests(res.data?.requests || []);
        } catch(error) {
            showToast('error', 'Erreur', error.message || 'Impossible de charger les demandes');
        } finally {
            setSubRequestsLoading(false);
        }
    };
    const handleApproveRequest = async (requestId) => {
        try {
            setProcessingRequestId(requestId);
            await authService.processSubscriptionRequest(requestId, { action: 'approve' });
            setSubscriptionsRequests(prev => 
                prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r)
            )
            showToast('success', '✅ Succès', 'Demande d\'abonnement approuvée avec succès');
            loadSubscriptionsRequests();
        } catch(error) {
            showToast('error', 'Erreur', error.message || 'Impossible d\'approuver la demande d\'abonnement');
        } finally {
            setProcessingRequestId(null);
        }
    }

    const handleRejectRequest = async (requestId, rejectReason) => {
        try{
            setProcessingRequestId(requestId);
            await authService.processSubscriptionRequest(requestId, { action: 'reject', rejectReason });

            setSubscriptionsRequests(prev => 
                prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r)
            )
            setRejectModal({ visible: false, requestId: null, userName: ''});
            showToast('success', '✅ Succès', 'Demande d\'abonnement rejetée avec succès');
            loadSubscriptionsRequests();
        } catch(error) {
            showToast('error', 'Erreur', error.message || 'Impossible de rejeter la demande d\'abonnement');
        } finally {
            setProcessingRequestId(null);
        }
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    // ── PHARMACIES ACTIONS ───────────────────────────────────────────────────
    const handleValidate = (pharmacy) => {
        setPharmacyModal({
            visible: true,
            type: 'validate',
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.name   // ✅ pharmacyName
        });
    };

    const handleSuspend = (pharmacy) => {
        setPharmacyModal({
            visible: true,
            type: 'suspend',
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.name   // ✅ pharmacyName
        });
    };

    const closePharmacyModal = () =>
        setPharmacyModal({ visible: false, type: null, pharmacyId: null, pharmacyName: '' });

    // ✅ FIX : la raison n'est requise que pour 'suspend', pas 'validate'
    const confirmPharmacyAction = async (reason = '') => {
        const { type, pharmacyId } = pharmacyModal;
        setPharmacyActionLoading(true);
        try {
            if (type === 'validate') {
                await validatePharmacy(pharmacyId);
                setPharmacies(prev =>
                    prev.map(p => p.id === pharmacyId ? { ...p, status: 'active', isValidated: true } : p)
                );
                closePharmacyModal();
                showToast('success', '✅ Succès', 'Pharmacie validée avec succès');
            } else if (type === 'suspend') {
                // La validation de la raison est faite dans le modal lui-même
                await suspendPharmacy(pharmacyId, reason);
                setPharmacies(prev =>
                    prev.map(p => p.id === pharmacyId ? { ...p, status: 'suspended', isSuspended: true } : p)
                );
                closePharmacyModal();
                showToast('success', '✅ Succès', 'Pharmacie suspendue');
            }
        } catch(err) {
            showToast('error', 'Erreur', err.message || 'Impossible de valider/suspendre');
        } finally {
            setPharmacyActionLoading(false);
        }
    };

    const loadSubscriptionHistoryForPharmacy = async (pharmacyId) => {
        try {
            setHistoryLoading(true);
            const res = await getSubscriptionHistory({ pharmacyId });
            setSubscriptionHistory(res.data?.subscriptions || []);
        } catch(err) {
            console.error(err);
            setSubscriptionHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // ── DELETE ───────────────────────────────────────────────────────────────
    const handleDeleteUser = (userId, userName) =>
        setDeleteModal({ visible: true, userId, userName });

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

    // ── SUSPEND USER et Active ─────────────────────────────────────────────────────────
    const handleSuspendUser = (userId, userName) =>
        setSuspendModal({ visible: true, userId, userName });

    const confirmSuspend = async (reason) => {
        try {
            setSuspending(true);
            await authService.suspendUser(suspendModal.userId, reason);
            
            setUsers(prev => prev.map(u =>
                u.id === suspendModal.userId 
                    ? { ...u, isSuspended: true, status: 'suspended' } : u
            ));

            setSuspendModal({ visible: false, userId: null, userName: '' });
            showToast('success', '✅ Succès', 'Utilisateur suspendu');
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible de suspendre');
        } finally {
            setSuspending(false);
        }
    };

    const handleActiveUser = (userId, userName) =>
        setActiveModal({ visible: true, userId, userName });

    const confirmActive = async () => {
        try {
            setActive(true);
            await authService.activeUser(activeModal.userId);
            setUsers(prev => prev.map(u =>
                u.id === activeModal.userId ? { ...u, isSuspended: false, status: 'active' } : u
            ));
            setActiveModal({ visible: false, userId: null, userName: '' });
            showToast('success', '✅ Succès', 'Utilisateur actif');
        } catch (error) {
            showToast('error', 'Erreur', error.message || 'Impossible d activer');
        } finally {
            setActive(false);
        }
    };

    // ── UPDATE ROLE ──────────────────────────────────────────────────────────
    const handleUpdateRole = (userId, userName, currentRole) =>
        setRoleModal({ visible: true, userId, userName, currentRole });

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

    // ── CREATE ADMIN ─────────────────────────────────────────────────────────
    const handleAdminCreated = (newAdmin) => {
        setUsers(prev => [newAdmin, ...prev]);
        setCreateAdminModal(false);
        showToast('success', '✅ Succès', 'Admin créé avec succès');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6c2bd9"/>
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#6c2bd9', '#9c27b0']} style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Système de contrôle</Text>
                        <Text style={styles.headerSubtitle}>Contrôle total de Pharma Go</Text>
                    </View>
                    <View style={styles.headerActions}>
                        {activeTab === 'users' && (
                            <TouchableOpacity style={styles.createAdminBtn} onPress={() => setCreateAdminModal(true)}>
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
                        <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>
                </View>

                <View style={styles.tabs}>
                    {['stats', 'users', 'pharmacies', 'subscriptions'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Ionicons
                                name={
                                    tab === 'stats' ? 'stats-chart' : 
                                    tab === 'users' ? 'people' : 
                                    tab === 'pharmacies' ? 'medkit' : 
                                    'card'
                                }
                                size={20}
                                color={activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)'}
                            />
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'stats' ? 'Stats' :
                                 tab === 'users' ? 'Users' :
                                 tab === 'pharmacies' ? 'Pharmas':
                                 'Abonnements'
                                }
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {activeTab === 'stats' && <StatsTab stats={stats} />}
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
                        onSuspend={handleSuspend}
                        selectedPharmacy={selectedPharmacy}
                        setSelectedPharmacy={(ph) => {
                            setSelectedPharmacy(ph);
                            // ✅ reset history quand on déselectionne
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
            {
                            toast && (
                                <Toast
                                    toast={toast}
                                    onDismiss={() => setToast(null)}
                                />
                            )
                        }

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
                loading={active}
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

            {/* ✅ FIX : pharmacyName (pas name) */}
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


function getStatusColor(status) {
    if (status === 'pending')   return { bg: '#fff3cd', text: '#856404' };
    if (status === 'active')    return { bg: '#d4edda', text: '#155724' };
    if (status === 'suspended') return { bg: '#f8d7da', text: '#721c24' };
    return { bg: '#e2e3e5', text: '#495057' };
}

const getRoleColor = (role) => ({
    superadmin: '#6c2bd9', admin: '#007aff', pharmacist: '#ff9500', user: '#34c759'
}[role] || '#999');

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
    container:          { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText:        { marginTop: 16, fontSize: 16, color: '#666' },
    header:             { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    headerTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle:        { fontSize: 28, fontWeight: '800', color: '#fff' },
    headerSubtitle:     { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    headerActions:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
    createAdminBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
    createAdminBtnText: { fontSize: 13, fontWeight: '700', color: '#6c2bd9' },
    logoutBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    userInfo:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    avatar:             { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    avatarText:         { fontSize: 18, fontWeight: '800', color: '#fff' },
    userName:           { fontSize: 16, fontWeight: '700', color: '#fff' },
    userEmail:          { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    tabs:               { flexDirection: 'row', gap: 8 },
    tab:                { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
    tabActive:          { backgroundColor: 'rgba(255,255,255,0.25)' },
    tabText:            { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
    tabTextActive:      { color: '#fff' },
    content:            { flex: 1 },
    tabContent:         { padding: 20 },
    tabHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle:       { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 12 },
    addBtn:             { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6c2bd9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    addBtnText:         { fontSize: 13, fontWeight: '700', color: '#fff' },
    emptyText:          { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 20 },
    card:               { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
    cardSuspended:      { opacity: 0.7, borderWidth: 1.5, borderColor: '#ffe4cc' },
    cardSelected:       { borderWidth: 2, borderColor: '#6c2bd9', backgroundColor: '#faf8ff' },
    cardHeader:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardAvatar:         { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    cardAvatarText:     { fontSize: 14, fontWeight: '800' },
    cardTitle:          { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
    cardMeta:           { fontSize: 13, color: '#666' },
    cardFooter:         { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    cardActions:        { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
    actionBtn:          { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f0f4ff', borderWidth: 1, borderColor: '#dce8ff', alignItems: 'center', justifyContent: 'center' },
    actionBtnSuccess:   { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#c8e6c9', alignItems: 'center', justifyContent: 'center' },
    actionBtnWarning:   { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff8f0', borderWidth: 1, borderColor: '#ffe4cc', alignItems: 'center', justifyContent: 'center' },
    roleBadge:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleBadgeText:      { fontSize: 12, fontWeight: '700', color: '#fff' },
    suspendedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    suspendedBadgeText: { fontSize: 11, fontWeight: '600', color: '#ff9500' },
    protectedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0e8ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    protectedText:      { fontSize: 11, fontWeight: '600', color: '#6c2bd9' },
    statusBadge:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusBadgeText:    { fontSize: 12, fontWeight: '700' },

    // Historique abonnements
    historySection:     { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#eee' },
    historyTitle:       { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
    subscriptionItem:   { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 10, marginBottom: 8 },
    subLine:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    subPlan:            { fontWeight: '700', color: '#333', fontSize: 14 },
    subStatus:          { fontSize: 13, fontWeight: '600' },
    subDates:           { color: '#666', fontSize: 12 },
    subPrice:           { color: '#6c2bd9', fontWeight: '700', marginTop: 4, fontSize: 13 },
    emptyHistory:       { color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },

    // Overlay
    overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    overlayBottom:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    confirmBox:         { backgroundColor: '#fff', borderRadius: 20, margin: 30, padding: 28, alignItems: 'center', width: '85%' },
    confirmIconWrap:    { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    confirmTitle:       { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 10 },
    confirmMsg:         { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    confirmBold:        { fontWeight: '800', color: '#333' },
    confirmRow:         { flexDirection: 'row', gap: 12, width: '100%' },
    sheetBox:           { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    sheetHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    sheetHeaderLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sheetIconWrap:      { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    sheetTitle:         { fontSize: 17, fontWeight: '800', color: '#fff' },
    sheetSubtitle:      { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    sheetCloseBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    sheetBody:          { padding: 20, maxHeight: 420 },
    sheetFooter:        { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    infoBanner:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0e8ff', borderRadius: 10, padding: 12, marginBottom: 20 },
    infoBannerText:     { flex: 1, fontSize: 13, color: '#6c2bd9', fontWeight: '500' },
    formRow:            { flexDirection: 'row' },
    formGroup:          { marginBottom: 16 },
    formLabel:          { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
    inputWrap:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f7f7', borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', paddingHorizontal: 12, height: 48 },
    inputError:         { borderColor: '#ff3b30', backgroundColor: '#fff8f8' },
    inputIcon:          { marginRight: 8 },
    input:              { flex: 1, fontSize: 14, color: '#333' },
    eyeBtn:             { padding: 4 },
    textAreaWrap:       { backgroundColor: '#f7f7f7', borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', padding: 12, minHeight: 90, width: '100%' },
    textArea:           { fontSize: 14, color: '#333', textAlignVertical: 'top', minHeight: 70 },
    errorText:          { fontSize: 12, color: '#ff3b30', marginTop: 4 },
    roleList:           { gap: 10 },
    roleOption:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#eee', backgroundColor: '#fff' },
    roleOptionIcon:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    roleOptionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    roleOptionLabel:    { fontSize: 15, fontWeight: '700', color: '#333' },
    roleOptionDesc:     { fontSize: 12, color: '#999' },
    currentBadge:       { backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    currentBadgeText:   { fontSize: 10, fontWeight: '700', color: '#2e7d32' },
    radioOuter:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    radioInner:         { width: 10, height: 10, borderRadius: 5 },
    btnOutline:         { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    btnOutlineText:     { fontSize: 15, fontWeight: '700', color: '#666' },
    btnSolid:           { flex: 2, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSolidText:       { fontSize: 15, fontWeight: '800', color: '#fff' },
    // Ajouter dans styles.StyleSheet
refreshBtn: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: '#f0e8ff', alignItems: 'center', justifyContent: 'center' 
},
});
// Nouveau StyleSheet séparé pour les subscriptions
const subStyles = StyleSheet.create({
    filterRow:           { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
    filterBtn:           { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
    filterBtnActive:     { backgroundColor: '#6c2bd9' },
    filterBtnText:       { fontSize: 12, fontWeight: '600', color: '#666' },
    filterBtnTextActive: { color: '#fff' },
    requestCard:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#eee' },
    requestCardApproved: { borderColor: '#c8e6c9', backgroundColor: '#f9fff9' },
    requestCardRejected: { borderColor: '#ffd6d6', backgroundColor: '#fff9f9', opacity: 0.8 },
    requestHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    requestAvatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0e8ff', alignItems: 'center', justifyContent: 'center' },
    requestAvatarText:   { fontSize: 13, fontWeight: '800', color: '#6c2bd9' },
    requestName:         { fontSize: 15, fontWeight: '700', color: '#333' },
    requestEmail:        { fontSize: 12, color: '#999', marginTop: 1 },
    statusPill:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    statusPillText:      { fontSize: 11, fontWeight: '700' },
    planRow:             { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    planPill:            { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1.5 },
    planPillText:        { fontSize: 12, fontWeight: '800' },
    durationText:        { fontSize: 13, color: '#999', fontWeight: '600' },
    requestDate:         { fontSize: 12, color: '#aaa', marginBottom: 8 },
    rejectReasonBox:     { backgroundColor: '#fff1f0', borderRadius: 8, padding: 10, marginBottom: 8 },
    rejectReasonText:    { fontSize: 13, color: '#cc0000', fontStyle: 'italic' },
    requestActions:      { flexDirection: 'row', gap: 10, marginTop: 4 },
    rejectBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#ffd6d6', backgroundColor: '#fff1f0' },
    rejectBtnText:       { fontSize: 14, fontWeight: '700', color: '#ff3b30' },
    approveBtn:          { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#00b368' },
    approveBtnText:      { fontSize: 14, fontWeight: '700', color: '#fff' },
});