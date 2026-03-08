import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TOAST_TYPES = {
  success: {
    icon: 'checkmark-circle',
    colors: ['#00b368', '#008C52'],
    bg: '#f0fdf4',
    border: '#86efac',
    title: '#14532d',
    text: '#166534',
  },
  error: {
    icon: 'close-circle',
    colors: ['#ef4444', '#dc2626'],
    bg: '#fef2f2',
    border: '#fca5a5',
    title: '#7f1d1d',
    text: '#991b1b',
  },
  warning: {
    icon: 'warning',
    colors: ['#f59e0b', '#d97706'],
    bg: '#fffbeb',
    border: '#fcd34d',
    title: '#78350f',
    text: '#92400e',
  },
};

export default function Toast({ toast, onDismiss }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cfg = TOAST_TYPES[toast.type] || TOAST_TYPES.error;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => dismiss(), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => onDismiss());
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY }],
          opacity,
          borderColor: cfg.border,
          backgroundColor: cfg.bg,
        },
      ]}
    >
      <LinearGradient colors={cfg.colors} style={styles.accent} />

      <View style={styles.iconWrap}>
        <Ionicons name={cfg.icon} size={22} color={cfg.colors[0]} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: cfg.title }]}>
          {toast.title}
        </Text>
        <Text style={[styles.message, { color: cfg.text }]}>
          {toast.message}
        </Text>
      </View>

      <TouchableOpacity onPress={dismiss} style={styles.close}>
        <Ionicons name="close" size={16} color={cfg.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 8,
  },
  accent: { width: 5 },
  iconWrap: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  title: {
    fontWeight: '800',
    fontSize: 13,
  },
  message: {
    fontSize: 12,
    marginTop: 2,
  },
  close: {
    padding: 10,
  },
});