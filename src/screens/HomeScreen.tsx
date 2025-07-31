import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import * as Contacts from 'react-native-contacts';
import { v4 as uuid } from 'uuid';

import ContactBubble from '../components/ContactBubble';
import TagFilterBar from '../components/TagFilterBar';
import { loadContacts, saveContacts } from '../lib/storage';
import { Contact } from '../lib/types';

export default function HomeScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    loadContacts().then((data) => {
      if (data.length === 0) {
        const dummy: Contact[] = [
          { id: uuid(), name: 'Alice', tags: ['friends'] },
          { id: uuid(), name: 'Bob', tags: ['work'] },
          { id: uuid(), name: 'Carol', tags: ['family'] },
        ];
        setContacts(dummy);
        saveContacts(dummy);
      } else {
        setContacts(data);
      }
    });
  }, []);

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));

  const filtered = filter ? contacts.filter((c) => c.tags.includes(filter)) : contacts;

  const handleImport = async () => {
    try {
      const permission = await Contacts.requestPermission();
      if (permission === 'authorized') {
        const picked = await Contacts.getAll();
        if (picked && picked.length > 0) {
          const first = picked[0];
          const newContact: Contact = {
            id: uuid(),
            name: first.givenName || first.displayName || 'Unnamed',
            phone: first.phoneNumbers?.[0]?.number,
            email: first.emailAddresses?.[0]?.email,
            tags: ['imported'],
          };
          const updated = [...contacts, newContact];
          setContacts(updated);
          saveContacts(updated);
        }
      }
    } catch (e) {
      console.warn('Import failed', e);
    }
  };

  return (
    <View style={styles.container}>
      <TagFilterBar tags={allTags} selected={filter} onSelect={setFilter} />
      <View style={styles.canvas}>
        {filtered.map((contact, idx) => (
          <ContactBubble key={contact.id} contact={contact} />
        ))}
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleImport}>
          <Text style={styles.buttonText}>Import</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvas: { flex: 1 },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  button: {
    backgroundColor: '#76c5ce',
    padding: 12,
    borderRadius: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});
