import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PharmacyActionModal({ visible, type, pharmacyName, loading, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    const [error, setError]   = useState('');

    const isSuspend = type === 'suspend';

    useEffect(() => {
        if (visible) { setReason(''); setError(''); }
    }, [visible]);

    const handleConfirm = () => {
        if (isSuspend && !reason.trim()) {
            setError('Veuillez indiquer une raison');
            return;
        }
        setError('');
        onConfirm(isSuspend ? reason.trim() : '');
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.confirmBox}>
                    <View style={[styles.confirmIconWrap, {
                        backgroundColor: isSuspend ? '#fff8f0' : '#f0fff4'
                    }]}>
                        <Ionicons
                            name={isSuspend ? 'ban' : 'checkmark-circle-outline'}
                            size={36}
                            color={isSuspend ? '#ff9500' : '#00b368'}
                        />
                    </View>
                    <Text style={styles.confirmTitle}>
                        {isSuspend ? 'Suspendre' : 'Valider'} la pharmacie
                    </Text>
                    <Text style={styles.confirmMsg}>
                        {isSuspend ? 'Êtes-vous sûr de vouloir suspendre\n' : 'Confirmer la validation de\n'}
                        <Text style={styles.confirmBold}>{pharmacyName}</Text>
                        {isSuspend ? ' ?' : ' ?\nElle sera immédiatement active.'}
                    </Text>

                    {isSuspend && (
                        <View style={{ width: '100%', marginBottom: 16 }}>
                            <Text style={styles.formLabel}>Raison *</Text>
                            <View style={[styles.textAreaWrap, error ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Motif de la suspension..."
                                    placeholderTextColor="#bbb"
                                    value={reason}
                                    onChangeText={v => { setReason(v); setError(''); }}
                                />
                            </View>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        </View>
                    )}

                    <View style={styles.confirmRow}>
                        <TouchableOpacity style={styles.btnOutline} onPress={onClose} disabled={loading}>
                            <Text style={styles.btnOutlineText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnSolid, { backgroundColor: isSuspend ? '#ff9500' : '#00b368' }]}
                            onPress={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name={isSuspend ? 'ban' : 'checkmark'} size={18} color="#fff" />
                                    <Text style={styles.btnSolidText}>{isSuspend ? 'Suspendre' : 'Valider'}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    confirmBox:      { backgroundColor: '#fff', borderRadius: 20, margin: 30, padding: 28, alignItems: 'center', width: '85%' },
    confirmIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    confirmTitle:    { fontSize: 18, fontWeight: '800', color: '#333', marginBottom: 10 },
    confirmMsg:      { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    confirmBold:     { fontWeight: '800', color: '#333' },
    confirmRow:      { flexDirection: 'row', gap: 12, width: '100%' },
    formLabel:       { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8, alignSelf: 'flex-start' },
    textAreaWrap:    { backgroundColor: '#f7f7f7', borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', padding: 12, minHeight: 90, width: '100%' },
    textArea:        { fontSize: 14, color: '#333', textAlignVertical: 'top', minHeight: 70 },
    inputError:      { borderColor: '#ff3b30', backgroundColor: '#fff8f8' },
    errorText:       { fontSize: 12, color: '#ff3b30', marginTop: 4, alignSelf: 'flex-start' },
    btnOutline:      { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    btnOutlineText:  { fontSize: 15, fontWeight: '700', color: '#666' },
    btnSolid:        { flex: 2, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSolidText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});