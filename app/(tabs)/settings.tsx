import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import ScreenHeader from '../../components/ScreenHeader';
import { readSettings, writeSettings } from '../../lib/settings';
import { useTheme } from '../../lib/theme';

export default function SettingsScreen() {
  const { scheme, colors, toggleScheme } = useTheme();
  const [userName, setUserName] = useState(() => readSettings().userName ?? '');
  const [serverUrl, setServerUrl] = useState(() => readSettings().serverUrl ?? '');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Settings" />
      <View style={styles.content}>
        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Dark mode</Text>
          <Switch
            value={scheme === 'dark'}
            onValueChange={toggleScheme}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SHARING</Text>

        <View style={[styles.fieldRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Your name</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.text }]}
            value={userName}
            onChangeText={setUserName}
            onEndEditing={() => writeSettings({ userName: userName.trim() })}
            placeholder="e.g. Alex"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={[styles.fieldRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Server URL</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.text }]}
            value={serverUrl}
            onChangeText={setServerUrl}
            onEndEditing={() => writeSettings({ serverUrl: serverUrl.trim() })}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { fontSize: 16, fontWeight: '600' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
  },
  fieldRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  fieldInput: { fontSize: 16, paddingVertical: 4 },
});
