// SPDX-License-Identifier: AGPL-3.0-or-later

import { useId, useLayoutEffect, useRef } from 'react'

/** How many samples a series keeps, and so how many a sparkline spans. */
const SAMPLES = 60

/**
 * Recent samples of a number, kept outside React so they survive re-renders
 * and navigation. `stamp` (e.g. a query's dataUpdatedAt) makes recording
 * idempotent, so it's safe to call while rendering.
 */
const series = new Map<string, { stamp: number; values: number[] }>()

export function record(key: string, value: number, stamp: number) {
  let s = series.get(key)
  if (!s) series.set(key, (s = { stamp: -1, values: [] }))
  if (s.stamp !== stamp) {
    s.stamp = stamp
    s.values = [...s.values, value].slice(-SAMPLES)
  }
  return s.values
}

const W = 100
const H = 30
const STEP = W / (SAMPLES - 2)

/**
 * The curve through `values`, `t` of the way through scrolling the newest one
 * in from beyond the right edge. A short series is padded with its first
 * value so it always spans the width.
 */
function shape(values: number[], max: number, t: number) {
  const padded = [...Array<number>(SAMPLES - values.length).fill(values[0] ?? 0), ...values]
  const left = W + STEP * (1 - t) - STEP * (padded.length - 1)
  const pts = padded.map((v, i) => [left + i * STEP, H - (Math.min(v, max) / max) * (H - 2) - 1] as const)
  let line = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    line += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`
  }
  return { line, area: `${line} L${pts[pts.length - 1][0]},${H} L${left},${H} Z` }
}

const peak = (values: number[]) => Math.max(1, ...values)

/**
 * A soft area chart of recent values, scaled to its own peak. Each new sample
 * glides in over `interval` (how often one arrives) and the scale eases to a
 * new peak, so polling doesn't make it jump.
 */
export function Sparkline({
  values,
  interval,
  className = '',
  color = 'oklch(82.8% 0.111 230.318)',
  max: fixedMax,
  fade = false,
}: {
  values: number[]
  interval: number
  className?: string
  color?: string
  max?: number
  fade?: boolean
}) {
  const id = useId()
  const line = useRef<SVGPathElement>(null)
  const area = useRef<SVGPathElement>(null)
  const anim = useRef({ values, since: -Infinity, max: fixedMax ?? peak(values), frame: 0 })
  // A flat line along the bottom reads as a border, not "nothing happening".
  const quiet = values.every((v) => v <= 0)

  useLayoutEffect(() => {
    const a = anim.current
    if (a.values !== values) {
      a.values = values
      a.since = performance.now()
    }
    const target = fixedMax ?? peak(values)
    let last = performance.now()
    const draw = (now: number) => {
      a.max += (target - a.max) * (1 - Math.exp(-(now - last) / 300))
      last = now
      const t = Math.min(1, (now - a.since) / interval)
      const d = shape(values, a.max, t)
      line.current?.setAttribute('d', d.line)
      area.current?.setAttribute('d', d.area)
      if (t < 1 || Math.abs(target - a.max) > target / 1000) a.frame = requestAnimationFrame(draw)
    }
    draw(last)
    return () => cancelAnimationFrame(a.frame)
  }, [values, fixedMax, interval])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`transition-opacity duration-500 ${className}`}
      style={{
        opacity: quiet ? 0 : undefined,
        maskImage: fade ? 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)' : undefined,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path ref={area} fill={`url(#${id})`} />
      <path ref={line} fill="none" stroke={color} strokeWidth="1.25" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
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
