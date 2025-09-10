import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { exportOutlookCsv, importOutlookCsv, importAllFromDeviceContacts } from '../lib/transfer';

export default function TransferScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  const exportCsv = async () => {
    try {
      setBusy(true);
      const msg = await exportOutlookCsv();
      setLastMessage(msg);
    } catch (e: any) {
      console.warn('Export failed', e);
      Alert.alert('Export failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    try {
      setBusy(true);
      const res = await importOutlookCsv();
      setLastMessage(`Imported ${res.total} from CSV: ${res.added} added, ${res.updated} updated.`);
      Alert.alert('Import complete', `${res.added} added, ${res.updated} updated.`);
    } catch (e: any) {
      console.warn('Import failed', e);
      Alert.alert('Import failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const importAllFromDevice = async () => {
    try {
      setBusy(true);
      const res = await importAllFromDeviceContacts();
      setLastMessage(`Imported ${res.total} from device: ${res.added} added, ${res.updated} updated.`);
      Alert.alert('Import complete', `${res.added} added, ${res.updated} updated.`);
    } catch (e: any) {
      console.warn('Device import failed', e);
      Alert.alert('Device import failed', e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Transfer Contacts with Outlook</Text>
        <Text style={styles.subtitle}>
          Use CSV files compatible with Outlook to import or export your contacts.
        </Text>
        <View style={styles.actions}>
          <Button title={busy ? 'Exporting…' : 'Export to Outlook CSV'} onPress={exportCsv} disabled={busy} />
        </View>
        <View style={styles.actions}>
          <Button title={busy ? 'Importing…' : 'Import from Outlook CSV'} onPress={importCsv} disabled={busy} />
        </View>
        <View style={styles.actions}>
          <Button
            title={busy ? 'Importing…' : 'Import All from Device Contacts'}
            onPress={importAllFromDevice}
            disabled={busy}
          />
        </View>
        {!!lastMessage && <Text style={styles.message}>{lastMessage}</Text>}
        <View style={{ height: 16 }} />
        <Button title="Back" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#555', marginBottom: 16 },
  actions: { marginVertical: 8 },
  message: { marginTop: 12, color: '#333' },
});
