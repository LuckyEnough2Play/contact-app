import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  onImport: () => void;
}

export default function FABMenu({ onImport }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {open && (
        <View style={styles.menu} pointerEvents="box-none">
          <TouchableOpacity style={styles.menuItem} onPress={onImport}>
            <Text style={styles.menuText}>Import</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(!open)}>
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
  menu: {
    marginBottom: 8,
  },
  menuItem: {
    backgroundColor: '#6ECEDB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  menuText: {
    color: '#fff',
  },
  fab: {
    backgroundColor: '#6ECEDB',
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
