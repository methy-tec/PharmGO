import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ConfirmLogoutModal({ visible, onCancel, onConfirm }) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.confirmBox}>
                    <View style={[styles.confirmIconWrap, { backgroundColor: '#fff1f0' }]}>
                        <Ionicons name="log-out-outline" size={32} color="#ff3b30" />
                    </View>
                    <Text style={styles.confirmTitle}>Se déconnecter</Text>
                    <Text style={styles.confirmMsg}>
                        {'Êtes-vous sûr de vouloir vous déconnecter\nde '}
                        <Text style={styles.confirmBold}>Pharma Go</Text>
                        {' ?'}
                    </Text>
                    <Text style={styles.confirmMsg}>
                        {'Sachez que vous serez obligé à vous reconnecter pour accéder à la plateforme.'}
                    </Text>
                    <View style={styles.confirmRow}>
                        <TouchableOpacity style={styles.btnOutline} onPress={onCancel}>
                            <Text style={styles.btnOutlineText}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnSolid, { backgroundColor: '#ff3b30' }]}
                            onPress={onConfirm}
                        >
                            <Ionicons name="log-out-outline" size={18} color="#fff" />
                            <Text style={styles.btnSolidText}>Déconnecter</Text>
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
    btnOutline:      { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
    btnOutlineText:  { fontSize: 15, fontWeight: '700', color: '#666' },
    btnSolid:        { flex: 2, height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSolidText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});