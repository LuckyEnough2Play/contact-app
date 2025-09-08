import React, { useState } from 'react';
import { FlatList, View } from 'react-native';

import ContactCard from './ContactCard';
import { Contact } from '../lib/types';
import ScrollIndicator from './ScrollIndicator';

interface Props {
  contacts: Contact[];
  getMatch: (c: Contact) => 'full' | 'partial' | 'none';
  onPress: (c: Contact) => void;
}

export default function ContactList({ contacts, getMatch, onPress }: Props) {
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  return (
    <View style={{ flex: 1, position: 'relative' }} onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        initialNumToRender={12}
        windowSize={5}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onContentSizeChange={(_, h) => setContentH(h)}
        onScroll={(e) => setOffsetY(e.nativeEvent.contentOffset.y)}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            match={getMatch(item)}
            onPress={() => onPress(item)}
          />
        )}
      />
      <ScrollIndicator
        viewportHeight={viewportH}
        contentHeight={contentH}
        scrollOffset={offsetY}
      />
    </View>
  );
}
