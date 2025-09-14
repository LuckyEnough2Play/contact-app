import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tagSelection:selected';

let selected: string[] | null = null;
const listeners = new Set<(tags: string[]) => void>();

export async function loadSelectedTags(): Promise<string[]> {
  if (selected) return selected.slice();
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        selected = arr.filter((t) => typeof t === 'string');
        return selected.slice();
      }
    }
  } catch {}
  selected = [];
  return [];
}

async function persist(next: string[]) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch {}
}

function emit() {
  if (!selected) return;
  const snapshot = selected.slice();
  listeners.forEach((cb) => cb(snapshot));
}

export function subscribeSelected(cb: (tags: string[]) => void): () => void {
  listeners.add(cb);
  // Fire immediately with current state if loaded
  if (selected) cb(selected.slice());
  return () => listeners.delete(cb);
}

export async function setSelectedTags(next: string[]): Promise<string[]> {
  selected = Array.from(new Set(next));
  await persist(selected);
  emit();
  return selected.slice();
}

export async function clearSelectedTags(): Promise<void> {
  await setSelectedTags([]);
}

export async function toggleTag(name: string): Promise<string[]> {
  const current = selected ?? (await loadSelectedTags());
  const has = current.includes(name);
  const next = has ? current.filter((t) => t !== name) : [...current, name];
  return setSelectedTags(next);
}

export function getSelectedTagsSync(): string[] {
  return selected ? selected.slice() : [];
}

