import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

import ContactList from '../components/ContactList';
import TagPane from '../components/TagPane';
import FABMenu from '../components/FABMenu';
import { loadContacts, saveContacts } from '../lib/storage';
import { Contact } from '../lib/types';

const names = [
  'Alice Johnson',
  'Bob Smith',
  'Carol Williams',
  'David Brown',
  'Eve Davis',
  'Frank Miller',
  'Grace Wilson',
  'Heidi Moore',
  'Ivan Taylor',
  'Judy Anderson',
  'Kevin Thomas',
  'Laura Jackson',
  'Mallory White',
  'Niaj Harris',
  'Olivia Martin',
  'Peggy Thompson',
  'Quentin Garcia',
  'Rupert Martinez',
  'Sybil Robinson',
  'Trent Clark',
];

const tagPool = ['Work', 'Family', 'Friends', 'Gym', 'Clients', 'Urgent'];

function randomTags(): string[] {
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...tagPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function HomeScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadContacts().then((data) => {
      if (data.length === 0) {
        const dummy = names.map((name) => ({
          id: uuid(),
          name,
          tags: randomTags(),
        }));
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

  const matchStatus = useCallback(
    (c: Contact): 'full' | 'partial' | 'none' => {
      if (selectedTags.length === 0) return 'full';
      const hasAll = selectedTags.every((t) => c.tags.includes(t));
      if (hasAll) return 'full';
      const hasSome = selectedTags.some((t) => c.tags.includes(t));
      return hasSome ? 'partial' : 'none';
    },
    [selectedTags]
  );

  const sortByName = (a: Contact, b: Contact) => a.name.localeCompare(b.name);

  const ordered = useMemo(() => {
    const groups = {
      full: [] as Contact[],
      partial: [] as Contact[],
      none: [] as Contact[],
    };

    for (const c of contacts) {
      groups[matchStatus(c)].push(c);
    }

    return [
      ...groups.full.sort(sortByName),
      ...groups.partial.sort(sortByName),
      ...groups.none.sort(sortByName),
    ];
  }, [contacts, matchStatus]);

  const handleImport = async () => {
    if (Platform.OS === 'web') {
      console.warn('Import not supported on web');
      return;
    }

    try {
      const Contacts = (await import('react-native-contacts')).default;
      const permission = await Contacts.requestPermission();
      if (permission === 'authorized') {
        const picked = await Contacts.getAll();
        if (picked && picked.length > 0) {
          const first = picked[0];
          const newContact: Contact = {
            id: uuid(),
            name: first.givenName || first.displayName || 'Unnamed',
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.row}>
        <View style={styles.listContainer}>
          <ContactList contacts={ordered} getMatch={matchStatus} />
        </View>
        <TagPane tags={allTags} active={selectedTags} toggle={toggleTag} />
      </View>
      <FABMenu onImport={handleImport} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  row: { flex: 1, flexDirection: 'row' },
  listContainer: { flex: 1 },
});
