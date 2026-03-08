import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue ! 🎉</Text>
      <Text style={styles.subtitle}>
        {user?.firstName} {user?.lastName}
      </Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>Rôle : {user?.role}</Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5
  },
  role: {
    fontSize: 14,
    color: '#00b368',
    fontWeight: '600',
    marginBottom: 30
  },
  button: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
});