import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../lib/theme';
import { BackIcon } from './icons';

type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
};

// The one place every page's title bar comes from — replaces React
// Navigation's built-in header, which was configured separately for the
// tabs and for the Poems stack and had drifted out of sync (different
// sizes/weights between screens).
export default function ScreenHeader({ title, onBack, right }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingTop: insets.top + 12 },
      ]}
    >
      <View style={styles.side}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <BackIcon size={22} color={colors.text} />
          </Pressable>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.side, styles.rightSide]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  side: {
    width: 44,
    justifyContent: 'center',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
