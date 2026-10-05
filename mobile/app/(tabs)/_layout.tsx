// SPDX-License-Identifier: AGPL-3.0-or-later

import { House, Library, type LucideIcon, Music, Search, UserRound } from 'lucide-react-native'
import { haptic } from '../../modules/haptics'
import { useSwitcher } from '../../src/components/Switcher'
import { Tabs } from '../../src/components/Tabs'
import { GlassScope } from '../../src/effects/Glass'

const icon =
  (Icon: LucideIcon) =>
  ({ color, size }: { color: string; size: number }) => <Icon color={color} size={size - 2} />

export default function TabsLayout() {
  const switcher = useSwitcher()
  return (
    <GlassScope>
      <Tabs screenListeners={{ tabPress: () => haptic('tab') }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon(House) }} />
        <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: icon(Search) }} />
        <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: icon(Library) }} />
        <Tabs.Screen name="music" options={{ title: 'Music', tabBarIcon: icon(Music) }} />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: icon(UserRound),
            tabBarOnLongPress: () => {
              haptic('longPressOpen')
              switcher.open()
            },
          }}
        />
      </Tabs>
    </GlassScope>
  )
}
