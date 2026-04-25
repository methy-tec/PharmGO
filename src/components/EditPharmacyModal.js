import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminService from '../services/AdminService';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';


export default function EditPharmacyModal({
  visible,
  onClose,
  pharmacy,
  onSuccess
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (pharmacy) {
      setName(pharmacy.name || '');
      setCity(pharmacy.city || '');
      setIsActive(pharmacy.isActive);
    }
  }, [pharmacy]);

  const handleUpdate = async () => {
    if (!name || !city) {
      return Alert.alert('Erreur', 'Tous les champs sont obligatoires');
    }

    try {
      setLoading(true);

      await AdminService.updatePharmacy(pharmacy.id, {
        name,
        city,
        isActive
      });

      onSuccess('success', 'Pharmacie mise à jour avec succès');
      
      onClose();

    } catch (error) {
      showToast('error', '❌Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Modifier la pharmacie</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nom de la pharmacie"
            placeholderTextColor={COLORS.textSecondary}
            color={COLORS.textPrimary}
          />

          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Ville"
            placeholderTextColor={COLORS.textSecondary}
            color={COLORS.textPrimary}
            
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Pharmacie active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: COLORS.success }}
            />
          </View>

          {/* Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mettre à jour</Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: FONTS.lg,
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  label: {
    fontSize: FONTS.sm,
    marginBottom: 6,
    color: COLORS.textSecondary
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  button: {
    backgroundColor: COLORS.roles.admin.color,
    padding: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  }
});