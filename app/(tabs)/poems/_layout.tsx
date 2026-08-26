import { Stack } from 'expo-router';

import { useTheme } from '../../../lib/theme';

export default function PoemsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        // Each screen renders its own ScreenHeader instead.
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[folder]" />
    </Stack>
  );
}
