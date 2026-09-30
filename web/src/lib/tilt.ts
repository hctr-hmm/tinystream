// SPDX-License-Identifier: AGPL-3.0-or-later

import { type PointerEvent, useRef } from 'react'

/**
 * Leans an element toward a mouse pointer and moves its
 * glint (a `.glare` inside it) to where the light would catch. Spread the
 * handlers onto whatever receives the pointer and put `ref` on the `.tilt`.
 * Wide cards want a smaller `max` (in degrees): their edges travel further.
 */
export function useTilt<T extends HTMLElement>(max = 7) {
  const ref = useRef<T>(null)
  const frame = useRef(0)
  const onPointerMove = (e: PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const { clientX, clientY } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect()
      const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
      const y = Math.min(1, Math.max(0, (clientY - r.top) / r.height))
      el.dataset.tilting = ''
      el.style.setProperty('--ry', `${(x - 0.5) * 2 * max}deg`)
      el.style.setProperty('--rx', `${(0.5 - y) * 2 * max}deg`)
      el.style.setProperty('--gx', `${x * 100}%`)
      el.style.setProperty('--gy', `${y * 100}%`)
    })
  }
  const onPointerLeave = () => {
    const el = ref.current
    cancelAnimationFrame(frame.current)
    if (!el) return
    delete el.dataset.tilting
    el.style.removeProperty('--rx')
    el.style.removeProperty('--ry')
  }
  return { ref, handlers: { onPointerMove, onPointerLeave } }
}
