import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { migrateIfNeeded } from '../lib/storage';

export default function BootGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        await migrateIfNeeded();
      } catch (e) {
        console.error('BootGate migrate error', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <>{children}</>;
}

