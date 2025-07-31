import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from './types';

const STORAGE_KEY = 'contacts';

export async function loadContacts(): Promise<Contact[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as Contact[];
    }
  } catch (e) {
    console.warn('Failed to load contacts', e);
  }
  return [];
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.warn('Failed to save contacts', e);
  }
}
