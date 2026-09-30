// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

/** A horizontal shelf. Mice get arrows and faded edges; touch just scrolls. */
export function Row({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  const arrow = 'absolute top-[calc(50%-1.5rem)] z-10 hidden size-10 place-items-center rounded-full bg-float/90 text-ink shadow-lg backdrop-blur-md transition-opacity hover:bg-float pointer-fine:grid'
  return (
    <div className="group/row relative">
      <div
        ref={ref}
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pt-1 pb-3 md:-mx-10 md:scroll-px-10 md:px-10 [scrollbar-width:none]"
        style={{
          maskImage: `linear-gradient(to right, ${edges.start ? 'black' : 'transparent'}, black 3rem, black calc(100% - 3rem), ${edges.end ? 'black' : 'transparent'})`,
        }}
      >
        {children}
      </div>
      {!edges.start && (
        <button aria-label="Scroll left" onClick={() => page(-1)} className={`${arrow} -left-3 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100`}>
          <ChevronLeft className="size-5" />
        </button>
      )}
      {!edges.end && (
        <button aria-label="Scroll right" onClick={() => page(1)} className={`${arrow} -right-3 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100`}>
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  )
}
