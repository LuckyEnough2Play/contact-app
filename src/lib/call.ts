import { Alert, Linking, Platform } from 'react-native';
import { normalizeNumber } from './phone';

export type CallApp = 'system' | 'facetime' | 'skype' | 'whatsapp' | 'telegram' | 'viber';
export type CallMethod = 'ask' | CallApp;

export interface CallOption {
  key: CallApp;
  label: string;
}

const SYSTEM_OPTION: CallOption = { key: 'system', label: Platform.OS === 'ios' ? 'Phone' : 'Phone (system)' };

// Supported third-party calling/chat apps offered in the in-app chooser.

function buildUrl(method: CallApp, numberRaw: string): string {
  const number = normalizeNumber(numberRaw);
  switch (method) {
    case 'system':
      return `tel:${number}`;
    case 'facetime':
      // iOS only; Android will fail canOpenURL and we fallback.
      return `facetime://${number}`;
    case 'skype':
      // Skype call scheme; opens Skype if installed.
      return `skype:${number}?call`;
    case 'whatsapp':
      // WhatsApp chat with number (user can tap call). Requires E.164 without spaces.
      return `whatsapp://send?phone=${encodeURIComponent(number)}`;
    case 'telegram':
      // Telegram: open chat by phone (may not work if number not on Telegram)
      return `tg://msg?to=${encodeURIComponent(number.replace(/^\+/, ''))}`;
    case 'viber':
      // Viber: open contact by number (user can tap call)
      return `viber://contact?number=${encodeURIComponent(number.replace(/^\+/, ''))}`;
  }
}

export async function getAvailableCallOptions(): Promise<CallOption[]> {
  const options: CallOption[] = [SYSTEM_OPTION];
  // Check known third-party apps. Some are platform-specific.
  // On iOS, canOpenURL requires Info.plist LSApplicationQueriesSchemes in a real build.
  const checks: Array<{ opt: CallOption; probe: string; allowOn: 'ios' | 'android' | 'both' }> = [
    { opt: { key: 'facetime', label: 'FaceTime' }, probe: 'facetime://', allowOn: 'ios' },
    { opt: { key: 'skype', label: 'Skype' }, probe: 'skype:', allowOn: 'both' },
    { opt: { key: 'whatsapp', label: 'WhatsApp' }, probe: 'whatsapp://', allowOn: 'both' },
    { opt: { key: 'telegram', label: 'Telegram' }, probe: 'tg://', allowOn: 'both' },
    { opt: { key: 'viber', label: 'Viber' }, probe: 'viber://', allowOn: 'both' },
  ];
  for (const { opt, probe, allowOn } of checks) {
    if (allowOn !== 'both' && Platform.OS !== allowOn) continue;
    try {
      const can = await Linking.canOpenURL(probe);
      if (can) options.push(opt);
    } catch {}
  }
  return options;
}

export async function placeCall(numberRaw: string, prefer: CallMethod): Promise<void> {
  const number = normalizeNumber(numberRaw);
  if (!number) return;

  if (prefer === 'ask') {
    return askAndCall(number);
  }

  const url = buildUrl(prefer, number);
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
          const url = buildUrl(opt.key, number);
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
