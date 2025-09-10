import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

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

export const CallEventsEmitter = new NativeEventEmitter(
  (NativeModules as any).CallEvents || undefined
);

export function startListeners() {
  if (Platform.OS !== 'android') return;
  if (!CallEventsModule) throw new Error(LINKING_ERROR);
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

