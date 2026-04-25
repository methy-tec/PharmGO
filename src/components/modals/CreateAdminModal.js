import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, TextInput, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/AuthService';

export default function CreateAdminModal({ visible, onClose, onSuccess }) {
    const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors]   = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.firstName.trim()) e.firstName = 'Prénom requis';
        if (!form.lastName.trim())  e.lastName  = 'Nom requis';
        if (!form.email.trim())     e.email     = 'Email requis';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
        if (!form.phone.trim())     e.phone     = 'Téléphone requis';
        if (!form.password.trim())  e.password  = 'Mot de passe requis';
        else if (form.password.length < 8) e.password = 'Min. 8 caractères';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            setLoading(true);
            const res = await authService.createAdmin(form);
            if (res.success) {
                setForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
                setErrors({});
                onSuccess(res.data.admin);
            }
        } catch (error) {
            Alert.alert('Erreur', error.message || "Impossible de créer l'admin");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
        setErrors({});
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlayBottom}>
                <View style={styles.sheetBox}>
                    <LinearGradient colors={['#6c2bd9', '#9c27b0']} style={styles.sheetHeader}>
                        <View style={styles.sheetHeaderLeft}>
                            <View style={styles.sheetIconWrap}>
                                <Ionicons name="shield-checkmark" size={22} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.sheetTitle}>Créer un Admin</Text>
                                <Text style={styles.sheetSubtitle}>Accès administrateur complet</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.sheetCloseBtn} onPress={handleClose}>
                            <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle" size={16} color="#6c2bd9" />
                            <Text style={styles.infoBannerText}>Auto-vérifié · 30 jours d'essai gratuit</Text>
                        </View>
                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.formLabel}>Prénom *</Text>
                                <View style={[styles.inputWrap, errors.firstName && styles.inputError]}>
                                    <Ionicons name="person-outline" size={16} color="#999" style={styles.inputIcon} />
                                    <TextInput style={styles.input} placeholder="Jean" placeholderTextColor="#bbb" value={form.firstName} onChangeText={v => setForm(p => ({ ...p, firstName: v }))} />
                                </View>
                                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                            </View>
                            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.formLabel}>Nom *</Text>
                                <View style={[styles.inputWrap, errors.lastName && styles.inputError]}>
                                    <Ionicons name="person-outline" size={16} color="#999" style={styles.inputIcon} />
                                    <TextInput style={styles.input} placeholder="Dupont" placeholderTextColor="#bbb" value={form.lastName} onChangeText={v => setForm(p => ({ ...p, lastName: v }))} />
                                </View>
                                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                            </View>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Email *</Text>
                            <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                                <Ionicons name="mail-outline" size={16} color="#999" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="admin@example.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Téléphone *</Text>
                            <View style={[styles.inputWrap, errors.phone && styles.inputError]}>
                                <Ionicons name="call-outline" size={16} color="#999" style={styles.inputIcon} />
                                <TextInput style={styles.input} placeholder="+33 6 12 34 56 78" placeholderTextColor="#bbb" keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} />
                            </View>
                            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Mot de passe *</Text>
                            <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                                <Ionicons name="lock-closed-outline" size={16} color="#999" style={styles.inputIcon} />
                                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min. 8 caractères" placeholderTextColor="#bbb" secureTextEntry={!showPassword} value={form.password} onChangeText={v => setForm(p => ({ ...p, password: v }))} />
                                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#999" />
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>
                    </ScrollView>

                    <View style={styles.sheetFooter}>
                        <TouchableOpacity style={styles.btnOutline} onPress={handleClose} disabled={loading}>
                            <Text style={styles.btnOutlineText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnSolid, { backgroundColor: '#6c2bd9' }]} onPress={handleSubmit} disabled={loading}>
                            {loading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="shield-checkmark" size={16} color="#fff" /><Text style={styles.btnSolidText}>Créer l'Admin</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlayBottom:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheetBox:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    sheetHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sheetIconWrap:   { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    sheetTitle:      { fontSize: 17, fontWeight: '800', color: '#fff' },
    sheetSubtitle:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    sheetCloseBtn:   { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    sheetBody:       { padding: 20, maxHeight: 420 },
    infoBanner:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0e8ff', borderRadius: 10, padding: 12, marginBottom: 20 },
    infoBannerText:  { flex: 1, fontSize: 13, color: '#6c2bd9', fontWeight: '500' },
    formRow:         { flexDirection: 'row' },
    formGroup:       { marginBottom: 16 },
    formLabel:       { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
    inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f7f7', borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', paddingHorizontal: 12, height: 48 },
    inputError:      { borderColor: '#ff3b30', backgroundColor: '#fff8f8' },
    inputIcon:       { marginRight: 8 },
    input:           { flex: 1, fontSize: 14, color: '#333' },
    eyeBtn:          { padding: 4 },
    errorText:       { fontSize: 12, color: '#ff3b30', marginTop: 4 },
    sheetFooter:     { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    btnOutline:      { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    btnOutlineText:  { fontSize: 15, fontWeight: '700', color: '#666' },
    btnSolid:        { flex: 2, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSolidText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});