import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TagInfo } from './TagPane';
import ScrollIndicator from './ScrollIndicator';

type Props = {
  tags: TagInfo[];
  onTagPress: (name: string) => void;
  onTagLongPress?: (name: string) => void;
};

const LAST_INDEX_KEY = 'tagSheet:lastIndex';

export default function TagBottomSheet({ tags, onTagPress, onTagLongPress }: Props) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const [initialIndex, setInitialIndex] = useState<number>(0);
  const [sheetIndex, setSheetIndex] = useState<number>(0);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

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

  const renderChip = ({ item }: { item: TagInfo }) => {
    const statusStyle =
      item.status === 'selected'
        ? styles.chipSelected
        : item.status === 'irrelevant'
        ? styles.chipIrrelevant
        : null;
    return (
      <View style={styles.cell}>
        <Pressable
          onPress={() => onTagPress(item.name)}
          onLongPress={() => onTagLongPress?.(item.name)}
          style={[styles.chip, statusStyle]}
          accessibilityRole="button"
          accessibilityLabel={`Tag ${item.name}${item.count ? `, ${item.count}` : ''}`}
        >
          <Text style={styles.chipText}>
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
          <Text style={styles.handleText}>Tags</Text>
        </Pressable>
      )}
      style={styles.sheet}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: BOTTOM_SAFE }]} onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}>
        <View style={{ position: 'relative', flex: 1 }} onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}>
          <BottomSheetScrollView
            contentContainerStyle={[styles.gridWrap, { paddingBottom: BOTTOM_SAFE + 16, paddingTop: 4, paddingHorizontal: 4 }]}
            showsVerticalScrollIndicator={false}
            bottomInset={BOTTOM_SAFE}
            nestedScrollEnabled
            onContentSizeChange={(_, h) => setContentH(h)}
            onScroll={(e) => setOffsetY(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >
            {tags.map((item) => (
              <View key={item.name} style={styles.cell}> 
                {renderChip({ item })}
              </View>
            ))}
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
    flex: 1,
    minWidth: 0,
  },
  row: {
    paddingBottom: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#22A6F2',
    margin: 4,
    alignSelf: 'stretch',
    maxWidth: '100%',
    flexShrink: 1,
  },
  chipSelected: {
    backgroundColor: '#FFD700',
  },
  chipIrrelevant: {
    backgroundColor: '#D3D3D3',
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
  },
});
