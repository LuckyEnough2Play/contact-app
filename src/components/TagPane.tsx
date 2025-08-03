import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TagInfo {
  name: string;
  count: number;
}

interface Props {
  tags: TagInfo[];
  active: string[];
  toggle: (tag: string) => void;
  remove: (tag: string) => void;
}

export default function TagPane({ tags, active, toggle, remove }: Props) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const closeModal = () => setPendingDelete(null);
  const confirmDelete = () => {
    if (pendingDelete) {
      remove(pendingDelete);
      closeModal();
    }
  };

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator
      >
        {tags.map((t) => (
          <TouchableOpacity
            key={t.name}
            style={[styles.tag, active.includes(t.name) && styles.active]}
            onPress={() => toggle(t.name)}
            onLongPress={() => setPendingDelete(t.name)}
          >
            <Text style={styles.text}>{`${t.name} (${t.count})`}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  scroll: {
    maxHeight: 120,
  },
  container: {
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  tag: {
    backgroundColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  active: {
    backgroundColor: '#6ECEDB',
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

