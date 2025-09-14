import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Screen from '../components/Screen';
import { loadContactsSafe, saveContacts } from '../lib/storage';
import { Contact } from '../lib/types';
import { toggleTag as toggleTagGlobal, clearSelectedTags, loadSelectedTags, subscribeSelected, getSelectedTagsSync } from '../lib/tagSelection';
import { NameOrder } from '../lib/names';

type SortMode = 'count' | 'alpha';

type TagInfo = {
  name: string;
  count: number;
  status: 'selected' | 'relevant' | 'irrelevant';
};

type Section = { title: string; data: TagInfo[] };

const PERSIST_PREFIX = 'tagBrowser:';

export default function TagsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string[]>(getSelectedTagsSync());
  const [sortMode, setSortMode] = useState<SortMode>('count');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadContactsSafe().then(setContacts);
    loadSelectedTags().then(setSelected);
    (async () => {
      try {
        const s = await AsyncStorage.getItem(PERSIST_PREFIX + 'sort');
        if (s === 'alpha' || s === 'count') setSortMode(s);
        const q = await AsyncStorage.getItem(PERSIST_PREFIX + 'query');
        if (q) setQuery(q);
      } catch {}
    })();
    const unsub = subscribeSelected(setSelected);
    return () => unsub();
  }, []);

  const onChangeQuery = useCallback(async (text: string) => {
    setQuery(text);
    try { await AsyncStorage.setItem(PERSIST_PREFIX + 'query', text); } catch {}
  }, []);

  const onChangeSort = useCallback(async (m: SortMode) => {
    setSortMode(m);
    try { await AsyncStorage.setItem(PERSIST_PREFIX + 'sort', m); } catch {}
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of contacts) {
      for (const t of c.tags) map[t] = (map[t] || 0) + 1;
    }
    return map;
  }, [contacts]);

  const allTagNames = useMemo(() => Object.keys(counts).sort((a, b) => a.localeCompare(b)), [counts]);

  const computeStatus = useCallback((name: string): TagInfo['status'] => {
    if (selected.includes(name)) return 'selected';
    const relevant = contacts.some((c) => c.tags.includes(name) && selected.every((t) => c.tags.includes(t)));
    return relevant ? 'relevant' : 'irrelevant';
  }, [contacts, selected]);

  const filteredSorted: TagInfo[] = useMemo(() => {
    const list: TagInfo[] = [];
    const q = query.trim().toLowerCase();
    const names = q ? allTagNames.filter((n) => n.toLowerCase().includes(q)) : allTagNames;
    for (const n of names) list.push({ name: n, count: counts[n] || 0, status: computeStatus(n) });
    list.sort((a, b) => {
      const so = (s: TagInfo['status']) => (s === 'selected' ? 0 : s === 'relevant' ? 1 : 2);
      const sd = so(a.status) - so(b.status);
      if (sd !== 0) return sd;
      if (sortMode === 'count') {
        const cd = (b.count || 0) - (a.count || 0);
        if (cd !== 0) return cd;
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [allTagNames, counts, computeStatus, query, sortMode]);

  const sections: Section[] = useMemo(() => {
    const s: TagInfo[] = [], r: TagInfo[] = [], o: TagInfo[] = [];
    for (const t of filteredSorted) {
      if (t.status === 'selected') s.push(t);
      else if (t.status === 'relevant') r.push(t);
      else o.push(t);
    }
    const out: Section[] = [];
    if (s.length) out.push({ title: 'Selected', data: s });
    if (r.length) out.push({ title: 'Relevant', data: r });
    if (o.length) out.push({ title: 'All', data: o });
    return out;
  }, [filteredSorted]);

  const onToggle = useCallback(async (name: string) => {
    await toggleTagGlobal(name);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, []);

  const onDelete = useCallback((name: string) => {
    Alert.alert('Delete tag', `Delete tag "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = contacts.map((c) => ({ ...c, tags: c.tags.filter((t) => t !== name) }));
          await saveContacts(updated);
          setContacts(updated);
          // also remove from selection if present
          if (selected.includes(name)) await toggleTagGlobal(name);
        }
      }
    ]);
  }, [contacts, selected]);

  const selectedCount = selected.length;

  return (
    <Screen scroll={false} padding={0}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}> 
        <Text style={styles.title}>Tags</Text>
        <View style={styles.controlsRow}>
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Find tag"
            placeholderTextColor="#8A94A6"
            style={styles.searchInput}
            accessibilityLabel="Search tags"
            returnKeyType="search"
          />
          <View style={styles.sortToggle}>
            <Pressable onPress={() => onChangeSort('count')} style={[styles.sortOption, sortMode === 'count' && styles.sortOptionActive]} accessibilityRole="button" accessibilityLabel="Sort by count">
              <Text style={[styles.sortText, sortMode === 'count' && styles.sortTextActive]}>Count</Text>
            </Pressable>
            <Pressable onPress={() => onChangeSort('alpha')} style={[styles.sortOption, sortMode === 'alpha' && styles.sortOptionActive]} accessibilityRole="button" accessibilityLabel="Sort A to Z">
              <Text style={[styles.sortText, sortMode === 'alpha' && styles.sortTextActive]}>A–Z</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.selectedRow}>
          <Text style={styles.selectedText}>{selectedCount ? `${selectedCount} selected` : 'No tags selected'}</Text>
          {selectedCount ? (
            <Pressable onPress={() => clearSelectedTags()} style={styles.clearButton} accessibilityRole="button" accessibilityLabel="Clear selected tags">
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.back()} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.name}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{section.title}</Text></View>
          )}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <Pressable
                onPress={() => onToggle(item.name)}
                onLongPress={() => onDelete(item.name)}
                style={[styles.chip, item.status === 'selected' ? styles.chipSelected : item.status === 'irrelevant' ? styles.chipIrrelevant : null]}
                accessibilityRole="button"
                accessibilityLabel={`Tag ${item.name}${item.count ? `, ${item.count}` : ''}`}
              >
                <Text style={[styles.chipText, item.status === 'irrelevant' ? styles.chipTextIrrelevant : null]} numberOfLines={1}>
                  {item.name}{item.count != null ? ` (${item.count})` : ''}
                </Text>
              </Pressable>
            </View>
          )}
          contentContainerStyle={{ padding: 12, paddingBottom: Math.max(insets.bottom, 12) + 8 }}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#111',
    backgroundColor: '#fff',
  },
  sortToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden' },
  sortOption: { paddingHorizontal: 10, paddingVertical: 6 },
  sortOptionActive: { backgroundColor: '#fff' },
  sortText: { color: '#475569', fontWeight: '600' },
  sortTextActive: { color: '#111' },
  selectedRow: { marginTop: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedText: { color: '#475569', fontWeight: '500' },
  clearButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EEF2F7', borderRadius: 6 },
  clearButtonText: { color: '#111', fontWeight: '600' },
  closeButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F1F5F9', borderRadius: 6, marginLeft: 8 },
  closeButtonText: { color: '#111', fontWeight: '600' },
  sectionHeader: { backgroundColor: '#fff', paddingVertical: 6 },
  sectionTitle: { fontWeight: '700', color: '#3A3F47' },
  cell: { paddingVertical: 4 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#03A9F4', margin: 4, maxWidth: '100%' },
  chipSelected: { backgroundColor: '#FFD700' },
  chipIrrelevant: { backgroundColor: '#E5E7EB' },
  chipText: { color: '#fff', fontWeight: '600' },
  chipTextIrrelevant: { color: '#111', fontWeight: '600' },
});

