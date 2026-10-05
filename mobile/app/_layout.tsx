// SPDX-License-Identifier: AGPL-3.0-or-later

import '../global.css'
import { QueryClientProvider, focusManager } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ServerSync } from '../src/components/ServerSync'
import { SwitcherProvider } from '../src/components/Switcher'
import { UpdateSheet } from '../src/components/UpdateSheet'
import { installLogging } from '../src/log'
import { apiOf, cacheOf, tokenOf, useServers } from '../src/servers'
import { SessionProvider } from '../src/session'
import { ThemeProvider } from '../src/theme/ThemeProvider'

installLogging()

// What's on screen is fetched again (when stale) as the app comes back: it may have been away for hours.
focusManager.setEventListener((focused) => {
  const sub = AppState.addEventListener('change', (state) => focused(state === 'active'))
  return () => sub.remove()
})

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SwitcherProvider>
          <App />
        </SwitcherProvider>
        <UpdateSheet />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

/**
 * Everything on the active server. Moving to another one starts the app
 * over on it: a fresh navigation stack and that server's own cache.
 */
function App() {
  const { active, signedIn } = useServers()
  const token = active && signedIn.has(active.id) ? tokenOf(active.id) : null
  const router = useRouter()

  // A new stack starts where the URL was (say, signing in to the server just added), and losing the
  // token leaves whatever unguarded screens were under it: go where the app should be instead.
  const at = `${active?.id}:${!!token}`
  const shown = useRef(at)
  useEffect(() => {
    if (shown.current === at) return
    shown.current = at
    if (router.canDismiss()) router.dismissAll()
    router.replace(token ? '/' : '/sign-in')
  }, [at, token, router])

  const stack = (
    <Stack key={active?.id ?? 'none'} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="debug" />
      </Stack.Protected>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="connect" />
    </Stack>
  )
  if (!active) return stack
  return (
    <QueryClientProvider key={active.id} client={cacheOf(active.id)}>
      <SessionProvider server={active} api={apiOf(active)} token={token}>
        <ServerSync />
        {stack}
      </SessionProvider>
    </QueryClientProvider>
  )
}
