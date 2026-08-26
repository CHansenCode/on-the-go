import { StyleSheet, Switch, Text, View } from 'react-native';

import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../lib/theme';

export default function SettingsScreen() {
  const { scheme, colors, toggleScheme } = useTheme();

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: 16 },
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
});
