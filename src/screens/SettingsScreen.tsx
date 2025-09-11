import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import Screen from '../components/Screen';
import BottomActionBar from '../components/BottomActionBar';
import { loadSettings, saveSettings, AppSettings } from '../lib/settings';
import type { CallMethod } from '../lib/call';
import { exportOutlookCsv, importOutlookCsv, importAllFromDeviceContacts } from '../lib/transfer';
import { openNotificationAccessSettings } from '../native/CallEvents';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({
    likelyPopupEnabled: true,
    headsUpEnabled: true,
    nameOrder: 'firstLast',
    callMethod: 'ask',
  });
  const [busy, setBusy] = useState(false);
  const [lastMessage, setLastMessage] = useState('');
  const [availableCallApps, setAvailableCallApps] = useState<{ facetime: boolean; skype: boolean }>(
    { facetime: false, skype: false }
  );

  useEffect(() => {
    loadSettings().then(setSettings);
    (async () => {
      let facetime = false;
      let skype = false;
      try {
        if (Platform.OS === 'ios') facetime = await Linking.canOpenURL('facetime://');
      } catch {}
      try {
        skype = await Linking.canOpenURL('skype:');
      } catch {}
      setAvailableCallApps({ facetime, skype });
    })();
  }, []);

  const toggle = async (key: keyof AppSettings) => {
    const next = await saveSettings({ [key]: !settings[key] } as Partial<AppSettings>);
    setSettings(next);
  };

  const setOrder = async (order: AppSettings['nameOrder']) => {
    if (settings.nameOrder === order) return;
    const next = await saveSettings({ nameOrder: order });
    setSettings(next);
  };

  const setCallMethod = async (method: CallMethod) => {
    if (settings.callMethod === method) return;
    const next = await saveSettings({ callMethod: method });
    setSettings(next);
  };

  const handleExport = async () => {
    try {
      setBusy(true);
      const msg = await exportOutlookCsv();
      setLastMessage(msg);
      Alert.alert('Export complete', msg);
    } catch (e: any) {
      Alert.alert('Export failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleImportCsv = async () => {
    try {
      setBusy(true);
      const res = await importOutlookCsv();
      const msg = `Imported ${res.total} from CSV: ${res.added} added, ${res.updated} updated.`;
      setLastMessage(msg);
      Alert.alert('Import complete', msg);
    } catch (e: any) {
      Alert.alert('Import failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleImportDevice = async () => {
    try {
      setBusy(true);
      const res = await importAllFromDeviceContacts();
      const msg = `Imported ${res.total} from device: ${res.added} added, ${res.updated} updated.`;
      setLastMessage(msg);
      Alert.alert('Import complete', msg);
    } catch (e: any) {
      Alert.alert('Device import failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <BottomActionBar>
          <View style={{ gap: 12 }}>
            <PrimaryButton label="Open Notification Access" onPress={openNotificationAccessSettings} />
            <PrimaryButton label={busy ? 'Exporting…' : 'Export to Outlook CSV'} onPress={handleExport} />
            <PrimaryButton label={busy ? 'Importing…' : 'Import from Outlook CSV'} onPress={handleImportCsv} />
            <PrimaryButton label={busy ? 'Importing…' : 'Import All from Device Contacts'} onPress={handleImportDevice} />
            <SecondaryNav label="BACK" onPress={() => router.back()} />
          </View>
        </BottomActionBar>
      }
    >
      <View style={{ gap: 24 }}>
        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Name order</Text>
          <View style={styles.rowBetween}>
            <Choice
              selected={settings.nameOrder === 'firstLast'}
              label="First Last"
              onPress={() => setOrder('firstLast')}
            />
            <Choice
              selected={settings.nameOrder === 'lastFirst'}
              label="Last, First"
              onPress={() => setOrder('lastFirst')}
            />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Default calling method</Text>
          <View style={styles.rowBetween}>
            <Choice
              selected={settings.callMethod === 'ask'}
              label="Ask every time"
              onPress={() => setCallMethod('ask')}
            />
            <Choice
              selected={settings.callMethod === 'system'}
              label="Phone (system)"
              onPress={() => setCallMethod('system')}
            />
          </View>
          <View style={styles.rowBetween}>
            {Platform.OS === 'ios' && availableCallApps.facetime ? (
              <Choice
                selected={settings.callMethod === 'facetime'}
                label="FaceTime"
                onPress={() => setCallMethod('facetime')}
              />
            ) : null}
            {availableCallApps.skype ? (
              <Choice
                selected={settings.callMethod === 'skype'}
                label="Skype"
                onPress={() => setCallMethod('skype')}
              />
            ) : null}
          </View>
        </View>

        <Row label='Show in-app "Likely" popup'>
          <Switch value={settings.likelyPopupEnabled} onValueChange={() => toggle('likelyPopupEnabled')} />
        </Row>
        <Row label="Heads-up when backgrounded">
          <Switch value={settings.headsUpEnabled} onValueChange={() => toggle('headsUpEnabled')} />
        </Row>

        {!!lastMessage && <Text style={styles.message}>{lastMessage}</Text>}
      </View>
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View>{children}</View>
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.choice, selected && styles.choiceSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.radioOuter}>{selected ? <View style={styles.radioInner} /> : null}</View>
      <Text style={styles.choiceText}>{label}</Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.primaryBtn} accessibilityRole="button">
      <Text style={styles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryNav({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.secondaryNav} accessibilityRole="button">
      <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    paddingRight: 12,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minHeight: 48,
    flex: 1,
  },
  choiceSelected: { backgroundColor: '#F1F5F9', borderColor: '#94A3B8' },
  choiceText: { marginLeft: 8, color: '#0F172A' },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0F172A',
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0EA5E9',
    elevation: 1,
  },
  primaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryNav: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  message: { marginTop: 8, color: '#334155' },
});

