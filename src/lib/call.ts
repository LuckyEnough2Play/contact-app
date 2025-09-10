import { Alert, Linking, Platform } from 'react-native';
import { normalizeNumber } from './phone';

export type CallApp = 'system' | 'facetime' | 'skype';
export type CallMethod = 'ask' | CallApp;

export interface CallOption {
  key: CallApp;
  label: string;
}

const SYSTEM_OPTION: CallOption = { key: 'system', label: Platform.OS === 'ios' ? 'Phone' : 'Phone (system)' };
const FACETIME_OPTION: CallOption = { key: 'facetime', label: 'FaceTime' };
const SKYPE_OPTION: CallOption = { key: 'skype', label: 'Skype' };

function schemeFor(method: CallApp, numberRaw: string): string {
  const number = normalizeNumber(numberRaw);
  switch (method) {
    case 'system':
      return `tel:${number}`;
    case 'facetime':
      // iOS only; Android will fail canOpenURL and we fallback.
      return `facetime://${number}`;
    case 'skype':
      // Skype call scheme; will open Skype if installed.
      return `skype:${number}?call`;
  }
}

export async function getAvailableCallOptions(): Promise<CallOption[]> {
  const options: CallOption[] = [SYSTEM_OPTION];
  try {
    if (Platform.OS === 'ios') {
      // FaceTime is part of iOS; still guard via canOpenURL in case of restrictions.
      const canFT = await Linking.canOpenURL('facetime://');
      if (canFT) options.push(FACETIME_OPTION);
    }
  } catch {}
  try {
    const canSkype = await Linking.canOpenURL('skype:');
    if (canSkype) options.push(SKYPE_OPTION);
  } catch {}
  return options;
}

export async function placeCall(numberRaw: string, prefer: CallMethod): Promise<void> {
  const number = normalizeNumber(numberRaw);
  if (!number) return;

  if (prefer === 'ask') {
    return askAndCall(number);
  }

  const url = schemeFor(prefer, number);
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }
  } catch {}
  // Fallback: system tel
  try {
    await Linking.openURL(`tel:${number}`);
  } catch {}
}

async function askAndCall(number: string): Promise<void> {
  const opts = await getAvailableCallOptions();
  return new Promise((resolve) => {
    const buttons = opts.map((opt) => ({
      text: opt.label,
      onPress: async () => {
        try {
          const url = schemeFor(opt.key, number);
          const can = await Linking.canOpenURL(url);
          if (can) {
            await Linking.openURL(url);
          } else {
            await Linking.openURL(`tel:${number}`);
          }
        } catch {
          try { await Linking.openURL(`tel:${number}`); } catch {}
        }
        resolve();
      },
    }));
    buttons.push({ text: 'Cancel', style: 'cancel', onPress: () => resolve() } as any);
    Alert.alert('Call using', 'Choose an app to place the call', buttons, { cancelable: true });
  });
}

