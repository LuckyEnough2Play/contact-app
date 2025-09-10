import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Button, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import { loadSettings, saveSettings, AppSettings } from '../lib/settings';
import { exportOutlookCsv, importOutlookCsv, importAllFromDeviceContacts } from '../lib/transfer';
import { openNotificationAccessSettings } from '../native/CallEvents';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({ likelyPopupEnabled: true, headsUpEnabled: true, nameOrder: 'firstLast' });
  const [busy, setBusy] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  useEffect(() => {
    loadSettings().then(setSettings);
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Settings</Text>

        <Text style={styles.sectionTitle}>Contacts</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name order</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={[styles.choice, settings.nameOrder === 'firstLast' && styles.choiceSelected]}
              onPress={() => setOrder('firstLast')}
              accessibilityRole="radio"
              accessibilityState={{ checked: settings.nameOrder === 'firstLast' }}
              accessibilityLabel="Show first name then last name"
            >
              <MaterialIcons name={settings.nameOrder === 'firstLast' ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color="#000" />
              <Text style={styles.choiceText}>First Last</Text>
            </TouchableOpacity>
            <View style={{ width: 8 }} />
            <TouchableOpacity
              style={[styles.choice, settings.nameOrder === 'lastFirst' && styles.choiceSelected]}
              onPress={() => setOrder('lastFirst')}
              accessibilityRole="radio"
              accessibilityState={{ checked: settings.nameOrder === 'lastFirst' }}
              accessibilityLabel="Show last name then first name"
            >
              <MaterialIcons name={settings.nameOrder === 'lastFirst' ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color="#000" />
              <Text style={styles.choiceText}>Last, First</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Show in-app "Likely" popup</Text>
          <Switch value={settings.likelyPopupEnabled} onValueChange={() => toggle('likelyPopupEnabled')} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Heads-up when backgrounded</Text>
          <Switch value={settings.headsUpEnabled} onValueChange={() => toggle('headsUpEnabled')} />
        </View>

        <TouchableOpacity style={styles.button} onPress={openNotificationAccessSettings}>
          <MaterialIcons name="notifications" size={18} color="#fff" />
          <Text style={styles.buttonText}>Open Notification Access</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Transfer (Outlook)</Text>
        <TouchableOpacity style={styles.button} onPress={handleExport} disabled={busy}>
          <MaterialIcons name="file-upload" size={18} color="#fff" />
          <Text style={styles.buttonText}>{busy ? 'Exporting…' : 'Export to Outlook CSV'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleImportCsv} disabled={busy}>
          <MaterialIcons name="file-download" size={18} color="#fff" />
          <Text style={styles.buttonText}>{busy ? 'Importing…' : 'Import from Outlook CSV'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleImportDevice} disabled={busy}>
          <MaterialIcons name="contacts" size={18} color="#fff" />
          <Text style={styles.buttonText}>{busy ? 'Importing…' : 'Import All from Device Contacts'}</Text>
        </TouchableOpacity>

        {!!lastMessage && <Text style={styles.message}>{lastMessage}</Text>}

        <View style={{ height: 16 }} />
        <Button title="Back" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  label: { color: '#222', flex: 1, paddingRight: 12 },
  choice: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  choiceSelected: { backgroundColor: '#eee', borderColor: '#bbb' },
  choiceText: { marginLeft: 6 },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#03A9F4', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginVertical: 6 },
  buttonText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
  message: { marginTop: 12, color: '#333' },
});
