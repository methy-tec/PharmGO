import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const planColors = {
    free:       '#999',
    basic:      '#007aff',
    premium:    '#ff9500',
    enterprise: '#6c2bd9',
};

export default function SubscriptionsTab({ requests, loading, processingId, onApprove, onReject, onRefresh }) {
    const [filter, setFilter] = useState('pending');

    const filtered = requests.filter(r =>
        filter === 'all' ? true : r.status === filter
    );

    if (loading) return (
        <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6c2bd9" />
            <Text style={{ marginTop: 12, color: '#999' }}>Chargement...</Text>
        </View>
    );

    return (
        <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
                <Text style={styles.sectionTitle}>
                    💳 Demandes ({requests.filter(r => r.status === 'pending').length} en attente)
                </Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={18} color="#6c2bd9" />
                </TouchableOpacity>
            </View>

            {/* Filtres */}
            <View style={styles.filterRow}>
                {['pending', 'approved', 'rejected', 'all'].map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
                            {f === 'pending'  ? '⏳ Attente'  :
                             f === 'approved' ? '✅ Approuvé' :
                             f === 'rejected' ? '❌ Rejeté'   : '📋 Tous'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {filtered.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#333' }}>Aucune demande</Text>
                    <Text style={{ color: '#999', marginTop: 4 }}>
                        {filter === 'pending' ? 'Aucune demande en attente' : `Aucune demande "${filter}"`}
                    </Text>
                </View>
            ) : (
                filtered.map(req => {
                    const isPending    = req.status === 'pending';
                    const isProcessing = processingId === req.id;
                    const fromColor    = planColors[req.currentPlan]   || '#999';
                    const toColor      = planColors[req.requestedPlan] || '#999';

                    return (
                        <View key={req.id} style={[
                            styles.requestCard,
                            req.status === 'approved' && styles.requestCardApproved,
                            req.status === 'rejected' && styles.requestCardRejected,
                        ]}>
                            {/* Header */}
                            <View style={styles.requestHeader}>
                                <View style={styles.requestAvatar}>
                                    <Text style={styles.requestAvatarText}>
                                        {req.user?.firstName?.[0]}{req.user?.lastName?.[0]}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.requestName}>{req.user?.firstName} {req.user?.lastName}</Text>
                                    <Text style={styles.requestEmail}>{req.user?.email}</Text>
                                </View>
                                <View style={[
                                    styles.statusPill,
                                    req.status === 'pending'  && { backgroundColor: '#fff3cd' },
                                    req.status === 'approved' && { backgroundColor: '#d4edda' },
                                    req.status === 'rejected' && { backgroundColor: '#f8d7da' },
                                ]}>
                                    <Text style={[
                                        styles.statusPillText,
                                        req.status === 'pending'  && { color: '#856404' },
                                        req.status === 'approved' && { color: '#155724' },
                                        req.status === 'rejected' && { color: '#721c24' },
                                    ]}>
                                        {req.status === 'pending'  ? '⏳ En attente' :
                                         req.status === 'approved' ? '✅ Approuvé'   : '❌ Rejeté'}
                                    </Text>
                                </View>
                            </View>

                            {/* Plan upgrade */}
                            <View style={styles.planRow}>
                                <View style={[styles.planPill, { backgroundColor: fromColor + '20', borderColor: fromColor }]}>
                                    <Text style={[styles.planPillText, { color: fromColor }]}>{req.currentPlan?.toUpperCase()}</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={18} color="#999" />
                                <View style={[styles.planPill, { backgroundColor: toColor + '20', borderColor: toColor }]}>
                                    <Text style={[styles.planPillText, { color: toColor }]}>{req.requestedPlan?.toUpperCase()}</Text>
                                </View>
                                <Text style={styles.durationText}>· {req.durationMonths} mois</Text>
                            </View>

                            {/* Date */}
                            <Text style={styles.requestDate}>
                                📅 {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </Text>

                            {/* Raison rejet */}
                            {req.status === 'rejected' && req.rejectReason && (
                                <View style={styles.rejectReasonBox}>
                                    <Text style={styles.rejectReasonText}>💬 {req.rejectReason}</Text>
                                </View>
                            )}

                            {/* Actions */}
                            {isPending && (
                                <View style={styles.requestActions}>
                                    <TouchableOpacity
                                        style={[styles.rejectBtn, isProcessing && { opacity: 0.5 }]}
                                        onPress={() => onReject(req.id, `${req.user?.firstName} ${req.user?.lastName}`)}
                                        disabled={isProcessing}
                                    >
                                        <Ionicons name="close" size={16} color="#ff3b30" />
                                        <Text style={styles.rejectBtnText}>Rejeter</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.approveBtn, isProcessing && { opacity: 0.5 }]}
                                        onPress={() => onApprove(req.id)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={styles.approveBtnText}>Approuver</Text></>
                                        }
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent:          { padding: 20 },
    tabHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle:        { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 12 },
    refreshBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0e8ff', alignItems: 'center', justifyContent: 'center' },
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