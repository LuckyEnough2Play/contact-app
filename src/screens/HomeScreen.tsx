import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import ContactList from '../components/ContactList';
import TagPane from '../components/TagPane';
import FAB from '../components/FAB';
import { loadContacts, saveContacts } from '../lib/storage';
import { Contact } from '../lib/types';
import { generateSeedContacts } from '../lib/seed';

export default function HomeScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const load = useCallback(() => {
    loadContacts().then((data) => {
      if (data.length === 0) {
        const dummy = generateSeedContacts();
        setContacts(dummy);
        saveContacts(dummy);
      } else {
        setContacts(data);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const removeTag = (tag: string) => {
    setContacts((prev) => {
      const updated = prev.map((c) => ({
        ...c,
        tags: c.tags.filter((t) => t !== tag),
      }));
      saveContacts(updated);
      return updated;
    });
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of contacts) {
      for (const t of c.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, count: counts[name] }));
  }, [contacts]);

  const matchStatus = useCallback(
    (c: Contact): 'full' | 'partial' | 'none' => {
      if (selectedTags.length === 0) return 'none';
      const hasAll =
        selectedTags.every((t) => c.tags.includes(t)) &&
        c.tags.length === selectedTags.length;
      if (hasAll) return 'full';
      const hasSome = selectedTags.some((t) => c.tags.includes(t));
      return hasSome ? 'partial' : 'none';
    },
    [selectedTags]
  );

  const sortByName = (a: Contact, b: Contact) =>
    (a.firstName || '').localeCompare(b.firstName || '') ||
    (a.lastName || '').localeCompare(b.lastName || '');

  const searchFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) ||
        c.tags.some((t) => t.toLowerCase().includes(term))
    );
  }, [contacts, search]);

  const ordered = useMemo(() => {
    const groups = {
      full: [] as Contact[],
      partial: [] as Contact[],
      none: [] as Contact[],
    };

    for (const c of searchFiltered) {
      groups[matchStatus(c)].push(c);
    }

    return [
      ...groups.full.sort(sortByName),
      ...groups.partial.sort(sortByName),
      ...groups.none.sort(sortByName),
    ];
  }, [searchFiltered, matchStatus]);

  const handleAdd = () => {
    router.push('/new');
  };

  const handlePressContact = (c: Contact) => {
    router.push(`/new?id=${c.id}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TextInput
        style={styles.search}
        placeholder="Search contacts..."
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.listContainer}>
        <ContactList
          contacts={ordered}
          getMatch={matchStatus}
          onPress={handlePressContact}
        />
      </View>
      <View style={styles.tagPaneWrapper}>
        <TagPane
          tags={tagCounts}
          active={selectedTags}
          toggle={toggleTag}
          remove={removeTag}
        />
      </View>
      <FAB onPress={handleAdd} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  search: {
    borderColor: '#ccc',
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  listContainer: { flex: 1 },
  tagPaneWrapper: { marginLeft: 16, marginBottom: 16 },
});
