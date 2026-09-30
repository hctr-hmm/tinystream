// SPDX-License-Identifier: AGPL-3.0-or-later

import { useId } from 'react'

/**
 * Recent samples of a number, kept outside React so they survive re-renders
 * and navigation. `stamp` (e.g. a query's dataUpdatedAt) makes recording
 * idempotent, so it's safe to call while rendering.
 */
const series = new Map<string, { stamp: number; values: number[] }>()

export function record(key: string, value: number, stamp: number, max = 60) {
  let s = series.get(key)
  if (!s) series.set(key, (s = { stamp: -1, values: [] }))
  if (s.stamp !== stamp) {
    s.stamp = stamp
    s.values = [...s.values, value].slice(-max)
  }
  return s.values
}

/** A soft area chart of recent values, scaled to its own peak. */
export function Sparkline({
  values,
  className = '',
  color = 'oklch(82.8% 0.111 230.318)',
  max: fixedMax,
}: {
  values: number[]
  className?: string
  color?: string
  max?: number
}) {
  const id = useId()
  // A flat line along the bottom reads as a border, not "nothing happening".
  if (values.length < 2 || values.every((v) => v <= 0)) return <div className={className} />
  const max = fixedMax ?? Math.max(1, ...values)
  const w = 100
  const h = 30
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => [i * step, h - (Math.min(v, max) / max) * (h - 2) - 1] as const)
  // A gentle curve through the points.
  let line = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    line += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.25" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

/** The torrent's piece map: each cell lights up as that stretch arrives. */
export function PieceMap({ pieces, className = '' }: { pieces: number[]; className?: string }) {
  if (!pieces.length) return null
  return (
    <div className={`flex h-1.5 gap-px overflow-hidden rounded-[3px] ${className}`} aria-hidden>
      {pieces.map((p, i) => (
        <div
          key={i}
          className="min-w-0 flex-1 bg-sky-300 transition-opacity duration-700"
          style={{ opacity: p >= 255 ? 0.9 : 0.1 + (p / 255) * 0.55 }}
        />
      ))}
    </div>
  )
}
