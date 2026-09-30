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

export function remember(r: Recent) {
  const list = [r, ...recents().filter((x) => x.id !== r.id)].slice(0, 6)
  localStorage.setItem(KEY, JSON.stringify(list))
}
