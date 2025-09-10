import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NameOrder } from './names';

const KEY = 'settings';

export interface AppSettings {
  likelyPopupEnabled: boolean;
  headsUpEnabled: boolean;
  nameOrder: NameOrder;
}

const defaultSettings: AppSettings = {
  likelyPopupEnabled: true,
  headsUpEnabled: true,
  nameOrder: 'firstLast',
};

let cached: AppSettings | null = null;
const listeners = new Set<(s: AppSettings) => void>();

export async function loadSettings(): Promise<AppSettings> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      cached = { ...defaultSettings, ...(JSON.parse(raw) as Partial<AppSettings>) };
      return cached;
    }
  } catch {}
  cached = { ...defaultSettings };
  return cached;
}

export async function saveSettings(next: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const merged = { ...current, ...next } as AppSettings;
  cached = merged;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  } catch {}
  listeners.forEach((cb) => cb(merged));
  return merged;
}

export function subscribeSettings(cb: (s: AppSettings) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
