import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Swipeable, TapGestureHandler } from 'react-native-gesture-handler';

import { Contact } from '../lib/types';

interface Props {
  contact: Contact;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  match: 'full' | 'partial' | 'none';
  index: number;
}

export default function ContactCard({ contact, expanded, onExpand, onClose, match, index }: Props) {
  const background = match === 'full' ? '#FFD700' : match === 'partial' ? '#6ECEDB' : '#B0B0B0';

  const card = (
    <View style={[styles.card, { backgroundColor: background, top: index * 10, zIndex: 100 - index }]}> 
      <Text style={styles.name}>{contact.name.split(' ')[0]}</Text>
      {expanded && (
        <View style={styles.details}>
          {contact.email && <Text style={styles.detail}>{contact.email}</Text>}
          {contact.phone && <Text style={styles.detail}>{contact.phone}</Text>}
          <View style={styles.tagRow}>
            {contact.tags.map(t => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Swipeable enabled={expanded} onSwipeableOpen={onClose}>
      <TapGestureHandler numberOfTaps={2} onActivated={expanded ? onClose : onExpand}>
        {card}
      </TapGestureHandler>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    width: '90%',
    alignSelf: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    marginTop: 8,
  },
  detail: {
    fontSize: 14,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: { fontSize: 12, color: '#fff' },
});
