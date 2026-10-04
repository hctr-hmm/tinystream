// SPDX-License-Identifier: AGPL-3.0-or-later
// Floating material (web's `.material` and `.material-bar`). In the Glass
// style it's see-through and blurs what's behind it; otherwise it's solid.
// Android can only blur what's inside a BlurArea, so a screen wraps itself in
// a GlassScope, puts its content in a BlurArea and floats its glass beside
// it. Glass inside the BlurArea it would blur stays solid: blurring itself
// would recurse until the renderer's stack runs out.

import { BlurTargetView, BlurView } from 'expo-blur'
import { type ReactNode, type RefObject, createContext, useContext, useRef } from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { lift, withAlpha } from '../theme/materials'
import { Squircle, type SquircleProps } from './Squircle'

const Target = createContext<RefObject<View | null> | null>(null)
const Inside = createContext(false)

/** Where glass can blur the scope's BlurArea. */
export function GlassScope({ children }: { children?: ReactNode }) {
  const ref = useRef<View>(null)
  return <Target.Provider value={ref}>{children}</Target.Provider>
}

/** What the glass in the same GlassScope (but not in here) blurs. */
export function BlurArea({ children, ...rest }: ViewProps & { children?: ReactNode }) {
  const ref = useContext(Target)
  return (
    <Inside.Provider value>
      <BlurTargetView ref={ref ?? undefined} {...rest}>
        {children}
      </BlurTargetView>
    </Inside.Provider>
  )
}

export type GlassProps = SquircleProps & {
  /** A bar along the screen's edge (tab bar, top bar), tinted with the canvas rather than lifted. */
  bar?: boolean
}

export function Glass({ bar = false, radius = 16, edge = true, style, children, ...rest }: GlassProps) {
  const { style: name, tokens, material } = useTheme()
  const target = useContext(Target)
  const inside = useContext(Inside)
  const blur = material.glass && target != null && !inside
  const base = bar ? tokens.canvas : tokens.float
  // Same shapes as with the blur, just solid enough to read without it.
  const fill = !material.glass ? base : blur ? withAlpha(base, bar ? 0.62 : 0.7) : withAlpha(tokens.float, 0.96)

  const body = (
    <Squircle radius={bar ? 0 : radius} edge={edge && !bar} style={[{ backgroundColor: blur ? undefined : fill }, style]} {...rest}>
      {blur && (
        <>
          <BlurView
            blurTarget={target}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={bar ? 80 : 70}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
        </>
      )}
      {children}
    </Squircle>
  )
  const shadow = bar ? undefined : lift(name, tokens)
  return shadow ? <View style={{ boxShadow: shadow, borderRadius: Math.round(radius * material.corners.scale) }}>{body}</View> : body
}
