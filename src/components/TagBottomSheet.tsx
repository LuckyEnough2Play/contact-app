import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import type { TagInfo } from './TagPane';
import ScrollIndicator from './ScrollIndicator';

type Props = {
  tags: TagInfo[];
  onTagPress: (name: string) => void;
  onTagLongPress?: (name: string) => void;
};

const LAST_INDEX_KEY = 'tagSheet:lastIndex';

type SortMode = 'count' | 'alpha';

export default function TagBottomSheet({ tags, onTagPress, onTagLongPress }: Props) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const [initialIndex, setInitialIndex] = useState<number>(0);
  const [sheetIndex, setSheetIndex] = useState<number>(0);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('count');

  // Collapsed height tuned to show ~2 tag rows below the handle
  const COLLAPSED_VISIBLE = 120; // dp visible height for collapsed state (excluding safe area)
  const BOTTOM_SAFE = Math.max(insets.bottom, 12);

  const snapPoints = useMemo(() => {
    return [COLLAPSED_VISIBLE + BOTTOM_SAFE, '55%'] as const;
  }, [BOTTOM_SAFE]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LAST_INDEX_KEY);
        if (saved !== null) {
          const idx = Number(saved);
          setInitialIndex(idx);
          setSheetIndex(idx);
        }
        const savedSort = await AsyncStorage.getItem('tagSheet:sort');
        if (savedSort === 'alpha' || savedSort === 'count') setSortMode(savedSort);
        const savedQuery = await AsyncStorage.getItem('tagSheet:query');
        if (savedQuery) setQuery(savedQuery);
      } catch {}
    })();
  }, []);

  const handleSheetChange = useCallback(async (index: number) => {
    setSheetIndex(index);
    try {
      await AsyncStorage.setItem(LAST_INDEX_KEY, String(index));
    } catch {}
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (sheetIndex === 0) {
        sheetRef.current?.expand();
        await AsyncStorage.setItem(LAST_INDEX_KEY, '1');
        setSheetIndex(1);
      } else {
        sheetRef.current?.collapse();
        await AsyncStorage.setItem(LAST_INDEX_KEY, '0');
        setSheetIndex(0);
      }
    } catch {}
  }, [sheetIndex]);

  const filteredSorted: TagInfo[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const src = q
      ? tags.filter((t) => t.name.toLowerCase().includes(q))
      : tags.slice();
    const statusOrder = (s: TagInfo['status']) => (s === 'selected' ? 0 : s === 'relevant' ? 1 : 2);
    src.sort((a, b) => {
      const so = statusOrder(a.status) - statusOrder(b.status);
      if (so !== 0) return so;
      if (sortMode === 'count') {
        const cdiff = (b.count || 0) - (a.count || 0);
        if (cdiff !== 0) return cdiff;
      }
      return a.name.localeCompare(b.name);
    });
    return src;
  }, [tags, query, sortMode]);

  const selectedCount = useMemo(() => tags.filter((t) => t.status === 'selected').length, [tags]);

  const setSort = useCallback(async (m: SortMode) => {
    setSortMode(m);
    try {
      await AsyncStorage.setItem('tagSheet:sort', m);
    } catch {}
  }, []);

  const onChangeQuery = useCallback(async (text: string) => {
    setQuery(text);
    try {
      await AsyncStorage.setItem('tagSheet:query', text);
    } catch {}
  }, []);

  const clearAllSelected = useCallback(async () => {
    const selected = tags.filter((t) => t.status === 'selected');
    if (selected.length === 0) return;
    // Toggle each selected tag off via parent-provided toggler
    for (const t of selected) onTagPress(t.name);
    try { await Haptics.selectionAsync(); } catch {}
  }, [tags, onTagPress]);

  const renderChip = ({ item }: { item: TagInfo }) => {
    const statusStyle =
      item.status === 'selected'
        ? styles.chipSelected
        : item.status === 'irrelevant'
        ? styles.chipIrrelevant
        : null;
    const textStatusStyle =
      item.status === 'irrelevant' ? styles.chipTextIrrelevant : undefined;
    return (
      <View style={styles.cell}>
        <Pressable
          onPress={() => {
            onTagPress(item.name);
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          }}
          onLongPress={() => onTagLongPress?.(item.name)}
          style={[styles.chip, statusStyle]}
          accessibilityRole="button"
          accessibilityLabel={`Tag ${item.name}${item.count ? `, ${item.count}` : ''}`}
        >
          <Text style={[styles.chipText, textStatusStyle]} numberOfLines={1}>
            {item.name}
            {item.count != null ? ` (${item.count})` : ''}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={initialIndex}
      snapPoints={snapPoints as any}
      enablePanDownToClose={false}
      onChange={handleSheetChange}
      handleComponent={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Expand or collapse tags"
          onPress={toggle}
          style={styles.handle}
        >
          <View style={styles.grabber} />
          <Text style={styles.handleText}>{`Tags${selectedCount ? ` (${selectedCount} selected)` : ''}`}</Text>
        </Pressable>
      )}
      style={styles.sheet}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: BOTTOM_SAFE }]} onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}>
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
            <Pressable onPress={() => setSort('count')} style={[styles.sortOption, sortMode === 'count' && styles.sortOptionActive]} accessibilityRole="button" accessibilityLabel="Sort by count">
              <Text style={[styles.sortText, sortMode === 'count' && styles.sortTextActive]}>Count</Text>
            </Pressable>
            <Pressable onPress={() => setSort('alpha')} style={[styles.sortOption, sortMode === 'alpha' && styles.sortOptionActive]} accessibilityRole="button" accessibilityLabel="Sort A to Z">
              <Text style={[styles.sortText, sortMode === 'alpha' && styles.sortTextActive]}>A–Z</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.selectedRow}>
          <Text style={styles.selectedText}>{selectedCount ? `${selectedCount} selected` : 'No tags selected'}</Text>
          {selectedCount ? (
            <Pressable onPress={clearAllSelected} style={styles.clearButton} accessibilityRole="button" accessibilityLabel="Clear selected tags">
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={{ position: 'relative', flex: 1 }} onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}>
          <BottomSheetScrollView
            contentContainerStyle={[styles.gridWrap, { paddingBottom: BOTTOM_SAFE + 16, paddingTop: 4, paddingHorizontal: 4 }]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            onContentSizeChange={(_, h) => setContentH(h)}
            onScroll={(e) => setOffsetY(e.nativeEvent.contentOffset.y)}
          >
            {filteredSorted.length === 0 ? (
              <View style={styles.emptyState}> 
                <Text style={styles.emptyTitle}>No tags</Text>
                <Text style={styles.emptySubtitle}>
                  {query.trim() ? 'Try a different search.' : 'Add tags while editing contacts.'}
                </Text>
              </View>
            ) : (
              filteredSorted.map((item) => (
                <View key={item.name} style={styles.cell}> 
                  {renderChip({ item })}
                </View>
              ))
            )}
          </BottomSheetScrollView>
          <ScrollIndicator viewportHeight={viewportH} contentHeight={contentH} scrollOffset={offsetY} rightOffset={6} />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {},
  sheetBg: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 6,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C8CDD7',
  },
  handleText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#3A3F47',
    marginBottom: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  grid: {
    paddingBottom: 8,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  cell: {
    minWidth: 0,
  },
  row: {
    paddingBottom: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#03A9F4',
    margin: 4,
    maxWidth: '100%',
  },
  chipSelected: {
    backgroundColor: '#FFD700',
  },
  chipIrrelevant: {
    backgroundColor: '#E5E7EB',
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
  },
  chipTextIrrelevant: {
    color: '#111',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
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
  sortToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sortOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortOptionActive: {
    backgroundColor: '#fff',
  },
  sortText: {
    color: '#475569',
    fontWeight: '600',
  },
  sortTextActive: {
    color: '#111',
  },
  selectedRow: {
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedText: {
    color: '#475569',
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EEF2F7',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#111',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#475569',
  },
});
