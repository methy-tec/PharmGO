import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ManagerService from '../services/ManagerService';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

const ORDER_STATUSES = [
  {
    value: 'pending',
    label: 'En attente',
    icon: 'time-outline',
    color: '#FFA500',
    description: 'La commande a été reçue et est en attente de traitement'
  },
  {
    value: 'processing',
    label: 'En préparation',
    icon: 'construct-outline',
    color: '#2196F3',
    description: 'La commande est en cours de préparation par l\'équipe'
  },
  {
    value: 'ready',
    label: 'Prête',
    icon: 'checkmark-done-outline',
    color: '#9C27B0',
    description: 'La commande est prête à être retirée ou livrée'
  },
  {
    value: 'delivered',
    label: 'Livrée',
    icon: 'checkmark-circle',
    color: '#4CAF50',
    description: 'La commande a été livrée au client'
  },
  {
    value: 'cancelled',
    label: 'Annulée',
    icon: 'close-circle',
    color: '#F44336',
    description: 'La commande a été annulée'
  }
];

export default function UpdateOrderStatusModal({ visible, onClose, order, onSuccess }) {
  const [selectedStatus, setSelectedStatus] = useState(order?.status || 'pending');
  const [loading, setLoading] = useState(false);

  const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.value === order?.status);
  const selectedStatusIndex = ORDER_STATUSES.findIndex(s => s.value === selectedStatus);

  const handleUpdateStatus = async () => {
    if (!order) return;

    if (selectedStatus === order.status) {
      Alert.alert('Information', 'Le statut n\'a pas changé');
      return;
    }

    try {
      setLoading(true);

      await ManagerService.updateOrderStatus(order.id, selectedStatus);

      Alert.alert(
        '✅ Statut mis à jour !',
        `La commande est maintenant : ${getStatusLabel(selectedStatus)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Erreur updateOrderStatus:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le statut');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    return ORDER_STATUSES.find(s => s.value === status)?.label || status;
  };

  const getStatusColor = (status) => {
    return ORDER_STATUSES.find(s => s.value === status)?.color || COLORS.textSecondary;
  };

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* HEADER */}
          <LinearGradient colors={['#ff9500', '#ff8000']} style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>Modifier le statut</Text>
                <Text style={styles.headerSubtitle}>Commande #{order.id?.slice(0, 8)}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* STATUT ACTUEL */}
          <View style={styles.currentStatusCard}>
            <Text style={styles.currentStatusLabel}>Statut actuel</Text>
            <View style={[styles.currentStatusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Ionicons 
                name={ORDER_STATUSES.find(s => s.value === order.status)?.icon || 'alert-circle'} 
                size={24} 
                color={getStatusColor(order.status)} 
              />
              <Text style={[styles.currentStatusText, { color: getStatusColor(order.status) }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>

          {/* LISTE DES STATUTS */}
          <ScrollView style={styles.statusList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Choisir le nouveau statut</Text>
            
            {ORDER_STATUSES.map((status, index) => {
              const isSelected = selectedStatus === status.value;
              const isCurrent = order.status === status.value;
              const isDisabled = status.value === order.status;

              return (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusOption,
                    isSelected && styles.statusOptionSelected,
                    isDisabled && styles.statusOptionDisabled
                  ]}
                  onPress={() => !isDisabled && setSelectedStatus(status.value)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusIcon, { backgroundColor: status.color + '20' }]}>
                      <Ionicons name={status.icon} size={24} color={status.color} />
                    </View>
                    <View style={styles.statusInfo}>
                      <View style={styles.statusHeader}>
                        <Text style={[styles.statusLabel, isDisabled && styles.statusLabelDisabled]}>
                          {status.label}
                        </Text>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Actuel</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.statusDescription, isDisabled && styles.statusDescriptionDisabled]}>
                        {status.description}
                      </Text>
                    </View>
                  </View>
                  
                  {isSelected && !isDisabled && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.roles.pharmacy.color} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* BOUTONS */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleUpdateStatus}
              disabled={loading || selectedStatus === order.status}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>Confirmer</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    overflow: 'hidden'
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: FONTS.xl,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: FONTS.sm,
    color: 'rgba(255, 255, 255, 0.9)'
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  currentStatusCard: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  currentStatusLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '600'
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md
  },
  currentStatusText: {
    fontSize: FONTS.lg,
    fontWeight: '700'
  },
  statusList: {
    flex: 1,
    padding: SPACING.lg
  },
  sectionTitle: {
    fontSize: FONTS.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.border
  },
  statusOptionSelected: {
    borderColor: COLORS.roles.pharmacy.color,
    backgroundColor: COLORS.roles.pharmacy.bg
  },
  statusOptionDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.background
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusInfo: {
    flex: 1
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  statusLabel: {
    fontSize: FONTS.md,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  statusLabelDisabled: {
    color: COLORS.textSecondary
  },
  currentBadge: {
    backgroundColor: COLORS.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm
  },
  currentBadgeText: {
    fontSize: FONTS.xs,
    color: COLORS.info,
    fontWeight: '700'
  },
  statusDescription: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  statusDescriptionDisabled: {
    color: COLORS.textSecondary,
    opacity: 0.6
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background
  },
  cancelBtnText: {
    fontSize: FONTS.md,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.roles.pharmacy.color
  },
  confirmBtnDisabled: {
    opacity: 0.6
  },
  confirmBtnText: {
    fontSize: FONTS.md,
    fontWeight: '700',
    color: '#fff'
  }
});