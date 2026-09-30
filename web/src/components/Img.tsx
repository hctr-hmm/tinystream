// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ImgHTMLAttributes, useEffect, useLayoutEffect, useRef, useState } from 'react'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Artwork that develops as it arrives: blurry and washed out, then sharp.
 * Artwork the browser already has is shown as-is, so going back to a page
 * doesn't develop it all over again.
 */
export function Img({ className = '', onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null)
  const [ready, setReady] = useState(false)
  useIsoLayoutEffect(() => {
    const img = ref.current
    setReady(!!img && img.complete && img.naturalWidth > 0)
  }, [props.src])
  return (
    <img
      ref={ref}
      alt=""
      {...props}
      onLoad={(e) => {
        setReady(true)
        onLoad?.(e)
      }}
      data-ready={ready || undefined}
      className={`develop ${className}`}
    />
  )
}
