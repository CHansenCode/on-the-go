import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme';

export default function StatusScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Status</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Nothing tracked here yet — tell Claude what you'd like this tab to
        show.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
