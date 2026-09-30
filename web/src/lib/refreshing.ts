// SPDX-License-Identifier: AGPL-3.0-or-later

import { useSyncExternalStore } from 'react'

/**
 * Titles whose details are being fetched right now. What's about to be
 * replaced blurs while they are, and sharpens once the new details (and
 * their artwork) have arrived.
 */
const fetching = new Set<number>()
/** Titles whose last fetch failed, which shouldn't look like they're still being fetched. */
const failed = new Set<number>()
const listeners = new Set<() => void>()
/** A fetch whose end we never hear about (a dropped connection) doesn't blur forever. */
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit() {
  for (const l of listeners) l()
}

export function startFetching(id: number) {
  clearTimeout(timers.get(id))
  timers.set(id, setTimeout(() => stopFetching(id), 60_000))
  if (fetching.has(id)) return
  fetching.add(id)
  emit()
}

export function stopFetching(id: number, error = false) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  const changed = fetching.delete(id) || error !== failed.has(id)
  if (error) failed.add(id)
  else failed.delete(id)
  if (changed) emit()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/**
 * Whether a title's details are being fetched. `pending` covers a title
 * waiting on its first match, whose fetch may have started before the page
 * was loaded.
 */
export function useFetching(id: number | null | undefined, pending = false): boolean {
  return useSyncExternalStore(
    subscribe,
    () => id != null && (fetching.has(id) || (pending && !failed.has(id))),
    () => false,
  )
}

/** Waits for images to be downloaded and decoded, so they sharpen already there. */
export function preload(srcs: (string | null | undefined)[], timeout = 4000): Promise<void> {
  const loads = srcs
    .filter((s): s is string => !!s)
    .map((src) => {
      const img = new Image()
      img.src = src
      return img.decode().catch(() => {})
    })
  return Promise.race([Promise.all(loads).then(() => {}), new Promise<void>((r) => setTimeout(r, timeout))])
}
