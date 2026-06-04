// ============================================
// 👷 ÉCRAN GESTION EMPLOYÉS + GÉRANTS
// src/screens/admin/PharmacyEmployeesScreen.js
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
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminService from '../../services/AdminService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import DeleteModal from '../../components/DeleteModal';
import Toast from '../../components/Toast';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'employees', label: 'Employés',  icon: 'people-outline' },
  { key: 'managers',  label: 'Gérants',   icon: 'shield-outline'  },
];

export default function PharmacyEmployeesScreen({ route, navigation }) {
  const { pharmacy } = route.params;

  // ─── Tab actif ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('employees');

  // ─── Données ────────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employees,  setEmployees]  = useState([]);
  const [managers,   setManagers]   = useState([]);

  // ─── Modal salaire ──────────────────────────────────────────────────────────
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [selectedEmployee,   setSelectedEmployee]   = useState(null);
  const [newSalary,          setNewSalary]          = useState('');

  // ─── Modal assignation gérant ───────────────────────────────────────────────
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [emailInput,        setEmailInput]        = useState('');
  const [assigning,          setAssigning]          = useState(false);

  // ─── Modal suppression ──────────────────────────────────────────────────────
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete,       setItemToDelete]       = useState(null);   // { type: 'employee'|'manager', data }
  const [deleting,           setDeleting]           = useState(false);

  // ─── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) =>
    setToast({ type, title, message, duration: 4000 });

  // ─── Chargement ─────────────────────────────────────────────────────────────
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [empRes, mgrRes] = await Promise.all([
        AdminService.getPharmacyEmployees(pharmacy.id),
        AdminService.getPharmacyManagers?.(pharmacy.id),   // optionnel selon votre API
      ]);
      setEmployees(empRes.data.employees || []);
      setManagers(mgrRes?.data?.managers || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      showToast('error', 'Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // ─── Salaire ────────────────────────────────────────────────────────────────
  const handleUpdateSalary = (employee) => {
    setSelectedEmployee(employee);
    setNewSalary(employee.salary.toString());
    setSalaryModalVisible(true);
  };

  const confirmSalaryUpdate = async () => {
    if (!newSalary || isNaN(newSalary)) {
      showToast('error', 'Erreur', 'Montant invalide');
      return;
    }
    try {
      await AdminService.updateEmployeeSalary(
        selectedEmployee.id,
        parseFloat(newSalary),
        selectedEmployee.salaryPeriod,
      );
      showToast('success', '✅', 'Salaire mis à jour');
      setSalaryModalVisible(false);
      loadAll();
    } catch (error) {
      showToast('error', 'Erreur', error.message || 'Impossible de mettre à jour le salaire');
    }
  };

  // ─── Suppression employé ────────────────────────────────────────────────────
  const handleRemoveEmployee = (employee) => {
    setItemToDelete({ type: 'employee', data: employee });
    setDeleteModalVisible(true);
  };

  // ─── Assignation gérant ─────────────────────────────────────────────────────
  const handleAssignManager = () => {
    setEmailInput('');
    setAssignModalVisible(true);
  };

  const confirmAssignManager = async () => {
    if (!emailInput.trim()) {
      showToast('error', 'Erreur', 'Veuillez saisir une adresse email');
      return;
    }
    try {
      setAssigning(true);
      await AdminService.assignManager(pharmacy.id, emailInput.trim());
      showToast('success', '✅', 'Gérant assigné avec succès');
      setAssignModalVisible(false);
      loadAll();
    } catch (error) {
      showToast('error', 'Erreur', error.message || 'Impossible d\'assigner le gérant');
    } finally {
      setAssigning(false);
    }
  };

  // ─── Suppression gérant ─────────────────────────────────────────────────────
  const handleRemoveManager = (manager) => {
    setItemToDelete({ type: 'manager', data: manager });
    setDeleteModalVisible(true);
  };

  // ─── Confirmation suppression (employé OU gérant) ───────────────────────────
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      if (itemToDelete.type === 'employee') {
        await AdminService.removeEmployee(itemToDelete.data.id);
        showToast('success', '✅', 'Employé retiré');
      } else {
        await AdminService.removeManager(itemToDelete.data.id);
        showToast('success', '✅', 'Gérant retiré');
      }
      setDeleteModalVisible(false);
      setItemToDelete(null);
      loadAll();
    } catch (error) {
      showToast('error', 'Erreur', error.message || 'Impossible de retirer');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getSalaryPeriodLabel = (period) => ({
    hourly:  'Par heure',
    daily:   'Par jour',
    weekly:  'Par semaine',
    monthly: 'Par mois',
  }[period] || period);

  const getSalaryPeriodIcon = (period) => ({
    hourly:  'time-outline',
    daily:   'sunny-outline',
    weekly:  'calendar-outline',
    monthly: 'calendar',
  }[period] || 'calendar');

  const deleteItemName = () => {
    if (!itemToDelete) return '';
    const { type, data } = itemToDelete;
    if (type === 'employee')
      return `${data.user.firstName} ${data.user.lastName} (${data.user.email})`;
    return `${data.user?.firstName ?? ''} ${data.user?.lastName ?? ''} (${data.user?.email ?? ''})`.trim();
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.roles.admin.color} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // ─── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <LinearGradient colors={['#00b368', '#008C52']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Équipe</Text>
            <Text style={styles.headerSubtitle}>{pharmacy.name}</Text>
          </View>
          {/* Bouton contextuel (assignation gérant sur l'onglet gérants) */}
          {activeTab === 'managers' ? (
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleAssignManager}>
              <Ionicons name="person-add-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* TABS */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? COLORS.roles.admin.color : 'rgba(255,255,255,0.75)'}
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.key === 'employees' && employees.length > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                    {employees.length}
                  </Text>
                </View>
              )}
              {tab.key === 'managers' && managers.length > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                    {managers.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* CONTENU */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ─── ONGLET EMPLOYÉS ─────────────────────────────────────────────── */}
        {activeTab === 'employees' && (
          <>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={24} color={COLORS.roles.admin.color} />
                <Text style={styles.statValue}>{employees.length}</Text>
                <Text style={styles.statLabel}>Employé(s)</Text>
              </View>
            </View>

            {employees.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👷</Text>
                <Text style={styles.emptyText}>Aucun employé</Text>
                <Text style={styles.emptyHint}>
                  Ajoutez des employés depuis le dashboard principal
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {employees.map((employee) => (
                  <View key={employee.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {employee.user.firstName?.[0]}{employee.user.lastName?.[0]}
                        </Text>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>
                          {employee.user.firstName} {employee.user.lastName}
                        </Text>
                        <Text style={styles.cardRole}>{employee.position}</Text>
                        <Text style={styles.cardContact}>{employee.user.email}</Text>
                      </View>
                    </View>

                    <View style={styles.salaryContainer}>
                      <View style={styles.salaryInfo}>
                        <Ionicons name="cash" size={20} color={COLORS.success} />
                        <Text style={styles.salaryAmount}>
                          {employee.salary.toLocaleString()} FCFA
                        </Text>
                      </View>
                      <View style={styles.salaryPeriod}>
                        <Ionicons
                          name={getSalaryPeriodIcon(employee.salaryPeriod)}
                          size={16}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.salaryPeriodText}>
                          {getSalaryPeriodLabel(employee.salaryPeriod)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnPrimary]}
                        onPress={() => handleUpdateSalary(employee)}
                      >
                        <Ionicons name="create-outline" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Modifier salaire</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                        onPress={() => handleRemoveEmployee(employee)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ─── ONGLET GÉRANTS ──────────────────────────────────────────────── */}
        {activeTab === 'managers' && (
          <>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Ionicons name="shield" size={24} color={COLORS.roles.admin.color} />
                <Text style={styles.statValue}>{managers.length}</Text>
                <Text style={styles.statLabel}>Gérant(s)</Text>
              </View>
            </View>

            {/* Bouton assignation */}
            <TouchableOpacity style={styles.assignBtn} onPress={handleAssignManager}>
              <Ionicons name="person-add-outline" size={20} color="#fff" />
              <Text style={styles.assignBtnText}>Assigner un gérant</Text>
            </TouchableOpacity>

            {managers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛡️</Text>
                <Text style={styles.emptyText}>Aucun gérant</Text>
                <Text style={styles.emptyHint}>
                  Assignez un gérant à cette pharmacie
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {managers.map((manager) => (
                  <View key={manager.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.avatar, styles.avatarManager]}>
                        <Text style={styles.avatarText}>
                          {manager.user?.firstName?.[0]}{manager.user?.lastName?.[0]}
                        </Text>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>
                          {manager.user?.firstName} {manager.user?.lastName}
                        </Text>
                        <View style={styles.managerBadge}>
                          <Ionicons name="shield-checkmark" size={12} color={COLORS.roles.admin.color} />
                          <Text style={styles.managerBadgeText}>Gérant</Text>
                        </View>
                        <Text style={styles.cardContact}>{manager.user?.email}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDanger, { alignSelf: 'flex-end' }]}
                      onPress={() => handleRemoveManager(manager)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Retirer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration || 4000}
            toast={toast}
            onDismiss={() => setToast(null)}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ─── MODAL SALAIRE ──────────────────────────────────────────────────── */}
      <Modal visible={salaryModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Modifier le salaire</Text>
            <TextInput
              value={newSalary}
              onChangeText={setNewSalary}
              keyboardType="numeric"
              placeholder="Nouveau salaire"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setSalaryModalVisible(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSalaryUpdate}>
                <Text style={[styles.modalConfirm, { color: COLORS.roles.admin.color }]}>
                  Mettre à jour
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL ASSIGNATION GÉRANT ───────────────────────────────────────── */}
      <Modal visible={assignModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Ionicons name="shield-outline" size={22} color={COLORS.roles.admin.color} />
              <Text style={[styles.modalTitle, { marginBottom: 0, marginLeft: 8 }]}>
                Assigner un gérant
              </Text>
            </View>
            <Text style={styles.modalHint}>
              Saisissez l'identifiant (ID) de l'utilisateur à désigner comme gérant de{' '}
              <Text style={{ fontWeight: '700' }}>{pharmacy.name}</Text>.
            </Text>
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="Adresse email de l'utilisateur"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)} disabled={assigning}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAssignManager} disabled={assigning}>
                {assigning
                  ? <ActivityIndicator size="small" color={COLORS.roles.admin.color} />
                  : <Text style={[styles.modalConfirm, { color: COLORS.roles.admin.color }]}>
                      Assigner
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL SUPPRESSION ──────────────────────────────────────────────── */}
      <DeleteModal
        visible={deleteModalVisible}
        title={itemToDelete?.type === 'manager' ? 'Retirer le gérant' : "Supprimer l'employé"}
        message="Voulez-vous vraiment supprimer "
        itemName={deleteItemName()}
        loading={deleting}
        onCancel={() => { setDeleteModalVisible(false); setItemToDelete(null); }}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText:      { marginTop: 16, fontSize: FONTS.md, color: COLORS.textSecondary },

  // Header
  header: { paddingTop: 50, paddingBottom: 0 },
  headerContent: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerActionBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTextContainer: { flex: 1, alignItems: 'center' },
  headerTitle:         { fontSize: FONTS.xl, fontWeight: '800', color: '#fff' },
  headerSubtitle:      { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  // Tabs
  tabsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  tabActive:      { backgroundColor: '#fff' },
  tabLabel:       { fontSize: FONTS.sm, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  tabLabelActive: { color: COLORS.roles.admin.color },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1,
  },
  tabBadgeActive:    { backgroundColor: COLORS.roles.admin.bg },
  tabBadgeText:      { fontSize: 11, fontWeight: '700', color: '#fff' },
  tabBadgeTextActive:{ color: COLORS.roles.admin.color },

  content: { flex: 1 },

  // Stats card
  statsCard: {
    backgroundColor: '#fff', margin: 20, borderRadius: RADIUS.lg,
    padding: SPACING.lg, flexDirection: 'row', justifyContent: 'center',
  },
  statItem:  { alignItems: 'center' },
  statValue: { fontSize: FONTS.xxxl, fontWeight: '800', color: COLORS.textPrimary, marginTop: 8 },
  statLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 4 },

  // Assign button
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.roles.admin.color,
    marginHorizontal: 20, marginBottom: 4, borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  assignBtnText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },

  // Empty
  emptyState: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg,
    padding: SPACING.xl, alignItems: 'center', margin: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyHint: { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center' },

  // Cards
  list: { padding: 20, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md },

  cardHeader:  { flexDirection: 'row', marginBottom: 16 },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.roles.admin.bg,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarManager: { backgroundColor: '#EEF2FF' },
  avatarText:    { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.roles.admin.color },

  cardInfo:    { flex: 1 },
  cardName:    { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  cardRole:    { fontSize: FONTS.sm, color: COLORS.roles.admin.color, fontWeight: '600', marginBottom: 2 },
  cardContact: { fontSize: FONTS.sm, color: COLORS.textSecondary },

  managerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.roles.admin.bg,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4,
  },
  managerBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.roles.admin.color },

  // Salary
  salaryContainer: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: 12, marginBottom: 12,
  },
  salaryInfo:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  salaryAmount:  { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.success },
  salaryPeriod:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  salaryPeriodText: { fontSize: FONTS.sm, color: COLORS.textSecondary },

  // Actions
  actionsContainer: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md,
  },
  actionBtnPrimary: { backgroundColor: COLORS.roles.admin.color },
  actionBtnDanger:  { backgroundColor: COLORS.error, flex: 0, paddingHorizontal: 16 },
  actionBtnText:    { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: { backgroundColor: '#fff', width: '85%', borderRadius: 12, padding: 20 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  modalTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 10, color: COLORS.textSecondary },
  modalHint:   { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: 14, lineHeight: 20 },
  modalInput:  {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginBottom: 20,
    color: COLORS.textPrimary
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalCancel:  { color: 'gray', fontSize: FONTS.sm },
  modalConfirm: { fontWeight: '700', fontSize: FONTS.sm },
});