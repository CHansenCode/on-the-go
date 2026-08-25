import { Stack } from 'expo-router';

export default function PoemsLayout() {
  return (
    <Stack screenOptions={{ headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="index" options={{ title: 'Poems' }} />
      <Stack.Screen name="[folder]" />
    </Stack>
  );
}
