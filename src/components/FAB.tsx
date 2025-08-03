import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onPress: () => void;
}

export default function FAB({ onPress }: Props) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity style={styles.fab} onPress={onPress}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  fab: {
    backgroundColor: '#03A9F4',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
});
