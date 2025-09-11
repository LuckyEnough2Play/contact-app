import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, PermissionsAndroid, Platform } from 'react-native';
import LikelyPopup from './LikelyPopup';
import { CallEventsEmitter, postLikelyNotification, startListeners } from '../native/CallEvents';
import { loadContactsSafe } from '../lib/storage';
import { Contact } from '../lib/types';
import { numbersMatch } from '../lib/phone';
import { AppSettings, loadSettings, subscribeSettings } from '../lib/settings';

export default function LikelyProvider({ children }: { children: React.ReactNode }) {
  const [names, setNames] = useState<string[]>([]);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const settingsRef = useRef<AppSettings>({ likelyPopupEnabled: true, headsUpEnabled: true, nameOrder: 'firstLast', callMethod: 'ask' });

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Start native listeners without prompting for sensitive runtime permissions here.
      // Notification listener access must be granted in system settings; we open settings on demand elsewhere.
      startListeners();
    }

    const sub = CallEventsEmitter.addListener('callEvent', async (event: any) => {
      if (event?.type === 'incoming' && event?.number) {
        if (!settingsRef.current.likelyPopupEnabled && !settingsRef.current.headsUpEnabled) {
          return;
        }
        const contacts = await loadContactsSafe();
        const matched = contacts
          .filter((c: Contact) => numbersMatch(c.phone, event.number))
          .sort((a: Contact, b: Contact) => (a.firstName || '').localeCompare(b.firstName || ''))
          .map((c: Contact) => `${c.firstName} ${c.lastName}`.trim());

        if (matched.length > 0) {
          // If app is backgrounded, post a heads-up notification too
          if (appState.current !== 'active' && settingsRef.current.headsUpEnabled) {
            postLikelyNotification(matched);
          }
          if (settingsRef.current.likelyPopupEnabled) setNames(matched);
          if (hideTimer.current) clearTimeout(hideTimer.current);
          if (settingsRef.current.likelyPopupEnabled) {
            hideTimer.current = setTimeout(() => setNames([]), 8000);
          }
        }
      } else if (event?.type === 'ended') {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setNames([]);
      }
    });

    const appSub = AppState.addEventListener('change', (state) => {
      appState.current = state;
    });

    // Load + subscribe to settings
    loadSettings().then((s) => (settingsRef.current = s));
    const unsub = subscribeSettings((s) => (settingsRef.current = s));

    return () => {
      sub.remove();
      appSub.remove();
      unsub();
    };
  }, []);

  return (
    <>
      {children}
      <LikelyPopup names={names} />
    </>
  );
}
