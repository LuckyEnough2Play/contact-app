import { NativeModules, Platform, NativeEventEmitter, DeviceEventEmitter } from 'react-native';

type CallEvent = {
  type: 'incoming' | 'ended';
  number?: string;
  source?: string; // 'telephony' | 'notification'
  appPackage?: string;
  rawText?: string;
};

const LINKING_ERROR =
  `The native module 'CallEvents' is not linked. Make sure you built the native Android project.`;

const CallEventsModule = (NativeModules as any).CallEvents || {
  // iOS/no-native fallback
  startListeners: () => {},
  stopListeners: () => {},
  openNotificationAccessSettings: () => {},
  postLikelyNotification: (_: string[]) => {},
};

// Use DeviceEventEmitter on Android since the native module emits via
// DeviceEventManagerModule.RCTDeviceEventEmitter. This avoids requiring a
// specific NativeModule instance and prevents crashes when it's undefined.
export const CallEventsEmitter: NativeEventEmitter =
  Platform.OS === 'android'
    ? (DeviceEventEmitter as unknown as NativeEventEmitter)
    : new NativeEventEmitter();

export function startListeners() {
  if (Platform.OS !== 'android') return;
  if (!(NativeModules as any).CallEvents) {
    // In dev or iOS, the module might not exist; avoid crashing.
    console.warn(LINKING_ERROR);
    return;
    }
  CallEventsModule.startListeners?.();
}

export function stopListeners() {
  if (Platform.OS !== 'android') return;
  CallEventsModule.stopListeners?.();
}

export function openNotificationAccessSettings() {
  if (Platform.OS !== 'android') return;
  CallEventsModule.openNotificationAccessSettings?.();
}

export function postLikelyNotification(names: string[]) {
  if (Platform.OS !== 'android') return;
  CallEventsModule.postLikelyNotification?.(names);
}

export type { CallEvent };
