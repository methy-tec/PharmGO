import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SuspendModal({ visible, userName, loading, onCancel, onConfirm }) {
    const [reason, setReason] = useState('');
    const [error, setError]   = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) { setError('Veuillez indiquer une raison'); return; }
        setError('');
        onConfirm(reason.trim());
    };

    const handleCancel = () => { setReason(''); setError(''); onCancel(); };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlayBottom}>
                <View style={styles.sheetBox}>
                    <LinearGradient colors={['#ff9500', '#ff6b00']} style={styles.sheetHeader}>
                        <View style={styles.sheetHeaderLeft}>
                            <View style={styles.sheetIconWrap}>
                                <Ionicons name="ban" size={22} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.sheetTitle}>Suspendre le compte</Text>
                                <Text style={styles.sheetSubtitle}>{userName}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.sheetCloseBtn} onPress={handleCancel}>
                            <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </LinearGradient>
                    <View style={styles.sheetBody}>
                        <View style={[styles.infoBanner, { backgroundColor: '#fff8f0' }]}>
                            <Ionicons name="warning" size={16} color="#ff9500" />
                            <Text style={[styles.infoBannerText, { color: '#c96a00' }]}>
                                L'utilisateur ne pourra plus se connecter tant que son compte est suspendu.
                            </Text>
                        </View>
                        <Text style={styles.formLabel}>Raison de la suspension *</Text>
                        <View style={[styles.textAreaWrap, error ? styles.inputError : null]}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Ex: Violation des conditions d'utilisation..."
                                placeholderTextColor="#bbb"
                                multiline
                                numberOfLines={4}
                                value={reason}
                                onChangeText={v => { setReason(v); setError(''); }}
                            />
                        </View>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </View>
                    <View style={styles.sheetFooter}>
                        <TouchableOpacity style={styles.btnOutline} onPress={handleCancel} disabled={loading}>
                            <Text style={styles.btnOutlineText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnSolid, { backgroundColor: '#ff9500' }]} onPress={handleConfirm} disabled={loading}>
                            {loading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="ban" size={16} color="#fff" /><Text style={styles.btnSolidText}>Suspendre</Text></>
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
    sheetBody:       { padding: 20 },
    infoBanner:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12, marginBottom: 16 },
    infoBannerText:  { flex: 1, fontSize: 13, fontWeight: '500' },
    formLabel:       { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
    textAreaWrap:    { backgroundColor: '#f7f7f7', borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', padding: 12, minHeight: 90 },
    textArea:        { fontSize: 14, color: '#333', textAlignVertical: 'top', minHeight: 70 },
    inputError:      { borderColor: '#ff3b30', backgroundColor: '#fff8f8' },
    errorText:       { fontSize: 12, color: '#ff3b30', marginTop: 4 },
    sheetFooter:     { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    btnOutline:      { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    btnOutlineText:  { fontSize: 15, fontWeight: '700', color: '#666' },
    btnSolid:        { flex: 2, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSolidText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});