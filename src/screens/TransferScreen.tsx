import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import * as DeviceContacts from 'expo-contacts';

import { loadContacts, saveContacts } from '../lib/storage';
import { contactsToOutlookCsv, parseOutlookCsv } from '../lib/outlookCsv';
import { Contact } from '../lib/types';
import { v4 as uuid } from 'uuid';

export default function TransferScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  const exportCsv = async () => {
    try {
      setBusy(true);
      const contacts = await loadContacts();
      const csv = contactsToOutlookCsv(contacts);
      const fileName = `contacts-outlook.csv`;
      const target = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(target, csv, { encoding: FileSystem.EncodingType.UTF8 });
      const canShare = Platform.OS !== 'web' && (await Sharing.isAvailableAsync());
      if (canShare) {
        await Sharing.shareAsync(target, { mimeType: 'text/csv', dialogTitle: 'Export Contacts CSV' });
      } else {
        await Share.share({ message: csv });
      }
      setLastMessage(`Exported ${contacts.length} contacts to CSV.`);
    } catch (e: any) {
      console.warn('Export failed', e);
      Alert.alert('Export failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    try {
      setBusy(true);
      const result: any = await DocumentPicker.getDocumentAsync({ type: 'text/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets ? result.assets[0] : result; // compat across SDK versions
      if (!asset?.uri) return;
      const content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const imported = parseOutlookCsv(content);
      const existing = await loadContacts();

      let added = 0;
      let updated = 0;
      // Index existing by email/phone for simple merge strategy
      const byKey = new Map<string, number>();
      existing.forEach((c, idx) => {
        const keyEmail = c.email?.toLowerCase();
        if (keyEmail) byKey.set(`e:${keyEmail}`, idx);
        const keyPhone = c.phone?.replace(/\D/g, '');
        if (keyPhone) byKey.set(`p:${keyPhone}`, idx);
      });

      const merged: Contact[] = [...existing];
      for (const inc of imported) {
        // prefer email match, fallback to phone
        const maybeIdx = inc.email && byKey.has(`e:${inc.email.toLowerCase()}`)
          ? byKey.get(`e:${inc.email.toLowerCase()}`)
          : (inc.phone && byKey.get(`p:${inc.phone.replace(/\D/g, '')}`)) ?? -1;

        if (maybeIdx != null && maybeIdx >= 0) {
          const cur = merged[maybeIdx];
          const next: Contact = {
            ...cur,
            firstName: inc.firstName || cur.firstName,
            lastName: inc.lastName || cur.lastName,
            phone: inc.phone || cur.phone,
            email: inc.email || cur.email,
            birthday: inc.birthday || cur.birthday,
            company: inc.company || cur.company,
            tags: Array.from(new Set([...(cur.tags || []), ...(inc.tags || [])])),
          };
          merged[maybeIdx] = next;
          updated++;
        } else {
          merged.push({
            id: uuid(),
            firstName: inc.firstName || '',
            lastName: inc.lastName || '',
            phone: inc.phone || '',
            email: inc.email || undefined,
            birthday: inc.birthday || undefined,
            company: inc.company || undefined,
            tags: inc.tags || [],
          });
          added++;
        }
      }

      await saveContacts(merged);
      setLastMessage(`Imported ${imported.length} from CSV: ${added} added, ${updated} updated.`);
      Alert.alert('Import complete', `${added} added, ${updated} updated.`);
    } catch (e: any) {
      console.warn('Import failed', e);
      Alert.alert('Import failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const importAllFromDevice = async () => {
    try {
      setBusy(true);
      const { status } = await DeviceContacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable Contacts permission to import.');
        return;
      }
      const { data } = await DeviceContacts.getContactsAsync({
        fields: [
          DeviceContacts.Fields.Emails,
          DeviceContacts.Fields.PhoneNumbers,
          DeviceContacts.Fields.Birthday,
          DeviceContacts.Fields.Company,
        ],
        pageSize: 1000,
      });
      const existing = await loadContacts();
      const merged: Contact[] = [...existing];

      // Index existing by email/phone
      const byKey = new Map<string, number>();
      merged.forEach((c, idx) => {
        const keyEmail = c.email?.toLowerCase();
        if (keyEmail) byKey.set(`e:${keyEmail}`, idx);
        const keyPhone = c.phone?.replace(/\D/g, '');
        if (keyPhone) byKey.set(`p:${keyPhone}`, idx);
      });

      let added = 0;
      let updated = 0;
      for (const dc of data) {
        const firstName = dc.firstName || '';
        const lastName = dc.lastName || '';
        const phone = dc.phoneNumbers?.[0]?.number || '';
        const email = dc.emails?.[0]?.email || undefined;
        let birthday: string | undefined = undefined;
        if (dc.birthday && (dc.birthday.day || dc.birthday.month || dc.birthday.year)) {
          const year = dc.birthday.year ?? new Date().getFullYear();
          const month = (dc.birthday.month ?? 1) - 1;
          const day = dc.birthday.day ?? 1;
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) birthday = d.toISOString();
        }
        const company = dc.company || undefined;
        const key = email ? `e:${email.toLowerCase()}` : phone ? `p:${phone.replace(/\D/g, '')}` : undefined;
        if (key && byKey.has(key)) {
          const idx = byKey.get(key)!;
          const cur = merged[idx];
          merged[idx] = {
            ...cur,
            firstName: firstName || cur.firstName,
            lastName: lastName || cur.lastName,
            phone: phone || cur.phone,
            email: email || cur.email,
            birthday: birthday || cur.birthday,
            company: company || cur.company,
          };
          updated++;
        } else {
          merged.push({
            id: uuid(),
            firstName,
            lastName,
            phone,
            email,
            birthday,
            company,
            tags: [],
          });
          if (key) byKey.set(key, merged.length - 1);
          added++;
        }
      }

      await saveContacts(merged);
      setLastMessage(`Imported ${added + updated} from device: ${added} added, ${updated} updated.`);
      Alert.alert('Import complete', `${added} added, ${updated} updated.`);
    } catch (e: any) {
      console.warn('Device import failed', e);
      Alert.alert('Device import failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Transfer Contacts with Outlook</Text>
        <Text style={styles.subtitle}>
          Use CSV files compatible with Outlook to import or export your contacts.
        </Text>
        <View style={styles.actions}>
          <Button title={busy ? 'Exporting…' : 'Export to Outlook CSV'} onPress={exportCsv} disabled={busy} />
        </View>
        <View style={styles.actions}>
          <Button title={busy ? 'Importing…' : 'Import from Outlook CSV'} onPress={importCsv} disabled={busy} />
        </View>
        <View style={styles.actions}>
          <Button
            title={busy ? 'Importing…' : 'Import All from Device Contacts'}
            onPress={importAllFromDevice}
            disabled={busy}
          />
        </View>
        {!!lastMessage && <Text style={styles.message}>{lastMessage}</Text>}
        <View style={{ height: 16 }} />
        <Button title="Back" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#555', marginBottom: 16 },
  actions: { marginVertical: 8 },
  message: { marginTop: 12, color: '#333' },
});
