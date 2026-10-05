// SPDX-License-Identifier: AGPL-3.0-or-later

import { useIsFocused } from 'expo-router'
import type { ReactNode } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurArea } from '../effects/Glass'
import { useTabBarSpace } from './TabBar'

/** A tab's page: a large title, with room for something at its right (Home's server chip). */
export function Screen({ title, right, children }: { title: string; right?: ReactNode; children?: ReactNode }) {
  const insets = useSafeAreaInsets()
  const bar = useTabBarSpace()
  return (
    <BlurArea active={useIsFocused()} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: bar + 32, paddingHorizontal: 20, gap: 20 }}>
        <View className="min-h-11 flex-row items-center justify-between gap-3">
          <Text className="font-sans text-3xl font-semibold tracking-tight text-ink">{title}</Text>
          {right}
        </View>
        {children}
      </ScrollView>
    </BlurArea>
  )
}
