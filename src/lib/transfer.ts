import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import * as DeviceContacts from 'expo-contacts';
import { contactsToOutlookCsv, parseOutlookCsv } from './outlookCsv';
import { loadContacts, saveContacts } from './storage';
import { Contact } from './types';
import { v4 as uuid } from 'uuid';

export async function exportOutlookCsv(): Promise<string> {
  const contacts = await loadContacts();
  const csv = contactsToOutlookCsv(contacts);
  const fileName = `contacts-outlook.csv`;
  const target = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(target, csv, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = Platform.OS !== 'web' && (await Sharing.isAvailableAsync());
  if (canShare) {
    await Sharing.shareAsync(target, { mimeType: 'text/csv', dialogTitle: 'Export Contacts CSV' });
  }
  return `Exported ${contacts.length} contacts to CSV.`;
}

export async function importOutlookCsv(): Promise<{ added: number; updated: number; total: number; }> {
  const result: any = await DocumentPicker.getDocumentAsync({ type: 'text/*', copyToCacheDirectory: true });
  if (result.canceled) return { added: 0, updated: 0, total: 0 };
  const asset = result.assets ? result.assets[0] : result; // compat
  if (!asset?.uri) return { added: 0, updated: 0, total: 0 };
  const content = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  const imported = parseOutlookCsv(content);
  const existing = await loadContacts();

  let added = 0;
  let updated = 0;
  const byKey = new Map<string, number>();
  existing.forEach((c, idx) => {
    const keyEmail = c.email?.toLowerCase();
    if (keyEmail) byKey.set(`e:${keyEmail}`, idx);
    const keyPhone = c.phone?.replace(/\D/g, '');
    if (keyPhone) byKey.set(`p:${keyPhone}`, idx);
  });

  const merged: Contact[] = [...existing];
  for (const inc of imported) {
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
  return { added, updated, total: imported.length };
}

export async function importAllFromDeviceContacts(): Promise<{ added: number; updated: number; total: number; }> {
  const { status } = await DeviceContacts.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Enable Contacts permission to import.');
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
  return { added, updated, total: added + updated };
}

