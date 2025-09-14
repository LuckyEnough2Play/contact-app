import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Platform, UIManager, LayoutAnimation } from 'react-native';
import Screen from '../components/Screen';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import ContactList from '../components/ContactList';
import Fuse from 'fuse.js';
import { loadContactsSafe, saveContacts } from '../lib/storage';
import { Contact } from '../lib/types';
import { compareContacts, NameOrder } from '../lib/names';
import { AppSettings, loadSettings, subscribeSettings } from '../lib/settings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadSelectedTags, subscribeSelected, toggleTag as toggleTagGlobal, clearSelectedTags, getSelectedTagsSync } from '../lib/tagSelection';

export default function HomeScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(getSelectedTagsSync());
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const COLLAPSED_HEIGHT = 0; // no bottom sheet; list can use full height

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const load = useCallback(() => {
    loadContactsSafe().then((data) => {
      // Do not seed placeholder contacts; keep empty until user adds/imports
      setContacts(data);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      let mounted = true;
      loadSettings().then((s) => { if (mounted) setSettings(s); });
      const unsubSettings = subscribeSettings((s) => setSettings(s));
      loadSelectedTags().then((tags) => { if (mounted) setSelectedTags(tags); });
      const unsubSel = subscribeSelected((tags) => setSelectedTags(tags));
      return () => { mounted = false; unsubSettings(); unsubSel(); };
    }, [load])
  );

  // no bottom sheet; list can use full height

  const toggleTag = (tag: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTagGlobal(tag);
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
    // Remove from selection as well if present
    if (selectedTags.includes(tag)) toggleTagGlobal(tag);
  };

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

  const nameOrder: NameOrder = settings?.nameOrder || 'firstLast';
  const sortByName = (a: Contact, b: Contact) => compareContacts(a, b, nameOrder);

  type SearchItem = { ref: Contact; indexText: string };

  const searchIndex = useMemo<SearchItem[]>(() => {
    return contacts.map((c) => {
      const fields: (string | undefined)[] = [
        c.firstName,
        c.lastName,
        c.phone,
        c.phone?.replace(/\D/g, ''),
        c.email,
        c.company,
        c.title,
        c.birthday,
        ...(c.tags || []),
      ];
      const indexText = fields
        .filter((v): v is string => !!v)
        .join(' ')
        .toLowerCase();
      return { ref: c, indexText };
    });
  }, [contacts]);

  const fuse = useMemo(() => {
    return new Fuse<SearchItem>(searchIndex, {
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: ['indexText'],
    });
  }, [searchIndex]);

  const searchFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    const results = fuse.search(term);
    return results.map((r) => r.item.ref);
  }, [contacts, search, fuse]);

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

  const openTags = () => router.push('/tags');

  // Contact list occupies full height

  return (
    <Screen scroll={false} padding={0}>
      <View style={styles.topBar}>
        <TextInput
          style={styles.search}
          placeholder={`Search from ${contacts.length} contacts`}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')} accessibilityLabel="Open settings">
          <MaterialIcons name="settings" size={22} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.selectedBar}>
        <Text style={styles.selectedSummary}>{selectedTags.length ? `${selectedTags.length} selected` : 'No tags selected'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {selectedTags.length ? (
            <TouchableOpacity style={styles.clearButton} onPress={() => clearSelectedTags()} accessibilityLabel="Clear selected tags">
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.browseButton} onPress={openTags} accessibilityLabel="Browse tags">
            <Text style={styles.browseButtonText}>Browse Tags</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.listContainerFixed, { flex: 1 }]}>
        <ContactList
          contacts={ordered}
          getMatch={matchStatus}
          onPress={handlePressContact}
          nameOrder={nameOrder}
          bottomPadding={Math.max(insets.bottom, 12)}
        />
      </View>
    </Screen>
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
  iconButton: {
    backgroundColor: '#eee',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
  splitArea: { flex: 1 },
  listContainerFixed: { position: 'relative' },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedSummary: { color: '#475569', fontWeight: '500' },
  browseButton: { backgroundColor: '#03A9F4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  browseButtonText: { color: '#fff', fontWeight: '600' },
  clearButton: { backgroundColor: '#EEF2F7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  clearButtonText: { color: '#111', fontWeight: '600' },
  // legacy split styles removed by bottom sheet integration
});
