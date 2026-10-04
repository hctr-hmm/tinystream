// SPDX-License-Identifier: AGPL-3.0-or-later

import { requireNativeView } from 'expo'
import type { ViewProps } from 'react-native'

export type SquircleViewProps = ViewProps & {
  /** SVG path data in dp, from @tinystream/shared/squircle. */
  path: string | null
  /** For before the box is measured: a plain rounded rectangle. */
  radius: number
}

/** A view clipped (children and all) to a squircle, by the system's outline clipping. */
export const SquircleView = requireNativeView<SquircleViewProps>('TinystreamSquircle')
