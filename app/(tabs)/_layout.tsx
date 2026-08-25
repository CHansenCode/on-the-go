import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#2f6fed',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Learning' }} />
      <Tabs.Screen name="poems" options={{ title: 'Poems', headerShown: false }} />
      <Tabs.Screen name="status" options={{ title: 'Status' }} />
    </Tabs>
  );
}
