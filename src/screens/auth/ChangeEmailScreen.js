// ============================================
// ✉️ ÉCRAN CHANGER EMAIL
// src/screens/auth/ChangeEmailScreen.js
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/AuthService';
import Toast from '../../components/Toast';

export default function ChangeEmailScreen({ navigation }) {
  const { user, refreshUser } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message, duration: 4000 });
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      showToast('error', 'Erreur', 'Veuillez entrer un email valide');
      return;
    }

    try {
      setLoading(true);
      await authService.changeEmail(newEmail); // ↪ service pour changer email côté backend
      await refreshUser();

      showToast('success', '✅', 'Email mis à jour, veuillez vérifier votre boîte');
      
      // Retour à l'écran de vérification avec nouvel email
      navigation.replace('VerifyEmail');
    } catch (error) {
      showToast('error', 'Erreur', error.message || 'Impossible de changer l’email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Changer votre email</Text>
      <Text style={styles.subtitle}>
        Votre email actuel : {user?.email}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Nouvel email"
        value={newEmail}
        onChangeText={setNewEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleChangeEmail}
        disabled={loading}
      >
        <LinearGradient
          colors={['#00b368', '#008C52']}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Mettre à jour</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Annuler</Text>
      </TouchableOpacity>

      {toast && (
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center'
  },
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12
  },
  backText: {
    fontSize: 16,
    color: '#00b368',
    fontWeight: '600'
  }
});