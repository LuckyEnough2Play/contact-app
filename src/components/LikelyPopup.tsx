import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface LikelyPopupProps {
  names: string[];
}

export default function LikelyPopup({ names }: LikelyPopupProps) {
  if (!names.length) return null;
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>Likely:</Text>
      {names.map((n) => (
        <Text key={n} style={styles.name}>{n}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 9999,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  name: {
    color: '#fff',
  },
});

