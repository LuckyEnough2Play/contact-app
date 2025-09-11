import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../components/Screen';
import BottomActionBar from '../components/BottomActionBar';
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
    <Screen
      scroll
      footer={
        <BottomActionBar>
          <View style={{ gap: 12 }}>
            <PrimaryButton label={busy ? 'Exporting…' : 'Export to Outlook CSV'} onPress={exportCsv} />
            <PrimaryButton label={busy ? 'Importing…' : 'Import from Outlook CSV'} onPress={importCsv} />
            <PrimaryButton label={busy ? 'Importing…' : 'Import All from Device Contacts'} onPress={importAllFromDevice} />
            <SecondaryNav label="BACK" onPress={() => router.back()} />
          </View>
        </BottomActionBar>
      }
    >
      <View style={styles.container}>
        <Text style={styles.title}>Transfer Contacts with Outlook</Text>
        <Text style={styles.subtitle}>
          Use CSV files compatible with Outlook to import or export your contacts.
        </Text>
        {!!lastMessage && <Text style={styles.message}>{lastMessage}</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#555', marginBottom: 16 },
  message: { marginTop: 12, color: '#333' },
});

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={buttonStyles.primaryBtn} accessibilityRole="button">
      <Text style={buttonStyles.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryNav({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={buttonStyles.secondaryNav} accessibilityRole="button">
      <Text style={buttonStyles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

const buttonStyles = StyleSheet.create({
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
  primaryText: { color: 'white', fontSize: 16, fontWeight: '700' },
  secondaryNav: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
});
