import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getRoleColor = (role) => ({
    superadmin: '#6c2bd9', admin: '#007aff', pharmacist: '#ff9500', user: '#34c759'
}[role] || '#999');

export default function UsersTab({ users, onDeleteUser, onActiveUser, onSuspendUser, onUpdateRole, onCreateAdmin }) {
    return (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.sectionTitle}>👤 Utilisateurs ({users.length})</Text>
                <TouchableOpacity style={styles.addBtn} onPress={onCreateAdmin}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Admin</Text>
                </TouchableOpacity>
            </View>
            {users.length === 0 ? (
                <Text style={styles.emptyText}>Aucun utilisateur</Text>
            ) : (
                users.map(u => (
                    <View key={u.id} style={[styles.card, u.isSuspended && styles.cardSuspended]}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.cardAvatar, { backgroundColor: getRoleColor(u.role) + '20' }]}>
                                <Text style={[styles.cardAvatarText, { color: getRoleColor(u.role) }]}>
                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{u.firstName} {u.lastName}</Text>
                                <Text style={styles.cardMeta}>{u.email}</Text>
                            </View>
                        </View>
                        <View style={styles.cardFooter}>
                            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(u.role) }]}>
                                <Text style={styles.roleBadgeText}>{u.role}</Text>
                            </View>
                            {(u.isSuspended || u.status === 'suspended') && (
                                <View style={styles.suspendedBadge}>
                                    <Ionicons name="ban" size={11} color="#ff9500" />
                                    <Text style={styles.suspendedBadgeText}>Suspendu</Text>
                                </View>
                            )}
                            {u.role === 'superadmin' && (
                                <View style={styles.protectedBadge}>
                                    <Ionicons name="shield" size={11} color="#6c2bd9" />
                                    <Text style={styles.protectedText}>Protégé</Text>
                                </View>
                            )}
                            {u.role !== 'superadmin' && (
                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => onUpdateRole(u.id, `${u.firstName} ${u.lastName}`, u.role)}
                                    >
                                        <Ionicons name="swap-horizontal" size={16} color="#007aff" />
                                    </TouchableOpacity>
                                    {u.isSuspended || u.status === 'suspended' ? (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }]}
                                            onPress={() => onActiveUser(u.id, `${u.firstName} ${u.lastName}`)}
                                        >
                                            <Ionicons name="checkmark-circle-outline" size={16} color="#34c759" />
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: '#fff8f0', borderColor: '#ffe4cc' }]}
                                            onPress={() => onSuspendUser(u.id, `${u.firstName} ${u.lastName}`)}
                                        >
                                            <Ionicons name="ban" size={16} color="#ff9500" />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#fff1f0', borderColor: '#ffd6d6' }]}
                                        onPress={() => onDeleteUser(u.id, `${u.firstName} ${u.lastName}`)}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#ff3b30" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent:         { padding: 20 },
    tabHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle:       { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 12 },
    addBtn:             { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6c2bd9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    addBtnText:         { fontSize: 13, fontWeight: '700', color: '#fff' },
    emptyText:          { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 20 },
    card:               { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
    cardSuspended:      { opacity: 0.7, borderWidth: 1.5, borderColor: '#ffe4cc' },
    cardHeader:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardAvatar:         { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    cardAvatarText:     { fontSize: 14, fontWeight: '800' },
    cardTitle:          { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
    cardMeta:           { fontSize: 13, color: '#666' },
    cardFooter:         { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    cardActions:        { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
    actionBtn:          { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f0f4ff', borderWidth: 1, borderColor: '#dce8ff', alignItems: 'center', justifyContent: 'center' },
    roleBadge:          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleBadgeText:      { fontSize: 12, fontWeight: '700', color: '#fff' },
    suspendedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    suspendedBadgeText: { fontSize: 11, fontWeight: '600', color: '#ff9500' },
    protectedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0e8ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    protectedText:      { fontSize: 11, fontWeight: '600', color: '#6c2bd9' },
});