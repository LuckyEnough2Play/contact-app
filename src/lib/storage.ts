import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact as ZContact, ContactListSchema, ContactSchema, coerceLegacyContact } from '../types/contact';

// Keys
const KEY_CONTACTS = 'bc:contacts';
const KEY_SCHEMA = 'bc:schemaVersion';
const KEY_QUAR_PREFIX = 'bc:quarantine:'; // followed by timestamp
const LEGACY_KEY_CONTACTS = 'contacts';

export type Contact = ZContact; // re-export shape for consumers

export const SCHEMA_VERSION = 2;
// v0: no version key, tags might be comma string, missing fields
// v1: started adding fields, still inconsistent tags and ids
// v2: canonical ContactSchema above

export async function getSchemaVersion(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(KEY_SCHEMA);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export async function setSchemaVersion(v: number): Promise<void> {
  await AsyncStorage.setItem(KEY_SCHEMA, String(v));
}

export async function loadRawContacts(): Promise<any[] | null> {
  // Try new key first
  let s = await AsyncStorage.getItem(KEY_CONTACTS);
  // Fallback to legacy key
  if (!s) s = await AsyncStorage.getItem(LEGACY_KEY_CONTACTS);
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.contacts)) return parsed.contacts; // legacy wrapper
    return [];
  } catch (e) {
    try {
      const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      await AsyncStorage.setItem(KEY_QUAR_PREFIX + ts, s);
    } catch {}
    await AsyncStorage.removeItem(KEY_CONTACTS);
    await AsyncStorage.removeItem(LEGACY_KEY_CONTACTS);
    return null;
  }
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  await AsyncStorage.setItem(KEY_CONTACTS, JSON.stringify(contacts));
}

export async function migrateIfNeeded(): Promise<void> {
  const current = await getSchemaVersion();
  if (current >= SCHEMA_VERSION) return;

  let raw = await loadRawContacts();
  if (!raw) {
    await setSchemaVersion(SCHEMA_VERSION);
    return;
  }

  const coerced = raw.map(coerceLegacyContact);

  const valid: Contact[] = [];
  const invalid: any[] = [];
  for (const r of coerced) {
    const parsed = ContactSchema.safeParse(r);
    if (parsed.success) valid.push(parsed.data);
    else invalid.push({ r, issues: parsed.error.issues });
  }

  if (invalid.length) {
    try {
      const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
      await AsyncStorage.setItem(KEY_QUAR_PREFIX + ts + ':invalid', JSON.stringify(invalid));
    } catch {}
  }

  await saveContacts(valid);
  await setSchemaVersion(SCHEMA_VERSION);
}

export async function loadContactsSafe(): Promise<Contact[]> {
  await migrateIfNeeded();
  const raw = await loadRawContacts();
  if (!raw) return [];
  const coerced = raw.map(coerceLegacyContact);
  const parsed = ContactListSchema.safeParse(coerced);
  return parsed.success ? (parsed.data as Contact[]) : [];
}

// Backwards-compat: existing call sites may import loadContacts
export async function loadContacts(): Promise<Contact[]> {
  return loadContactsSafe();
}
