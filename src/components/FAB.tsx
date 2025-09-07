import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export default function FAB({ onPress, icon = 'add' }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        {
          // Keep FAB clear of system gestures and rounded corners
          bottom: Math.max(16, insets.bottom) + 8,
          right: Math.max(16, insets.right) + 8,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity style={styles.fab} onPress={onPress}>
        <Ionicons name={icon} size={28} color="#fff" />
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
});
