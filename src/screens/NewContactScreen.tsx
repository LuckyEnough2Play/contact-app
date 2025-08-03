import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { v4 as uuid } from 'uuid';

import { Contact } from '../lib/types';
import { loadContacts, saveContacts } from '../lib/storage';
import FAB from '../components/FAB';

export default function NewContactScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState<string | undefined>();
  const [company, setCompany] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDate, setShowDate] = useState(false);

  useEffect(() => {
    loadContacts().then((data) => {
      setContacts(data);
      setAvailableTags(Array.from(new Set(data.flatMap((c) => c.tags))));
      if (id) {
        const c = data.find((x) => x.id === id);
        if (c) {
          setFirstName(c.firstName);
          setLastName(c.lastName);
          setPhone(c.phone);
          setEmail(c.email || '');
          setBirthday(c.birthday);
          setCompany(c.company || '');
          setSelectedTags(c.tags);
        }
      }
    });
  }, [id]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !availableTags.includes(t)) {
      setAvailableTags([...availableTags, t]);
    }
    if (t && !selectedTags.includes(t)) {
      setSelectedTags([...selectedTags, t]);
    }
    setTagInput('');
  };

  const handleSave = async () => {
    const contact: Contact = {
      id: id || uuid(),
      firstName,
      lastName,
      phone,
      email: email || undefined,
      birthday,
      company: company || undefined,
      tags: selectedTags,
    };
    let updated: Contact[];
    if (id) {
      updated = contacts.map((c) => (c.id === id ? contact : c));
    } else {
      updated = [...contacts, contact];
    }
    await saveContacts(updated);
    router.back();
  };

  const handleDelete = async () => {
    if (!id) return;
    await saveContacts(contacts.filter((c) => c.id !== id));
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TouchableOpacity onPress={() => setShowDate(true)} style={styles.dateButton}>
        <Text style={styles.dateButtonText}>
          {birthday ? new Date(birthday).toLocaleDateString() : 'Set Birthday'}
        </Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker
          value={birthday ? new Date(birthday) : new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowDate(false);
            if (date) setBirthday(date.toISOString());
          }}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Company"
        value={company}
        onChangeText={setCompany}
      />
      <View style={styles.tagsSection}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.tagsContainer}>
          {availableTags.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tag, selectedTags.includes(t) && styles.selectedTag]}
              onPress={() => toggleTag(t)}
            >
              <Text style={styles.tagText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Add tag"
            value={tagInput}
            onChangeText={setTagInput}
          />
          <Button title="Add" onPress={addTag} />
        </View>
      </View>
      <Button title="Save" onPress={handleSave} />
      {id && (
        <Button title="Delete" color="red" onPress={handleDelete} />
      )}
    </ScrollView>
    <FAB icon="\u2190" onPress={() => router.back()} />
  </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  dateButton: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dateButtonText: { color: '#333' },
  tagsSection: { marginBottom: 16 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  tag: {
    backgroundColor: '#03A9F4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTag: { backgroundColor: '#FFD700' },
  tagText: { color: '#fff' },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
});
