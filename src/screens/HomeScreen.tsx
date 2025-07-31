import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import * as Contacts from 'react-native-contacts';
import { DrawerLayout } from 'react-native-gesture-handler';
import { v4 as uuid } from 'uuid';

import ContactCard from '../components/ContactCard';
import TagPane from '../components/TagPane';
import { loadContacts, saveContacts } from '../lib/storage';
import { Contact } from '../lib/types';

export default function HomeScreen() {
  const drawer = useRef<DrawerLayout>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadContacts().then((data) => {
      if (data.length === 0) {
        const dummy: Contact[] = [
          { id: uuid(), name: 'Alice', phone: '555-1111', email: 'alice@example.com', tags: ['friends'] },
          { id: uuid(), name: 'Bob', phone: '555-2222', email: 'bob@example.com', tags: ['work'] },
          { id: uuid(), name: 'Carol', phone: '555-3333', email: 'carol@example.com', tags: ['family'] },
          { id: uuid(), name: 'Dave', phone: '555-4444', email: 'dave@example.com', tags: ['work', 'friends'] },
          { id: uuid(), name: 'Eve', phone: '555-5555', email: 'eve@example.com', tags: ['gym'] },
          { id: uuid(), name: 'Frank', phone: '555-6666', email: 'frank@example.com', tags: ['family', 'gym'] },
          { id: uuid(), name: 'Grace', phone: '555-7777', email: 'grace@example.com', tags: ['work'] },
          { id: uuid(), name: 'Heidi', phone: '555-8888', email: 'heidi@example.com', tags: ['friends', 'work'] },
          { id: uuid(), name: 'Ivan', phone: '555-9999', email: 'ivan@example.com', tags: ['family'] },
          { id: uuid(), name: 'Judy', phone: '555-0000', email: 'judy@example.com', tags: ['gym'] },
        ];
        setContacts(dummy);
        saveContacts(dummy);
      } else {
        setContacts(data);
      }
    });
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));

  const searchFiltered = contacts.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  const matchStatus = (c: Contact): 'full' | 'partial' | 'none' => {
    if (selectedTags.length === 0) return 'full';
    const hasAll = selectedTags.every((t) => c.tags.includes(t));
    if (hasAll) return 'full';
    const hasSome = selectedTags.some((t) => c.tags.includes(t));
    return hasSome ? 'partial' : 'none';
  };

  const sortByName = (a: Contact, b: Contact) =>
    a.name.localeCompare(b.name);

  const ordered = [
    ...searchFiltered.filter((c) => matchStatus(c) === 'full').sort(sortByName),
    ...searchFiltered.filter((c) => matchStatus(c) === 'partial').sort(sortByName),
    ...searchFiltered.filter((c) => matchStatus(c) === 'none').sort(sortByName),
  ];

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
    <DrawerLayout
      ref={drawer}
      drawerWidth={180}
      renderNavigationView={() => (
        <TagPane tags={allTags} active={selectedTags} toggle={toggleTag} />
      )}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.search}
          placeholder="Search contacts..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.stack}>
          {ordered.map((contact, idx) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              expanded={expanded === contact.id}
              onExpand={() => setExpanded(contact.id)}
              onClose={() => setExpanded(null)}
              match={matchStatus(contact)}
              index={idx}
            />
          ))}
        </View>
        <TouchableOpacity style={[styles.fab, styles.add]} onPress={() => {}}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.import]} onPress={handleImport}>
          <Text style={styles.fabText}>Import</Text>
        </TouchableOpacity>
      </View>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    borderColor: '#ccc',
    borderWidth: 1,
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stack: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    padding: 12,
    borderRadius: 24,
    backgroundColor: '#6ECEDB',
  },
  add: { left: 20 },
  import: { right: 20 },
  fabText: { color: 'white', fontSize: 18 },
});
