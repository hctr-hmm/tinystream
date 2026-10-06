// SPDX-License-Identifier: AGPL-3.0-or-later

import { Stack } from 'expo-router'

/** A tab's own stack of screens, which slide in over each other and go back with the system's gesture. */
export function TabStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'default' }} />
}
