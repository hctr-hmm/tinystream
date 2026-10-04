// SPDX-License-Identifier: AGPL-3.0-or-later

import '../global.css'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { installLogging } from '../src/log'
import { ThemeProvider } from '../src/theme/ThemeProvider'

installLogging()

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
