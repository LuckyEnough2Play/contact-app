import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import ContactList from '../components/ContactList';
import TagPane, { TagInfo } from '../components/TagPane';
import { loadContacts, saveContacts } from '../lib/storage';
import { Contact } from '../lib/types';

export default function HomeScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const load = useCallback(() => {
    loadContacts().then((data) => {
      // Do not seed placeholder contacts; keep empty until user adds/imports
      setContacts(data);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleTag = (tag: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const tagCounts = useMemo<TagInfo[]>(() => {
    const counts: Record<string, number> = {};
    for (const c of contacts) {
      for (const t of c.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.keys(counts).map((name) => {
      const isSelected = selectedTags.includes(name);
      let status: TagInfo['status'];
      if (isSelected) {
        status = 'selected';
      } else {
        const relevant = contacts.some(
          (c) =>
            c.tags.includes(name) &&
            selectedTags.every((t) => c.tags.includes(t))
        );
        status = relevant ? 'relevant' : 'irrelevant';
      }
      return { name, count: counts[name], status };
    });
  }, [contacts, selectedTags]);

  const matchStatus = useCallback(
    (c: Contact): 'full' | 'partial' | 'none' => {
      if (selectedTags.length === 0) return 'partial';
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.topBar}>
        <TextInput
          style={styles.search}
          placeholder={`Search from ${contacts.length} contacts`}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        <ContactList
          contacts={ordered}
          getMatch={matchStatus}
          onPress={handlePressContact}
        />
      </View>
      <View style={styles.tagPaneWrapper}>
        <TagPane tags={tagCounts} toggle={toggleTag} remove={removeTag} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  search: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#03A9F4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
  listContainer: { flex: 1 },
  tagPaneWrapper: { marginLeft: 16, marginBottom: 16 },
});
