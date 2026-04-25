import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function getStatusColor(status) {
    if (status === 'pending')   return { bg: '#fff3cd', text: '#856404' };
    if (status === 'active')    return { bg: '#d4edda', text: '#155724' };
    if (status === 'suspended') return { bg: '#f8d7da', text: '#721c24' };
    return { bg: '#e2e3e5', text: '#495057' };
}

export default function PharmaciesTab({ pharmacies, onValidate, onSuspend, selectedPharmacy, setSelectedPharmacy, subscriptionHistory, historyLoading, loadHistory }) {
    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>🏥 Pharmacies ({pharmacies.length})</Text>
            {pharmacies.length === 0 ? (
                <Text style={styles.emptyText}>Aucune pharmacie enregistrée</Text>
            ) : (
                pharmacies.map((ph) => {
                    const isSelected  = selectedPharmacy?.id === ph.id;
                    const statusColor = getStatusColor(ph.status);
                    return (
                        <TouchableOpacity
                            key={ph.id}
                            activeOpacity={0.85}
                            style={[
                                styles.card,
                                isSelected && styles.cardSelected,
                                ph.status === 'suspended' && styles.cardSuspended,
                            ]}
                            onPress={() => {
                                if (isSelected) {
                                    setSelectedPharmacy(null);
                                } else {
                                    setSelectedPharmacy(ph);
                                    loadHistory(ph.id);
                                }
                            }}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.cardAvatar, { backgroundColor: '#ff950020' }]}>
                                    <Text style={[styles.cardAvatarText, { color: '#ff9500' }]}>
                                        {ph.name?.[0] || 'P'}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{ph.name}</Text>
                                    <Text style={styles.cardMeta}>📍 {ph.city || ph.address?.city || '—'}</Text>
                                </View>
                                <Ionicons
                                    name={isSelected ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color="#999"
                                />
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                                    <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
                                        {ph.status === 'pending' ? 'En attente' : ph.status === 'active' ? 'Active' : 'Suspendue'}
                                    </Text>
                                </View>
                                <View style={styles.cardActions}>
                                    {ph.status === 'pending' && (
                                        <TouchableOpacity
                                            style={styles.actionBtnSuccess}
                                            onPress={(e) => { e.stopPropagation?.(); onValidate(ph); }}
                                        >
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#2e7d32" />
                                        </TouchableOpacity>
                                    )}
                                    {ph.status !== 'suspended' && (
                                        <TouchableOpacity
                                            style={styles.actionBtnWarning}
                                            onPress={(e) => { e.stopPropagation?.(); onSuspend(ph); }}
                                        >
                                            <Ionicons name="ban" size={18} color="#ff9500" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {isSelected && (
                                <View style={styles.historySection}>
                                    <Text style={styles.historyTitle}>📋 Historique abonnements</Text>
                                    {historyLoading ? (
                                        <ActivityIndicator size="small" color="#6c2bd9" style={{ marginVertical: 12 }} />
                                    ) : subscriptionHistory.length === 0 ? (
                                        <Text style={styles.emptyHistory}>Aucun abonnement enregistré</Text>
                                    ) : (
                                        subscriptionHistory.map((sub, i) => (
                                            <View key={sub.id || i} style={styles.subscriptionItem}>
                                                <View style={styles.subLine}>
                                                    <Text style={styles.subPlan}>{sub.plan || sub.type || '—'}</Text>
                                                    <Text style={[styles.subStatus, { color: sub.status === 'active' ? '#2e7d32' : '#d32f2f' }]}>
                                                        {sub.status}
                                                    </Text>
                                                </View>
                                                <Text style={styles.subDates}>
                                                    {sub.startDate ? new Date(sub.startDate).toLocaleDateString('fr-FR') : '—'}
                                                    {' → '}
                                                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString('fr-FR') : 'en cours'}
                                                </Text>
                                                {sub.amount && (
                                                    <Text style={styles.subPrice}>{sub.amount} €</Text>
                                                )}
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent:       { padding: 20 },
    sectionTitle:     { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 12 },
    emptyText:        { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 20 },
    card:             { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
    cardSuspended:    { opacity: 0.7, borderWidth: 1.5, borderColor: '#ffe4cc' },
    cardSelected:     { borderWidth: 2, borderColor: '#6c2bd9', backgroundColor: '#faf8ff' },
    cardHeader:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardAvatar:       { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    cardAvatarText:   { fontSize: 14, fontWeight: '800' },
    cardTitle:        { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
    cardMeta:         { fontSize: 13, color: '#666' },
    cardFooter:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    cardActions:      { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
    actionBtnSuccess: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#c8e6c9', alignItems: 'center', justifyContent: 'center' },
    actionBtnWarning: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff8f0', borderWidth: 1, borderColor: '#ffe4cc', alignItems: 'center', justifyContent: 'center' },
    statusBadge:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusBadgeText:  { fontSize: 12, fontWeight: '700' },
    historySection:   { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#eee' },
    historyTitle:     { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
    subscriptionItem: { backgroundColor: '#f8f8f8', borderRadius: 8, padding: 10, marginBottom: 8 },
    subLine:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    subPlan:          { fontWeight: '700', color: '#333', fontSize: 14 },
    subStatus:        { fontSize: 13, fontWeight: '600' },
    subDates:         { color: '#666', fontSize: 12 },
    subPrice:         { color: '#6c2bd9', fontWeight: '700', marginTop: 4, fontSize: 13 },
    emptyHistory:     { color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
});