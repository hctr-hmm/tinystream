// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react'

/** The responsive layout for 2:3 poster cards: library, discover, and their skeletons. */
export function PosterGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-x-5 gap-y-7">{children}</div>
}
