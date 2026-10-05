// SPDX-License-Identifier: AGPL-3.0-or-later

import { Tabs } from 'expo-router'
import { House, Library, type LucideIcon, Music, Search, UserRound } from 'lucide-react-native'
import type { ColorValue } from 'react-native'
import { haptic } from '../../modules/haptics'
import { useSwitcher } from '../../src/components/Switcher'
import { useTheme } from '../../src/theme/ThemeProvider'

const icon =
  (Icon: LucideIcon) =>
  ({ color, size }: { color: ColorValue; size: number }) => <Icon color={color as string} size={size - 2} />

export default function TabsLayout() {
  const { tokens } = useTheme()
  const switcher = useSwitcher()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: tokens.ink,
        tabBarInactiveTintColor: tokens['ink-3'],
        tabBarStyle: { backgroundColor: tokens.canvas, borderTopColor: tokens.line },
        tabBarLabelStyle: { fontFamily: 'Geist', fontWeight: '500' },
      }}
      screenListeners={{ tabPress: () => haptic('tab') }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon(House) }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: icon(Search) }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: icon(Library) }} />
      <Tabs.Screen name="music" options={{ title: 'Music', tabBarIcon: icon(Music) }} />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: icon(UserRound) }}
        listeners={{
          tabLongPress: () => {
            haptic('longPressOpen')
            switcher.open()
          },
        }}
      />
    </Tabs>
  )
}
