import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  tags: string[];
  active: string[];
  toggle: (tag: string) => void;
}

export default function TagPane({ tags, active, toggle }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {tags.map((tag) => (
        <TouchableOpacity
          key={tag}
          style={[styles.tag, active.includes(tag) && styles.active]}
          onPress={() => toggle(tag)}
        >
          <Text style={styles.text}>{tag}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    width: 80,
  },
  tag: {
    backgroundColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  active: {
    backgroundColor: '#6ECEDB',
  },
  text: {
    color: '#fff',
  },
});
