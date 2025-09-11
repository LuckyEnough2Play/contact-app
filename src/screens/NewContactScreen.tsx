import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { v4 as uuid } from 'uuid';
import * as DeviceContacts from 'expo-contacts';

import { Contact } from '../lib/types';
import { loadContactsSafe, saveContacts } from '../lib/storage';
import Screen from '../components/Screen';
import BottomActionBar from '../components/BottomActionBar';
import { placeCall } from '../lib/call';
import { loadSettings } from '../lib/settings';

export default function NewContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState<string | undefined>();
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDate, setShowDate] = useState(false);
  // removed custom scroll indicator in favor of standard scroll
  // Import flow simplified to single-pick to avoid navigation bounce

  useEffect(() => {
    loadContactsSafe().then((data) => {
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
          setTitle(c.title || '');
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
    const anyC = c as any;
    setTitle(anyC?.jobTitle || '');
    setSelectedTags([]);
  };

  const handleImport = async () => {
    const { status } = await DeviceContacts.requestPermissionsAsync();
    if (status !== 'granted') return;
    const contact = await DeviceContacts.presentContactPickerAsync();
    if (!contact) return;
    // Populate the form with the selected contact; user can Save to add
    populateFromDeviceContact(contact);
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
      title: title || undefined,
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
    <Screen
      scroll
      footer={
        <BottomActionBar style={{ paddingBottom: insets.bottom + 8, paddingTop: 6 }}>
          <View style={{ gap: 8 }}>
            <PrimaryButton label="Save" onPress={handleSave} />
            {!id && <PrimaryButton label="Import from Device" onPress={handleImport} />}
            {id && <PrimaryDanger label="Delete" onPress={handleDelete} />}
            <SecondaryNav label="BACK" onPress={() => router.back()} />
          </View>
        </BottomActionBar>
      }
    >
      <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        placeholderTextColor="#999"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        placeholderTextColor="#999"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      <View style={styles.phoneRow}>
        <TextInput
          style={[styles.input, styles.phoneInput]}
          placeholder="Phone"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={async () => {
            const s = await loadSettings();
            await placeCall(phone, s.callMethod);
          }}
          style={styles.callButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={phone ? `Call ${firstName} ${lastName}` : 'Call number'}
        >
          <MaterialIcons name="call" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.emailRow}>
        <TextInput
          style={[styles.input, styles.emailInput]}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${email}`)}
          style={styles.emailButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={email ? `Email ${firstName} ${lastName}` : 'Send email'}
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
        placeholderTextColor="#999"
        value={company}
        onChangeText={setCompany}
      />
      <TextInput
        style={styles.input}
        placeholder="Title (e.g., Software Engineer)"
        placeholderTextColor="#999"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="words"
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
            style={[styles.input, styles.tagTextInput]}
            placeholder="Add tag"
            placeholderTextColor="#999"
            value={tagInput}
            onChangeText={setTagInput}
            returnKeyType="done"
            onSubmitEditing={addTag}
          />
          <TouchableOpacity
            onPress={addTag}
            style={styles.addTagButton}
            accessibilityLabel="Add tag"
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addTagButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </Screen>
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
    backgroundColor: '#fff',
    color: '#111',
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
  tagTextInput: {
    flex: 1,
    marginBottom: 0,
    height: 40,
    paddingVertical: 8,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#03A9F4',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
  },
  addTagButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
});

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={footerStyles.primaryBtn} accessibilityRole="button">
      <Text style={footerStyles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

function PrimaryDanger({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[footerStyles.primaryBtn, { backgroundColor: '#EF4444' }]}
      accessibilityRole="button"
    >
      <Text style={footerStyles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryNav({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={footerStyles.secondaryNav} accessibilityRole="button">
      <Text style={footerStyles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

const footerStyles = StyleSheet.create({
  primaryBtn: {
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#0EA5E9',
    elevation: 1,
  },
  primaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondaryNav: {
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
});
