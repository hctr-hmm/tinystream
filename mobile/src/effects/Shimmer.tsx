// SPDX-License-Identifier: AGPL-3.0-or-later
// Placeholders shaped like the content that's about to arrive (web's `bone`
// and Skeleton.tsx): a band of light sweeping across, again and again.

import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useTheme } from '../theme/ThemeProvider'
import { Squircle, type SquircleProps } from './Squircle'

/** The sweep across one placeholder, filling whatever it's in. */
export function Shimmer() {
  const { tokens } = useTheme()
  const reduced = useReducedMotion()
  const [width, setWidth] = useState(0)
  const t = useSharedValue(0)

  useEffect(() => {
    if (reduced) return
    t.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1)
  }, [reduced, t])

  // A gradient 2.5 times as wide as the box, moving from 150% to -50% (background-position).
  const start = useDerivedValue(() => {
    const band = width * 2.5
    const x = -(1.5 - 2 * t.value) * (band - width)
    return vec(x, 0)
  })
  const end = useDerivedValue(() => vec(start.value.x + width * 2.5, 0))

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={9999}>
          <LinearGradient start={start} end={end} colors={[tokens.raised, tokens.raised, tokens.panel, tokens.raised, tokens.raised]} positions={[0, 0.3, 0.5, 0.7, 1]} />
        </Rect>
      </Canvas>
    </View>
  )
}

export function Bone({ radius = 12, style, ...rest }: SquircleProps) {
  const { tokens } = useTheme()
  return (
    <Squircle radius={radius} style={[{ backgroundColor: tokens.raised }, style]} {...rest}>
      <Shimmer />
    </Squircle>
  )
}
