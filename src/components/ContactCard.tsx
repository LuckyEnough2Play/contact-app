import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, View, GestureResponderEvent } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Contact } from '../lib/types';

interface Props {
  contact: Contact;
  match: 'full' | 'partial' | 'none';
  onPress?: () => void;
}

export default function ContactCard({ contact, match, onPress }: Props) {
  const background =
    match === 'full' ? '#FFD700' : match === 'partial' ? '#03A9F4' : '#D3D3D3';

  const handleCall = (e: GestureResponderEvent) => {
    e.stopPropagation();
    Linking.openURL(`tel:${contact.phone}`);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: background }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <Text style={styles.name}>{`${contact.firstName}, ${contact.lastName}`}</Text>
        <TouchableOpacity onPress={handleCall} style={styles.callButton}>
          <MaterialIcons name="call" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 16,
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  callButton: {
    padding: 4,
  },
});
