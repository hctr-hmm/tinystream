// SPDX-License-Identifier: AGPL-3.0-or-later
// Titles opened recently, for the command palette's empty state.

export type Recent = { id: number; title: string; poster: string | null; kind: 'show' | 'movie' }

const KEY = 'tinystream.recents'

export function recents(): Recent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Recent[]
  } catch {
    return []
  }
}

/** Keeps only the recents whose ids are in `ids`, e.g. after titles were deleted. */
export function prune(ids: Set<number>) {
  const list = recents()
  const kept = list.filter((r) => ids.has(r.id))
  if (kept.length !== list.length) localStorage.setItem(KEY, JSON.stringify(kept))
  return kept
}

export function remember(r: Recent) {
  const list = [r, ...recents().filter((x) => x.id !== r.id)].slice(0, 6)
  localStorage.setItem(KEY, JSON.stringify(list))
}
