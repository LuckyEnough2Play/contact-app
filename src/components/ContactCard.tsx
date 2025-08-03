import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import { Contact } from '../lib/types';

interface Props {
  contact: Contact;
  match: 'full' | 'partial' | 'none';
  onPress?: () => void;
}

export default function ContactCard({ contact, match, onPress }: Props) {
  const background =
    match === 'full' ? '#FFD700' : match === 'partial' ? '#03A9F4' : '#D3D3D3';
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: background }]}
      onPress={onPress}
    >
      <Text style={styles.name}>{`${contact.firstName}, ${contact.lastName}`}</Text>
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
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
});
