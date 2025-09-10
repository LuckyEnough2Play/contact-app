import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  LayoutAnimation,
  Platform,
  UIManager,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import ContactList from '../components/ContactList';
import Fuse from 'fuse.js';
import TagPane, { TagInfo } from '../components/TagPane';
import { loadContacts, saveContacts } from '../lib/storage';
import { Contact } from '../lib/types';
import { compareContacts, NameOrder } from '../lib/names';
import { AppSettings, loadSettings, subscribeSettings } from '../lib/settings';

export default function HomeScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const router = useRouter();
  const MIN_LIST = 160;
  const MIN_TAG = 60;
  const HANDLE_H = 16;
  const [splitAreaH, setSplitAreaH] = useState(0);
  const [tagHeight, setTagHeight] = useState(120);
  const dragStartTagH = useRef(120);

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
      let mounted = true;
      loadSettings().then((s) => {
        if (mounted) setSettings(s);
      });
      const unsub = subscribeSettings((s) => setSettings(s));
      return () => {
        mounted = false;
        unsub();
      };
    }, [load])
  );

  useEffect(() => {
    if (splitAreaH <= 0) return;
    const maxTag = Math.max(MIN_TAG, splitAreaH - HANDLE_H - MIN_LIST);
    setTagHeight((h) => Math.min(Math.max(h, MIN_TAG), maxTag));
  }, [splitAreaH]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartTagH.current = tagHeight;
      },
      onPanResponderMove: (_evt, gesture) => {
        const desired = dragStartTagH.current - gesture.dy; // drag down shrinks tag
        const maxTag = Math.max(MIN_TAG, splitAreaH - HANDLE_H - MIN_LIST);
        const clamped = Math.min(Math.max(desired, MIN_TAG), maxTag);
        setTagHeight(clamped);
      },
    })
  ).current;

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

  const listHeight = Math.max(MIN_LIST, splitAreaH - (tagHeight + HANDLE_H));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
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
      <View style={styles.splitArea} onLayout={(e) => setSplitAreaH(e.nativeEvent.layout.height)}>
        <View style={[styles.listContainerFixed, { height: listHeight }]}>
          <ContactList
            contacts={ordered}
            getMatch={matchStatus}
            onPress={handlePressContact}
            nameOrder={nameOrder}
          />
        </View>
        <View style={styles.splitHandle} {...panResponder.panHandlers}>
          <View style={styles.splitGrip} />
        </View>
        <View style={[styles.tagPaneWrapper, { height: tagHeight }]}>
          <TagPane tags={tagCounts} toggle={toggleTag} remove={removeTag} height={tagHeight} />
        </View>
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
  splitHandle: {
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitGrip: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  tagPaneWrapper: { marginLeft: 16, marginBottom: 16 },
});
