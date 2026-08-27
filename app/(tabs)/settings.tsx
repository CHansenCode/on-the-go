import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import ScreenHeader from '../../components/ScreenHeader';
import { getSession, login, logout, type Session } from '../../lib/auth';
import { readSettings, writeSettings } from '../../lib/settings';
import { useTheme } from '../../lib/theme';

export default function SettingsScreen() {
  const { scheme, colors, toggleScheme } = useTheme();
  const [serverUrl, setServerUrl] = useState(() => readSettings().serverUrl ?? '');
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    setLoggingIn(true);
    try {
      const newSession = await login(username.trim(), password);
      setSession(newSession);
      setPassword('');
    } catch (err) {
      Alert.alert('Could not log in', (err as Error).message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setSession(null);
  };

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

        {session ? (
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Logged in as {session.displayName}</Text>
            <Pressable onPress={handleLogout}>
              <Text style={[styles.logoutText, { color: colors.accent }]}>Log out</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.fieldRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Username</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={username}
                onChangeText={setUsername}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={[styles.fieldRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Password</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
            </View>
            <Pressable
              style={[styles.loginButton, { backgroundColor: colors.accent }]}
              onPress={handleLogin}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={[styles.loginButtonText, { color: colors.onAccent }]}>Log in</Text>
              )}
            </Pressable>
          </>
        )}
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
  logoutText: { fontSize: 15, fontWeight: '700' },
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
  loginButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: { fontSize: 16, fontWeight: '700' },
});
