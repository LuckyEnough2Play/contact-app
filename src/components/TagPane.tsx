import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface TagInfo {
  name: string;
  count: number;
  status: 'selected' | 'relevant' | 'irrelevant';
}

interface Props {
  tags: TagInfo[];
  toggle: (tag: string) => void;
  remove: (tag: string) => void;
  height?: number;
  scrollEnabled?: boolean;
  onScrollOffsetChange?: (y: number) => void;
}

import ScrollIndicator from './ScrollIndicator';

export default function TagPane({ tags, toggle, remove, height, scrollEnabled = true, onScrollOffsetChange }: Props) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const closeModal = () => setPendingDelete(null);
  const confirmDelete = () => {
    if (pendingDelete) {
      remove(pendingDelete);
      closeModal();
    }
  };

  const sorted = useMemo(() => {
    return [...tags].sort((a, b) => {
      const order = (s: TagInfo['status']) =>
        s === 'selected' ? 0 : s === 'relevant' ? 1 : 2;
      const diff = order(a.status) - order(b.status);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  }, [tags]);

  const wrapperStyle = height != null ? [styles.wrapperBase, { height }] : [styles.wrapperBase, styles.wrapperMax];

  return (
    <>
      <View style={wrapperStyle as any} onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          onContentSizeChange={(_, h) => setContentH(h)}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            setOffsetY(y);
            onScrollOffsetChange?.(y);
          }}
          scrollEventThrottle={16}
        >
        {sorted.map((t) => (
          <TouchableOpacity
            key={t.name}
            style={[
              styles.tag,
              t.status === 'selected' && styles.selected,
              t.status === 'irrelevant' && styles.irrelevant,
            ]}
            onPress={() => toggle(t.name)}
            onLongPress={() => setPendingDelete(t.name)}
          >
            <Text style={styles.text}>{`${t.name} (${t.count})`}</Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
        <ScrollIndicator viewportHeight={viewportH} contentHeight={contentH} scrollOffset={offsetY} />
      </View>
      <Modal transparent visible={pendingDelete !== null} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Delete tag &quot;{pendingDelete}&quot;?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.modalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapperBase: { position: 'relative' },
  wrapperMax: { maxHeight: 120 },
  scroll: {},
  container: {
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  tag: {
    backgroundColor: '#03A9F4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selected: {
    backgroundColor: '#FFD700',
  },
  irrelevant: {
    backgroundColor: '#D3D3D3',
  },
  text: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    maxWidth: 300,
  },
  modalText: {
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  modalButtonText: {
    color: '#fff',
  },
});

