import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function UpdateBanner({ progress, done }) {
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={styles.row}>
        <Ionicons
          name={done ? 'checkmark-circle' : 'download-outline'}
          size={20}
          color={done ? '#00b368' : '#fff'}
        />
        <Text style={styles.label}>
          {done ? 'Téléchargement terminé !' : `Mise à jour en cours... ${progress}%`}
        </Text>
      </View>

      {!done && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    zIndex: 999,
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  track: {
    height: 6,
    backgroundColor: '#ffffff22',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#00b368',
    borderRadius: 99,
  },
});