import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ProfileService from '../../services/ProfileService';
import Toast from '../../components/Toast';

// ─── Couleur du header selon le rôle ─────────────────────────────────────────
const ROLE_COLORS = {
    superadmin: ['#4a1a8c', '#6c2bd9'],
    admin:      ['#1a3a5c', '#2e7fbd'],
    pharmacist: ['#1a5c3a', '#2ebd7f'],
    user:       ['#5c3a1a', '#bd7f2e'],
};

const getRoleGradient = (role) =>
    ROLE_COLORS[role] || ROLE_COLORS.user;

// ─── Sections ─────────────────────────────────────────────────────────────────
const SECTIONS = [
    { key: 'info',     icon: 'person-outline',     label: 'Informations' },
    { key: 'password', icon: 'lock-closed-outline', label: 'Mot de passe' },
    { key: 'history',  icon: 'time-outline',        label: 'Historique'   },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
    const { user, setUser } = useAuth();

    const [activeSection, setActiveSection] = useState('info');
    const [toast,         setToast]         = useState(null);

    const showToast = (type, title, message) =>
        setToast({ type, title, message, duration: 4000 });

    // Met à jour le user dans le contexte après modification du profil
    const handleProfileUpdated = (updatedFields) => {
        setUser(prev => ({ ...prev, ...updatedFields }));
    };

    const gradientColors = getRoleGradient(user?.role);
    // Couleur active des pills (reprend la 2e couleur du gradient)
    const accentColor = gradientColors[1];

    return (
        <View style={styles.container}>
            <LinearGradient colors={gradientColors} style={styles.header}>

                {/* Retour */}
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>

                {/* Avatar */}
                <AvatarSection user={user} showToast={showToast} />

                <Text style={styles.headerName}>{user?.firstName} {user?.lastName}</Text>
                <Text style={styles.headerEmail}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase()}</Text>
                </View>

                {/* Nav pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
                    <View style={styles.sectionNav}>
                        {SECTIONS.map(s => (
                            <TouchableOpacity
                                key={s.key}
                                style={[styles.sectionBtn, activeSection === s.key && styles.sectionBtnActive]}
                                onPress={() => setActiveSection(s.key)}
                            >
                                <Ionicons
                                    name={s.icon}
                                    size={14}
                                    color={activeSection === s.key ? accentColor : 'rgba(255,255,255,0.7)'}
                                />
                                <Text style={[
                                    styles.sectionBtnText,
                                    activeSection === s.key && [styles.sectionBtnTextActive, { color: accentColor }]
                                ]}>
                                    {s.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeSection === 'info' && (
                    <InfoSection
                        user={user}
                        showToast={showToast}
                        onUpdated={handleProfileUpdated}
                        accentColor={accentColor}
                        gradientColors={gradientColors}
                    />
                )}
                {activeSection === 'password' && (
                    <PasswordSection
                        showToast={showToast}
                        accentColor={accentColor}
                        gradientColors={gradientColors}
                    />
                )}
                {activeSection === 'history' && (
                    <HistorySection accentColor={accentColor} />
                )}
                <View style={{ height: 60 }} />
            </ScrollView>

            {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
        </View>
    );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function AvatarSection({ user, showToast }) {
    const [photo,   setPhoto]   = useState(user?.avatar || null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        showToast('info', '🚧 Bientôt disponible', 'La modification de photo de profil sera disponible prochainement');
    };

    const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

    return (
        <View style={styles.avatarWrap}>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} disabled={loading}>
                {photo ? (
                    <Image source={{ uri: photo }} style={styles.avatarImg} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                )}
                <View style={styles.avatarEditBadge}>
                    {loading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Ionicons name="camera" size={14} color="#fff" />
                    }
                </View>
            </TouchableOpacity>
        </View>
    );
}

// ─── SECTION INFO ─────────────────────────────────────────────────────────────
function InfoSection({ user, showToast, onUpdated, gradientColors }) {
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName,  setLastName]  = useState(user?.lastName  || '');
    const [loading,   setLoading]   = useState(false);
    const [errors,    setErrors]    = useState({});

    const validate = () => {
        const e = {};
        if (!firstName.trim()) e.firstName = 'Le prénom est requis';
        if (!lastName.trim())  e.lastName  = 'Le nom est requis';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            setLoading(true);
            await ProfileService.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
            onUpdated({ firstName: firstName.trim(), lastName: lastName.trim() });
            showToast('success', '✅ Succès', 'Profil mis à jour avec succès');
        } catch (err) {
            showToast('error', 'Erreur', err.message || 'Impossible de mettre à jour');
        } finally {
            setLoading(false);
        }
    };

    const changed = firstName !== user?.firstName || lastName !== user?.lastName;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>

            <View style={styles.infoCard}>
                {/* Email — lecture seule */}
                <View style={styles.readOnlyField}>
                    <Ionicons name="mail-outline" size={16} color="#999" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.fieldLabel}>Email</Text>
                        <Text style={styles.fieldValue}>{user?.email}</Text>
                    </View>
                    <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={11} color="#999" />
                        <Text style={styles.lockedText}>Non modifiable</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <FormField
                    label="Prénom"
                    icon="person-outline"
                    value={firstName}
                    onChangeText={(t) => { setFirstName(t); setErrors(e => ({ ...e, firstName: null })); }}
                    error={errors.firstName}
                    placeholder="Votre prénom"
                />

                <View style={styles.divider} />

                <FormField
                    label="Nom"
                    icon="person-outline"
                    value={lastName}
                    onChangeText={(t) => { setLastName(t); setErrors(e => ({ ...e, lastName: null })); }}
                    error={errors.lastName}
                    placeholder="Votre nom"
                />
            </View>

            {changed && (
                <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <LinearGradient colors={gradientColors} style={styles.saveBtnGradient}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                <Text style={styles.saveBtnText}>Enregistrer</Text>
                              </>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── SECTION MOT DE PASSE ─────────────────────────────────────────────────────
function PasswordSection({ showToast, gradientColors }) {
    const [current, setCurrent] = useState('');
    const [newPwd,  setNewPwd]  = useState('');
    const [confirm, setConfirm] = useState('');
    const [show,    setShow]    = useState({ current: false, new: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [errors,  setErrors]  = useState({});

    const strength = newPwd.length === 0 ? 0
        : newPwd.length < 6  ? 1
        : newPwd.length < 10 ? 2
        : /[A-Z]/.test(newPwd) && /[0-9]/.test(newPwd) ? 4 : 3;

    const strengthLabel = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength];
    const strengthColor = ['', '#ff3b30', '#ff9500', '#34c759', '#00b368'][strength];

    const validate = () => {
        const e = {};
        if (!current)           e.current = 'Mot de passe actuel requis';
        if (newPwd.length < 6)  e.newPwd  = 'Minimum 6 caractères';
        if (newPwd !== confirm)  e.confirm = 'Les mots de passe ne correspondent pas';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            setLoading(true);
            await ProfileService.updatePassword({ currentPassword: current, newPassword: newPwd });
            showToast('success', '✅ Succès', 'Mot de passe modifié avec succès');
            setCurrent(''); setNewPwd(''); setConfirm('');
        } catch (err) {
            showToast('error', 'Erreur', err.message || 'Impossible de modifier le mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changer le mot de passe</Text>

            <View style={styles.infoCard}>
                <PasswordField
                    label="Mot de passe actuel"
                    value={current}
                    onChangeText={(t) => { setCurrent(t); setErrors(e => ({ ...e, current: null })); }}
                    show={show.current}
                    onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
                    error={errors.current}
                />

                <View style={styles.divider} />

                <PasswordField
                    label="Nouveau mot de passe"
                    value={newPwd}
                    onChangeText={(t) => { setNewPwd(t); setErrors(e => ({ ...e, newPwd: null })); }}
                    show={show.new}
                    onToggle={() => setShow(s => ({ ...s, new: !s.new }))}
                    error={errors.newPwd}
                />

                {newPwd.length > 0 && (
                    <View style={styles.strengthWrap}>
                        <View style={styles.strengthBars}>
                            {[1, 2, 3, 4].map(i => (
                                <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength ? strengthColor : '#eee' }]} />
                            ))}
                        </View>
                        <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                    </View>
                )}

                <View style={styles.divider} />

                <PasswordField
                    label="Confirmer le mot de passe"
                    value={confirm}
                    onChangeText={(t) => { setConfirm(t); setErrors(e => ({ ...e, confirm: null })); }}
                    show={show.confirm}
                    onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                    error={errors.confirm}
                />
            </View>

            <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={loading}
            >
                <LinearGradient colors={gradientColors} style={styles.saveBtnGradient}>
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                            <Text style={styles.saveBtnText}>Mettre à jour</Text>
                          </>
                    }
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

// ─── SECTION HISTORIQUE ───────────────────────────────────────────────────────
function HistorySection({ accentColor }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const fetchHistory = async () => {
        try {
            const res = await ProfileService.getLoginHistory();
            setHistory(res.data?.data?.history || []);
        } catch (err) {
            console.error('Erreur historique:', err);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    fetchHistory();
}, []);

    const getDeviceIcon = (device) => {
        if (!device) return 'phone-portrait-outline';
        const d = device.toLowerCase();
        if (d.includes('iphone') || d.includes('android')) return 'phone-portrait-outline';
        if (d.includes('ipad')   || d.includes('tablet'))  return 'tablet-portrait-outline';
        return 'desktop-outline';
    };

    if (loading) {
        return (
            <View style={styles.section}>
                <ActivityIndicator color={accentColor} style={{ marginTop: 40 }} />
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Historique de connexion</Text>
                <Text style={styles.historyCount}>{history.length} session(s)</Text>
            </View>

            {history.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color="#ddd" />
                    <Text style={styles.emptyText}>Aucun historique disponible</Text>
                </View>
            ) : (
                history.map((item, i) => {
                    const date    = new Date(item.createdAt || item.date);
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                        <View key={i} style={[styles.historyItem, i === 0 && { borderWidth: 1.5, borderColor: accentColor + '30' }]}>
                            <View style={[styles.historyIconWrap, { backgroundColor: item.success ? '#e8f5e9' : '#fdecea' }]}>
                                <Ionicons
                                    name={getDeviceIcon(item.device)}
                                    size={20}
                                    color={item.success ? '#2e7d32' : '#c62828'}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.historyRow}>
                                    <Text style={styles.historyDevice}>{item.device || 'Appareil inconnu'}</Text>
                                    <View style={[styles.historyStatusDot, { backgroundColor: item.success ? '#34c759' : '#ff3b30' }]} />
                                </View>
                                <Text style={styles.historyIp}>
                                    📍 {item.ip || 'IP inconnue'}{item.location ? ` · ${item.location}` : ''}
                                </Text>
                                <Text style={styles.historyDate}>
                                    {isToday ? "Aujourd'hui" : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    {' · '}
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <Text style={[styles.historyStatus, { color: item.success ? '#34c759' : '#ff3b30' }]}>
                                {item.success ? '✓' : '✗'}
                            </Text>
                        </View>
                    );
                })
            )}
        </View>
    );
}

// ─── SOUS-COMPOSANTS ──────────────────────────────────────────────────────────
function FormField({ label, icon, value, onChangeText, error, placeholder }) {
    return (
        <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.inputWrap, error && styles.inputError]}>
                <Ionicons name={icon} size={16} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#ccc"
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

function PasswordField({ label, value, onChangeText, show, onToggle, error }) {
    return (
        <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={[styles.inputWrap, error && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={16} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!show}
                    placeholder="••••••••"
                    placeholderTextColor="#ccc"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
                    <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={18} color="#999" />
                </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:           { flex: 1, backgroundColor: '#f4f6f9' },
    header:              { paddingTop: 55, paddingBottom: 0, paddingHorizontal: 20, alignItems: 'center' },
    backBtn:             { position: 'absolute', top: 55, left: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerName:          { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 12 },
    headerEmail:         { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    roleBadge:           { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    roleBadgeText:       { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 1 },
    avatarWrap:          { alignItems: 'center', marginTop: 8 },
    avatarContainer:     { position: 'relative' },
    avatarImg:           { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#fff' },
    avatarPlaceholder:   { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    avatarInitials:      { fontSize: 28, fontWeight: '800', color: '#fff' },
    avatarEditBadge:     { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    sectionNav:          { flexDirection: 'row', gap: 8, paddingVertical: 16, paddingHorizontal: 4 },
    sectionBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)' },
    sectionBtnActive:    { backgroundColor: '#fff' },
    sectionBtnText:      { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
    sectionBtnTextActive:{ fontSize: 13, fontWeight: '700' },
    content:             { flex: 1 },
    section:             { padding: 20 },
    sectionHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle:        { fontSize: 17, fontWeight: '800', color: '#1a2a3a', marginBottom: 16 },
    infoCard:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    divider:             { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
    readOnlyField:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    fieldLabel:          { fontSize: 11, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    fieldValue:          { fontSize: 15, color: '#333', fontWeight: '500' },
    lockedBadge:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    lockedText:          { fontSize: 10, color: '#999', fontWeight: '600' },
    formGroup:           { marginBottom: 4 },
    inputWrap:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fb', borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', paddingHorizontal: 12, height: 46 },
    inputError:          { borderColor: '#ff3b30', backgroundColor: '#fff8f8' },
    input:               { flex: 1, fontSize: 15, color: '#333' },
    errorText:           { fontSize: 12, color: '#ff3b30', marginTop: 4 },
    saveBtn:             { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
    saveBtnGradient:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52 },
    saveBtnText:         { fontSize: 16, fontWeight: '700', color: '#fff' },
    strengthWrap:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    strengthBars:        { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar:         { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel:       { fontSize: 12, fontWeight: '700', width: 60 },
    historyCount:        { fontSize: 13, color: '#999', fontWeight: '600' },
    historyItem:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    historyIconWrap:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    historyRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
    historyDevice:       { fontSize: 14, fontWeight: '700', color: '#222' },
    historyStatusDot:    { width: 7, height: 7, borderRadius: 4 },
    historyIp:           { fontSize: 12, color: '#888', marginTop: 3 },
    historyDate:         { fontSize: 11, color: '#aaa', marginTop: 2 },
    historyStatus:       { fontSize: 18, fontWeight: '800' },
    emptyState:          { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText:           { fontSize: 14, color: '#ccc', marginTop: 12 },
});