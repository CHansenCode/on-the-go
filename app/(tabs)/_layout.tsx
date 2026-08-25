import { Tabs } from 'expo-router';
import type { ReactElement } from 'react';
import type { ColorValue } from 'react-native';

import { ChartIcon, MicIcon, SchoolIcon, SettingsIcon, type IconProps } from '../../components/icons';
import { useTheme } from '../../lib/theme';

// React Navigation already hands tabBarIcon the right active/inactive
// tint as `color` — same glyph throughout, just recolored, no separate
// filled/outline variants to keep in sync.
function icon(Icon: (props: IconProps) => ReactElement) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Icon size={size} color={color as string} />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Learning', tabBarIcon: icon(SchoolIcon) }} />
      <Tabs.Screen
        name="poems"
        options={{ title: 'Poems', headerShown: false, tabBarIcon: icon(MicIcon) }}
      />
      <Tabs.Screen name="status" options={{ title: 'Status', tabBarIcon: icon(ChartIcon) }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon(SettingsIcon) }} />
    </Tabs>
  );
}
