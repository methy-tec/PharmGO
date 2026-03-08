// ============================================
// ✉️ ÉCRAN VÉRIFICATION EMAIL - FIXÉ
// src/screens/auth/VerifyEmailScreen.js
// ============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/AuthService';

import Toast from '../../components/Toast';

export default function VerifyEmailScreen({ navigation }) {
  const { user, verifyEmail, refreshUser, logout } = useAuth(); // ← Ajoute refreshUser
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef([]);

  const [toast, setToast] = useState(null);
  
  const showToast = (type, title, message) => {
      setToast({ type, title, message, duration: 4000 });
      }

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && !loading) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

const handleVerify = async (fullCode = code.join('')) => {
    if (fullCode.length !== 6) {
        showToast('error', 'Erreur', 'Veuillez saisir le code à 6 chiffres');
        return;
    }

    try {
        setLoading(true);
        const response = await verifyEmail(fullCode);

        if (response.success) {
            // 1. Rafraîchir l'utilisateur → met à jour isEmailVerified
            await refreshUser();

            // OU si tu préfères reset (moins recommandé ici)
            // navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
    } catch (error) {
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();

        showToast(
            'error',
            'Code invalide',
            error.message || 'Veuillez vérifier votre code et réessayer.'
        );
    } finally {
        setLoading(false);
    }
};
  const handleResendCode = async () => {
    try {
      setResending(true);
      await authService.ressendCode();
      setCountdown(60);
      showToast('success', '✅', 'Nouveau code envoyé par email');
    } catch (error) {
      showToast('error', 'Erreur', error.message || 'Impossible de renvoyer le code');
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = async () => {
  try {
    setLoading(true);
    const res = await authService.changeEmail(newEmail);
    await refreshUser(); // Met à jour l’utilisateur dans le contexte
    showToast('success', '✅', res.message);
    navigation.replace('VerifyEmail');
  } catch (error) {
    showToast('error', 'Erreur', error.message || 'Impossible de changer l’email');
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00b368', '#008C52']}
        style={styles.header}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={64} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Vérifiez votre email</Text>
        <Text style={styles.headerSubtitle}>
          Un code à 6 chiffres a été envoyé à
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                                    <Ionicons name="log-out-outline" size={22} color="#fff" />
                                </TouchableOpacity>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.instruction}>Entrez le code de vérification</Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(index, value)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={() => handleVerify()}
          disabled={loading || code.some(d => !d)}
        >
          <LinearGradient
            colors={['#00b368', '#008C52']}
            style={styles.verifyButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Vérifier</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Code pas reçu ? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Renvoyer dans {countdown}s
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={resending}
            >
              <Text style={styles.resendLink}>
                {resending ? 'Envoi...' : 'Renvoyer'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
  style={styles.changeEmailButton}
  onPress={() => navigation.navigate('ChangeEmail')}
>
  <Text style={styles.changeEmailText}>Changer l'email</Text>
</TouchableOpacity>
      </View>

      {
                toast && (
                    <Toast
                        toast={toast}
                        onDismiss={() => setToast(null)}
                    />
                )
            }
    </View>
  );
}

// ... (styles identiques)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center'
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40
  },
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
    color: '#333'
  },
  codeInputFilled: {
    borderColor: '#00b368',
    backgroundColor: '#e8f5f0'
  },
  verifyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24
  },
  verifyButtonDisabled: {
    opacity: 0.5
  },
  verifyButtonGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center'
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  resendText: {
    fontSize: 15,
    color: '#666'
  },
  resendLink: {
    fontSize: 15,
    color: '#00b368',
    fontWeight: '700'
  },
  countdownText: {
    fontSize: 15,
    color: '#999'
  },
  changeEmailButton: {
    alignItems: 'center',
    paddingVertical: 12
  },
  changeEmailText: {
    fontSize: 15,
    color: '#00b368',
    fontWeight: '600'
  }
});