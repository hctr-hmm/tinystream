// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ImgHTMLAttributes, useEffect, useLayoutEffect, useRef, useState } from 'react'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Artwork that develops as it arrives: blurry and washed out, then sharp.
 * Artwork the browser already has is shown as-is, so going back to a page
 * doesn't develop it all over again.
 */
export function Img({ className = '', decoding = 'async', fetchPriority, onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
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
  useIsoLayoutEffect(() => {
    const img = ref.current
    if (!img || fetchPriority || props.loading !== 'lazy') return
    const rect = img.getBoundingClientRect()
    img.fetchPriority = rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth ? 'high' : 'low'
    const observer = new IntersectionObserver(([entry]) => {
      img.fetchPriority = entry.isIntersecting ? 'high' : 'low'
    })
    observer.observe(img)
    return () => observer.disconnect()
  }, [props.src, props.loading, fetchPriority])
  return (
    <img
      ref={ref}
      alt=""
      {...props}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onLoad={(e) => {
        setReady(true)
        onLoad?.(e)
      }}
      data-ready={ready || undefined}
      className={`develop ${className}`}
    />
  )
}
