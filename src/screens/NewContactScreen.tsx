import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { v4 as uuid } from 'uuid';
import * as DeviceContacts from 'expo-contacts';

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
  const [importQueue, setImportQueue] = useState<DeviceContacts.Contact[]>([]);

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

  const populateFromDeviceContact = (c: DeviceContacts.Contact) => {
    setFirstName(c.firstName || '');
    setLastName(c.lastName || '');
    setPhone(c.phoneNumbers?.[0]?.number || '');
    setEmail(c.emails?.[0]?.email || '');
    if (c.birthday && (c.birthday.day || c.birthday.month || c.birthday.year)) {
      const year = c.birthday.year ?? new Date().getFullYear();
      const month = (c.birthday.month ?? 1) - 1;
      const day = c.birthday.day ?? 1;
      setBirthday(new Date(year, month, day).toISOString());
    } else {
      setBirthday(undefined);
    }
    setCompany(c.company || '');
    setSelectedTags([]);
  };

  const handleImport = async () => {
    const { status } = await DeviceContacts.requestPermissionsAsync();
    if (status !== 'granted') return;
    const picked: DeviceContacts.Contact[] = [];
    // allow selecting multiple contacts sequentially
    // user cancels picker to finish selection
    while (true) {
      const contact = await DeviceContacts.presentContactPickerAsync();
      // ensure we return to our app after the picker closes
      await Linking.openURL('contactapp://');
      if (!contact) break;
      picked.push(contact);
    }
    if (picked.length === 0) return;
    const [first, ...rest] = picked;
    setImportQueue(rest);
    populateFromDeviceContact(first);
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
    if (importQueue.length > 0) {
      const [next, ...rest] = importQueue;
      setImportQueue(rest);
      populateFromDeviceContact(next);
      return;
    }
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
      <View style={styles.phoneRow}>
        <TextInput
          style={[styles.input, styles.phoneInput]}
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${phone}`)}
          style={styles.callButton}
        >
          <MaterialIcons name="call" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.emailRow}>
        <TextInput
          style={[styles.input, styles.emailInput]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${email}`)}
          style={styles.emailButton}
        >
          <MaterialIcons name="email" size={24} color="#000" />
        </TouchableOpacity>
      </View>
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
      {!id && <Button title="Import" onPress={handleImport} />}
      {id && (
        <Button title="Delete" color="red" onPress={handleDelete} />
      )}
    </ScrollView>
    <FAB icon="arrow-back" onPress={() => router.back()} />
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  callButton: {
    marginLeft: 8,
    padding: 8,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailInput: {
    flex: 1,
    marginBottom: 0,
  },
  emailButton: {
    marginLeft: 8,
    padding: 8,
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
