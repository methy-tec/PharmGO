import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveModal({ visible, userName, loading, onCancel, onConfirm }) {
    const handleCancel = () => onCancel();

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlayBottom}>
                <View style={styles.sheetBox}>
                    <LinearGradient colors={['#34c759', '#28a745']} style={styles.sheetHeader}>
                        <View style={styles.sheetHeaderLeft}>
                            <View style={styles.sheetIconWrap}>
                                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.sheetTitle}>Activer le compte</Text>
                                <Text style={styles.sheetSubtitle}>{userName}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.sheetCloseBtn} onPress={handleCancel}>
                            <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={styles.sheetBody}>
                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle" size={16} color="#34c759" />
                            <Text style={styles.infoBannerText}>
                                L'utilisateur pourra à nouveau se connecter et accéder à son compte.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sheetFooter}>
                        <TouchableOpacity style={styles.btnOutline} onPress={handleCancel} disabled={loading}>
                            <Text style={styles.btnOutlineText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnSolid, { backgroundColor: '#34c759' }]}
                            onPress={onConfirm}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <><Ionicons name="checkmark-circle-outline" size={16} color="#fff" /><Text style={styles.btnSolidText}>Activer</Text></>
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
    infoBanner:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fff4', borderRadius: 10, padding: 12 },
    infoBannerText:  { flex: 1, fontSize: 13, color: '#2e7d32', fontWeight: '500' },
    sheetFooter:     { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    btnOutline:      { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    btnOutlineText:  { fontSize: 15, fontWeight: '700', color: '#666' },
    btnSolid:        { flex: 2, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSolidText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});