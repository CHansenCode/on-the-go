import { StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../../components/ScreenHeader';
import { useTheme } from '../../lib/theme';

export default function StatusScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Status" />
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Nothing tracked here yet — tell Claude what you'd like this tab to
          show.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
