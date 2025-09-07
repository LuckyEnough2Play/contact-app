import React from 'react';
import { FlatList } from 'react-native';

import ContactCard from './ContactCard';
import { Contact } from '../lib/types';

interface Props {
  contacts: Contact[];
  getMatch: (c: Contact) => 'full' | 'partial' | 'none';
  onPress: (c: Contact) => void;
}

export default function ContactList({ contacts, getMatch, onPress }: Props) {
  return (
    <FlatList
      data={contacts}
      keyExtractor={(item) => item.id}
      initialNumToRender={12}
      windowSize={5}
      removeClippedSubviews
      renderItem={({ item }) => (
        <ContactCard
          contact={item}
          match={getMatch(item)}
          onPress={() => onPress(item)}
        />
      )}
    />
  );
}
