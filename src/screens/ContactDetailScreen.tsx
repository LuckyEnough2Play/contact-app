import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Contact } from '../lib/types';
import { loadContacts, saveContacts } from '../lib/storage';

export default function ContactDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);

  useEffect(() => {
    loadContacts().then((data) => {
      const found = data.find((c) => c.id === id);
      if (found) setContact(found);
    });
  }, [id]);

  const handleDelete = async () => {
    const data = await loadContacts();
    const updated = data.filter((c) => c.id !== id);
    await saveContacts(updated);
    router.back();
  };

  if (!contact) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{`${contact.firstName} ${contact.lastName}`}</Text>
      <Text style={styles.info}>Phone: {contact.phone}</Text>
      {contact.email && <Text style={styles.info}>Email: {contact.email}</Text>}
      {contact.birthday && (
        <Text style={styles.info}>
          Birthday: {new Date(contact.birthday).toLocaleDateString()}
        </Text>
      )}
      {contact.company && (
        <Text style={styles.info}>Company: {contact.company}</Text>
      )}
      {contact.tags.length > 0 && (
        <Text style={styles.info}>Tags: {contact.tags.join(', ')}</Text>
      )}
      <Button title="Edit" onPress={() => router.push(`/new?id=${contact.id}`)} />
      <Button title="Delete" color="red" onPress={handleDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  info: { fontSize: 16, marginBottom: 8 },
});
