import React from 'react';
import { FlatList } from 'react-native';

import ContactCard from './ContactCard';
import { Contact } from '../lib/types';

interface Props {
  contacts: Contact[];
  getMatch: (c: Contact) => 'full' | 'partial' | 'none';
}

export default function ContactList({ contacts, getMatch }: Props) {
  return (
    <FlatList
      data={contacts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ContactCard contact={item} match={getMatch(item)} />
      )}
    />
  );
}
