import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ROLES = ['user', 'pharmacie', 'admin'];

const roleConfig = {
    user:      { label: 'Utilisateur',    icon: 'person',  color: '#34c759', desc: 'Accès standard, consultation uniquement' },
    pharmacie: { label: 'Pharmacien',     icon: 'medkit',  color: '#ff9500', desc: "Gestion d'une pharmacie" },
    admin:     { label: 'Administrateur', icon: 'shield',  color: '#007aff', desc: 'Accès admin complet, gestion des utilisateurs' },
};

export default function UpdateRoleModal({ visible, userName, currentRole, loading, onCancel, onConfirm }) {
    const [selectedRole, setSelectedRole] = useState(currentRole);
    useEffect(() => { setSelectedRole(currentRole); }, [currentRole]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlayBottom}>
                <View style={styles.sheetBox}>
                    <LinearGradient colors={['#007aff', '#0056cc']} style={styles.sheetHeader}>
                        <View style={styles.sheetHeaderLeft}>
                            <View style={styles.sheetIconWrap}>
                                <Ionicons name="swap-horizontal" size={22} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.sheetTitle}>Modifier le rôle</Text>
                                <Text style={styles.sheetSubtitle}>{userName}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.sheetCloseBtn} onPress={onCancel}>
                            <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </LinearGradient>
                    <View style={styles.sheetBody}>
                        <Text style={styles.formLabel}>Sélectionner un rôle</Text>
                        <View style={styles.roleList}>
                            {ROLES.map(role => {
                                const cfg        = roleConfig[role];
                                const isSelected = selectedRole === role;
                                const isCurrent  = currentRole  === role;
                                return (
                                    <TouchableOpacity
                                        key={role}
                                        style={[styles.roleOption, isSelected && { borderColor: cfg.color, backgroundColor: cfg.color + '10' }]}
                                        onPress={() => setSelectedRole(role)}
                                    >
                                        <View style={[styles.roleOptionIcon, { backgroundColor: cfg.color + '20' }]}>
                                            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.roleOptionHeader}>
                                                <Text style={[styles.roleOptionLabel, isSelected && { color: cfg.color }]}>{cfg.label}</Text>
                                                {isCurrent && (
                                                    <View style={styles.currentBadge}>
                                                        <Text style={styles.currentBadgeText}>Actuel</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.roleOptionDesc}>{cfg.desc}</Text>
                                        </View>
                                        <View style={[styles.radioOuter, isSelected && { borderColor: cfg.color }]}>
                                            {isSelected && <View style={[styles.radioInner, { backgroundColor: cfg.color }]} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                    <View style={styles.sheetFooter}>
                        <TouchableOpacity style={styles.btnOutline} onPress={onCancel} disabled={loading}>
                            <Text style={styles.btnOutlineText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnSolid, { backgroundColor: '#007aff', opacity: selectedRole === currentRole ? 0.4 : 1 }]}
                            onPress={() => onConfirm(selectedRole)}
                            disabled={loading || selectedRole === currentRole}
                        >
                            {loading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={styles.btnSolidText}>Confirmer</Text></>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlayBottom:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheetBox:         { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    sheetHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    sheetHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sheetIconWrap:    { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    sheetTitle:       { fontSize: 17, fontWeight: '800', color: '#fff' },
    sheetSubtitle:    { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    sheetCloseBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    sheetBody:        { padding: 20, maxHeight: 420 },
    formLabel:        { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
    roleList:         { gap: 10 },
    roleOption:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#eee', backgroundColor: '#fff' },
    roleOptionIcon:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    roleOptionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    roleOptionLabel:  { fontSize: 15, fontWeight: '700', color: '#333' },
    roleOptionDesc:   { fontSize: 12, color: '#999' },
    currentBadge:     { backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    currentBadgeText: { fontSize: 10, fontWeight: '700', color: '#2e7d32' },
    radioOuter:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    radioInner:       { width: 10, height: 10, borderRadius: 5 },
    sheetFooter:      { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    btnOutline:       { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    btnOutlineText:   { fontSize: 15, fontWeight: '700', color: '#666' },
    btnSolid:         { flex: 2, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSolidText:     { fontSize: 15, fontWeight: '800', color: '#fff' },
});