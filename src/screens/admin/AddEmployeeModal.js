import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdminService from '../../services/AdminService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import Toast from '../../components/Toast';
import authService from '../../services/AuthService';

export default function AddEmployeeModal({ visible, onClose, onSuccess, pharmacies }) {
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    pharmacyId: '',
    userId: '',
    position: '',
    salary: '',
    salaryPeriod: 'monthly'
  });
  const [errors, setErrors] = useState({});
  
  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) => {
    setToast({ 
      type, 
      title, 
      message,
      duration: 4000,
    });
  };

  useEffect(() => {
    if (visible) {
      loadAvailableUsers();
    }
  }, [visible]);

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await AdminService.getAllUsers({ role: 'user', limit: 100 });
      setAvailableUsers(response.data.users || []);
    } catch (error) {
      showToast('error', 'Erreur', error.message || 'Impossible de charger les utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.pharmacyId) newErrors.pharmacyId = 'Sélectionnez une pharmacie';
    if (!formData.userId) newErrors.userId = 'Sélectionnez un utilisateur';
    if (!formData.position.trim()) newErrors.position = 'Poste requis';
    
    if (!formData.salary) {
      newErrors.salary = 'Salaire requis';
    } else if (isNaN(formData.salary) || parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'Salaire invalide';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast('info', 'Validation', 'Veuillez vérifier les champs');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('info', 'Validation', 'Veuillez vérifier les champs');
      return;
    }

    try {
      setLoading(true);
      const employeeData = {
        pharmacyId: formData.pharmacyId,
        userId: formData.userId,
        position: formData.position,
        salary: parseFloat(formData.salary),
        salaryPeriod: formData.salaryPeriod
      };

      const response = await AdminService.addEmployee(employeeData);

      if (response.success) {
        showToast('success', 'Succès', response.message || 'Employé ajouté avec succès');
        onSuccess('success', 'Employé ajouté avec succès');
        handleClose();
      }
    } catch (rawError) {
      const statusCode = rawError?.statusCode || rawError?.status || null;
      const requiresUpgrade = rawError?.requiresUpgrade || rawError?.data?.requiresUpgrade || false;
      const message = rawError?.message || rawError?.data?.message || 'Une erreur inattendue est survenue.';
      console.error('Erreur ajout employé:', { message, statusCode, requiresUpgrade });
      
      if (requiresUpgrade) {
        showToast(
          'upgrade',
          '🔒 Limite atteinte',
          message,
          {label: 'Voir les plans',
            onPress: () => {
              // Navigation vers abonnements
            }
          },
          600
        );
      } else {
        showToast(
          'error', 
          getErrorTitle(statusCode),
          message,
          null,
          5000
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      pharmacyId: '',
      userId: '',
      position: '',
      salary: '',
      salaryPeriod: 'monthly'
    });
    setSearchQuery('');
    setErrors({});
    onClose();
  };

  const getFilteredUsers = () => {
    if (!searchQuery) return availableUsers;
    const query = searchQuery.toLowerCase();
    return availableUsers.filter(u =>
      u.firstName?.toLowerCase().includes(query) ||
      u.lastName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  };

  const salaryPeriods = [
    { value: 'hourly', label: 'Par heure', icon: 'time-outline' },
    { value: 'daily', label: 'Par jour', icon: 'sunny-outline' },
    { value: 'weekly', label: 'Par semaine', icon: 'calendar-outline' },
    { value: 'monthly', label: 'Par mois', icon: 'calendar' }
  ];

  const selectedUser = availableUsers.find(u => u.id === formData.userId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <LinearGradient colors={['#00b368', '#008C52']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ajouter un employé</Text>
            <View style={{ width: 40 }} />
          </View>
          <Text style={styles.headerHint}>
            Transférez un utilisateur (Patient) comme employé
          </Text>
        </LinearGradient>

        {/* FORMULAIRE */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            
            {/* Sélection pharmacie */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Pharmacie *</Text>
              {pharmacies.length === 0 ? (
                <View style={styles.warningBox}>
                  <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
                  <Text style={styles.warningText}>
                    Vous devez d'abord créer une pharmacie
                  </Text>
                </View>
              ) : (
                <View style={[styles.inputContainer, errors.pharmacyId && styles.inputError]}>
                  <Ionicons name="medkit-outline" size={20} color={COLORS.textSecondary} />
                  <View style={styles.pickerContainer}>
                    {pharmacies.map((pharmacy) => (
                      <TouchableOpacity
                        key={pharmacy.id}
                        style={[
                          styles.pharmacyOption,
                          formData.pharmacyId === pharmacy.id && styles.pharmacyOptionSelected
                        ]}
                        onPress={() => updateField('pharmacyId', pharmacy.id)}
                      >
                        <View style={styles.radioOuter}>
                          {formData.pharmacyId === pharmacy.id && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <Text style={styles.pharmacyOptionText}>{pharmacy.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {errors.pharmacyId && <Text style={styles.errorText}>{errors.pharmacyId}</Text>}
            </View>

            {/* Sélection utilisateur */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Utilisateur (Patient) *</Text>
              
              {loadingUsers ? (
                <ActivityIndicator color={COLORS.roles.admin.color} />
              ) : availableUsers.length === 0 ? (
                <View style={styles.warningBox}>
                  <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
                  <Text style={styles.warningText}>
                    Aucun utilisateur disponible (rôle Patient)
                  </Text>
                </View>
              ) : (
                <>
                  {/* Barre de recherche */}
                  <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Rechercher par nom ou email..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  {/* Liste utilisateurs */}
                  <View style={[styles.userListContainer, errors.userId && styles.inputError]}>
                    <ScrollView style={styles.userList} nestedScrollEnabled>
                      {getFilteredUsers().map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={[
                            styles.userOption,
                            formData.userId === user.id && styles.userOptionSelected
                          ]}
                          onPress={() => updateField('userId', user.id)}
                        >
                          <View style={styles.radioOuter}>
                            {formData.userId === user.id && (
                              <View style={styles.radioInner} />
                            )}
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={styles.userName}>
                              {user.firstName} {user.lastName}
                            </Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                      {getFilteredUsers().length === 0 && (
                        <Text style={styles.noResults}>Aucun résultat</Text>
                      )}
                    </ScrollView>
                  </View>
                </>
              )}
              {errors.userId && <Text style={styles.errorText}>{errors.userId}</Text>}
            </View>

            {/* Utilisateur sélectionné (aperçu) */}
            {selectedUser && (
              <View style={styles.selectedUserCard}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <View style={styles.selectedUserInfo}>
                  <Text style={styles.selectedUserName}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Text>
                  <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
                </View>
              </View>
            )}

            {/* Poste */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Poste / Fonction *</Text>
              <View style={[styles.inputContainer, errors.position && styles.inputError]}>
                <Ionicons name="briefcase-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Pharmacien, Vendeur, Caissier..."
                  value={formData.position}
                  onChangeText={(text) => updateField('position', text)}
                  autoCapitalize="words"
                />
              </View>
              {errors.position && <Text style={styles.errorText}>{errors.position}</Text>}
            </View>

            {/* Salaire */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Salaire (FCFA) *</Text>
              <View style={[styles.inputContainer, errors.salary && styles.inputError]}>
                <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 150000"
                  value={formData.salary}
                  onChangeText={(text) => updateField('salary', text)}
                  keyboardType="number-pad"
                />
              </View>
              {errors.salary && <Text style={styles.errorText}>{errors.salary}</Text>}
            </View>

            {/* Période de salaire */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Période de paiement *</Text>
              <View style={styles.salaryPeriodContainer}>
                {salaryPeriods.map((period) => (
                  <TouchableOpacity
                    key={period.value}
                    style={[
                      styles.periodOption,
                      formData.salaryPeriod === period.value && styles.periodOptionActive
                    ]}
                    onPress={() => updateField('salaryPeriod', period.value)}
                  >
                    <Ionicons 
                      name={period.icon} 
                      size={20} 
                      color={formData.salaryPeriod === period.value ? '#fff' : COLORS.textSecondary}
                    />
                    <Text style={[
                      styles.periodLabel,
                      formData.salaryPeriod === period.value && styles.periodLabelActive
                    ]}>
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BOUTON SUBMIT */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, (loading || pharmacies.length === 0 || availableUsers.length === 0) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading || pharmacies.length === 0 || availableUsers.length === 0}
          >
            <LinearGradient
              colors={['#00b368', '#008C52']}
              style={styles.submitBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={22} color="#fff" />
                  <Text style={styles.submitBtnText}>Transférer comme employé</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {toast && (
          <Toast
            toast={toast} // Assurez-vous que toast est passé correctement
            onDismiss={() => setToast(null)}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
function getErrorTitle(statusCode) {
    switch (statusCode) {
        case 400: return '⚠️ Données invalides';
        case 401: return '🔐 Non authentifié';
        case 403: return '🔒 Accès refusé';
        case 404: return '🔍 Ressource introuvable';
        case 429: return '⏱️ Trop de requêtes';
        case 500: return '🔧 Erreur serveur';
        default:  return '❌ Erreur';
    }
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONTS.xl, fontWeight: '800', color: '#fff' },
  headerHint: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  content: { flex: 1 },
  form: { padding: 20 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  inputError: { borderColor: COLORS.error },
  input: { flex: 1, height: 50, fontSize: FONTS.md, color: COLORS.textPrimary, marginLeft: 12 },
  errorText: { fontSize: FONTS.xs, color: COLORS.error, marginTop: 4, marginLeft: 4 },
  warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningBg, padding: 12, borderRadius: RADIUS.md, gap: 8 },
  warningText: { flex: 1, fontSize: FONTS.sm, color: COLORS.warning, fontWeight: '600' },
  pickerContainer: { flex: 1, marginLeft: 12 },
  pharmacyOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  pharmacyOptionText: { fontSize: FONTS.md, color: COLORS.textPrimary },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.roles.admin.color, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.roles.admin.color },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  searchInput: { flex: 1, height: 45, fontSize: FONTS.md, color: COLORS.textPrimary, marginLeft: 12 },
  userListContainer: { backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, maxHeight: 200 },
  userList: { maxHeight: 200 },
  userOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  userOptionSelected: { backgroundColor: COLORS.roles.admin.bg },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.textPrimary },
  userEmail: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
  noResults: { padding: 20, textAlign: 'center', color: COLORS.textSecondary },
  
  selectedUserCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.successBg, padding: 12, borderRadius: RADIUS.md, marginBottom: 20, gap: 10 },
  selectedUserInfo: { flex: 1 },
  selectedUserName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.success },
  selectedUserEmail: { fontSize: FONTS.sm, color: COLORS.success, marginTop: 2 },
  
  salaryPeriodContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  periodOption: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 2, borderColor: COLORS.border },
  periodOptionActive: { backgroundColor: COLORS.roles.admin.color, borderColor: COLORS.roles.admin.color },
  periodLabel: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textSecondary },
  periodLabelActive: { color: '#fff' },
  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  submitBtn: { borderRadius: RADIUS.md, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGradient: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' }
});