// SPDX-License-Identifier: AGPL-3.0-or-later

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { settingsQuery } from '../lib/api'
import { Squircle } from './Squircle'

export function useSettings() {
  return useQuery(settingsQuery)
}

/** Refetches everything that depends on config.toml after a save. */
export function useSave() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: ['settings'] })
    void qc.invalidateQueries({ queryKey: ['libraries'] })
    void qc.invalidateQueries({ queryKey: ['features'] })
  }
}

export function Card({ title, description, children, aside }: { title: string; description?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <Squircle radius={16} edge className="mb-5 bg-raised p-5">
      <div className="mb-4 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-ink-3">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Squircle>
  )
}

export function Row({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
