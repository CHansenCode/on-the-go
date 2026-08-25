import { Stack } from 'expo-router';

import { useTheme } from '../../../lib/theme';

export default function PoemsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Poems' }} />
      <Stack.Screen name="[folder]" />
    </Stack>
  );
}
