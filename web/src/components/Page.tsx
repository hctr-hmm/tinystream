// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react'

/** `arrive` sharpens the page's sections in, top to bottom: for content that replaces a skeleton. */
export function Page({ children, wide = false, arrive = false }: { children: ReactNode; wide?: boolean; arrive?: boolean }) {
  return (
    <main
      data-arrive={arrive || undefined}
      className={`mx-auto w-full px-5 py-8 md:px-10 md:py-10 ${wide ? 'max-w-[1600px]' : 'max-w-[1400px]'}`}
    >
      {children}
    </main>
  )
}

export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-8 flex items-end gap-4">
      <h1 className="min-w-0 flex-1 truncate text-[28px] leading-tight font-semibold tracking-[-0.02em]">{children}</h1>
      {aside}
    </div>
  )
}

export function Section({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-11">
      <div className="mb-3.5 flex items-baseline gap-3">
        <h2 className="flex-1 text-[15px] font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      {children && <div className="mt-2 max-w-sm text-sm leading-relaxed text-ink-2">{children}</div>}
    </div>
  )
}
