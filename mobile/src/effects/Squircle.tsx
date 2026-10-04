// SPDX-License-Identifier: AGPL-3.0-or-later

import { Canvas, DashPathEffect, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia'
import { squirclePath } from '@tinystream/shared/squircle'
import { cssInterop } from 'nativewind'
import { type ReactNode, useMemo, useState } from 'react'
import { type LayoutChangeEvent, StyleSheet, type ViewProps } from 'react-native'
import { SquircleView } from '../../modules/squircle'
import { useTheme } from '../theme/ThemeProvider'
import { withAlpha } from '../theme/materials'

cssInterop(SquircleView, { className: 'style' })

export type SquircleProps = ViewProps & {
  className?: string
  /** At Layered's scale; the component style makes it bigger or smaller. */
  radius?: number
  smoothing?: number
  /** Draw a hairline edge that's brighter at the top, like light from above. */
  edge?: boolean
  /** Draw a dashed hairline along the curve, for placeholders. */
  dashed?: boolean
  children?: ReactNode
}

/**
 * A box with continuous-curvature corners, clipped (children and all) to a
 * squircle, like web's Squircle. Measures itself to build the path.
 */
export function Squircle({ radius: baseRadius = 12, smoothing, edge = false, dashed = false, onLayout, children, ...rest }: SquircleProps) {
  const { material, tokens } = useTheme()
  const [size, setSize] = useState<[number, number] | null>(null)
  const radius = Math.round(baseRadius * material.corners.scale)
  const d = size ? squirclePath(size[0], size[1], radius, smoothing ?? material.corners.smoothing) : null
  const path = useMemo(() => (d ? Skia.Path.MakeFromSVGString(d) : null), [d])

  const measure = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setSize((s) => (s && s[0] === width && s[1] === height ? s : [width, height]))
    onLayout?.(e)
  }

  return (
    <SquircleView path={d} radius={radius} onLayout={measure} {...rest}>
      {children}
      {(edge || dashed) && size && path && (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Twice the width, half of it clipped away: a crisp 1dp inner edge. */}
          {dashed ? (
            <Path path={path} style="stroke" strokeWidth={2} color={tokens['line-strong']}>
              <DashPathEffect intervals={[4, 4]} />
            </Path>
          ) : (
            <Path path={path} style="stroke" strokeWidth={2}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, size[1])}
                positions={[0, 0.35, 1]}
                colors={material.edge.map((a) => withAlpha(tokens.glow, a))}
              />
            </Path>
          )}
        </Canvas>
      )}
    </SquircleView>
  )
}
