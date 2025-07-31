import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface Props {
  tags: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
}

export default function TagFilterBar({ tags, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal style={styles.bar} showsHorizontalScrollIndicator={false}>
      <TouchableOpacity onPress={() => onSelect(null)} style={[styles.tag, !selected && styles.selected]}>
        <Text style={styles.text}>All</Text>
      </TouchableOpacity>
      {tags.map(tag => (
        <TouchableOpacity
          key={tag}
          onPress={() => onSelect(tag)}
          style={[styles.tag, selected === tag && styles.selected]}
        >
          <Text style={styles.text}>{tag}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  tag: {
    backgroundColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  selected: {
    backgroundColor: '#76c5ce',
  },
  text: { color: 'white' },
});
