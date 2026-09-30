// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react'

const cache = new Map<string, string | null>()

/**
 * The artwork's most vivid colour, as "r g b", for tinting the page around
 * it. Only works for same-origin images (our /api/images), which is all the
 * pages that use it show.
 */
export function useAmbient(src: string | null | undefined): string | null {
  const [color, setColor] = useState<string | null>(() => (src ? (cache.get(src) ?? null) : null))
  useEffect(() => {
    if (!src || !src.startsWith('/')) return setColor(null)
    if (cache.has(src)) return setColor(cache.get(src)!)
    let alive = true
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const c = extract(img)
      cache.set(src, c)
      if (alive) setColor(c)
    }
    img.src = src
    return () => {
      alive = false
    }
  }, [src])
  return color
}

function extract(img: HTMLImageElement): string | null {
  try {
    const size = 24
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, size, size)
    const data = ctx.getImageData(0, 0, size, size).data
    let r = 0
    let g = 0
    let b = 0
    let total = 0
    for (let i = 0; i < data.length; i += 4) {
      const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]]
      const max = Math.max(pr, pg, pb)
      const min = Math.min(pr, pg, pb)
      // Favour saturated, mid-bright pixels over greys, blacks and whites.
      const sat = max === 0 ? 0 : (max - min) / max
      const light = max / 255
      const w = sat * sat * (light > 0.15 && light < 0.95 ? 1 : 0.1) + 0.002
      r += pr * w
      g += pg * w
      b += pb * w
      total += w
    }
    return `${Math.round(r / total)} ${Math.round(g / total)} ${Math.round(b / total)}`
  } catch {
    return null
  }
}
