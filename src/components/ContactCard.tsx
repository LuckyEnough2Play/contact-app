import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Contact } from '../lib/types';

interface Props {
  contact: Contact;
  match: 'full' | 'partial' | 'none';
}

export default function ContactCard({ contact, match }: Props) {
  const background =
    match === 'full' ? 'gold' : match === 'partial' ? '#ADD8E6' : '#D3D3D3';
  const [first, ...rest] = contact.name.split(' ');
  const last = rest.join(' ');
  return (
    <View style={[styles.card, { backgroundColor: background }]}>
      <Text style={styles.name}>{`${first}, ${last}`}</Text>
    </View>
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
