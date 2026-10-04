// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ImgHTMLAttributes, useEffect, useLayoutEffect, useRef, useState } from 'react'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Artwork appears as soon as it loads, without an entrance animation.
 * Artwork the browser already has is shown as-is, so going back to a page
 * doesn't hide it while waiting for another load event.
 */
export function Img({ className = '', decoding = 'async', onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null)
  const [ready, setReady] = useState(false)
  useIsoLayoutEffect(() => {
    const img = ref.current
    const done = !!img && img.complete && img.naturalWidth > 0
    // Marked right away: a parent measuring itself in its own layout effect
    // would otherwise style it undeveloped first, and it'd develop anyway.
    if (done) img.dataset.ready = 'true'
    setReady(done)
  }, [props.src])
  return (
    <img
      ref={ref}
      alt=""
      {...props}
      decoding={decoding}
      onLoad={(e) => {
        setReady(true)
        onLoad?.(e)
      }}
      data-ready={ready || undefined}
      className={`develop ${className}`}
    />
  )
}
