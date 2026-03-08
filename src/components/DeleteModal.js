import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';

export default function DeleteModal({
  visible,
  title = "Supprimer ?",
  message,
  itemName,
  onCancel,
  onConfirm,
  loading = false
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.message}>
            {message}{" "}
            <Text style={styles.itemName}>
              {itemName}
            </Text>
            ?
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={styles.deleteBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deleteText}>
                  Supprimer
                </Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg
  },
  title: {
    fontSize: FONTS.lg,
    fontWeight: '800',
    marginBottom: 10,
    color: COLORS.error
  },
  message: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: 20
  },
  itemName: {
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  cancelText: {
    color: COLORS.textSecondary
  },
  deleteBtn: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700'
  }
});