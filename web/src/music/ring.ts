// SPDX-License-Identifier: AGPL-3.0-or-later
// The buffer between the decoder (a worker) and the speakers (an audio
// worklet): stereo float frames in a ring, with counters both sides share.
// Counters only ever grow; a frame's place in the ring is its count modulo
// the ring's size.

/** Frames decoded so far. Only the worker moves it. */
export const WRITTEN = 0
/** Frames played so far. Only the worklet moves it. */
export const READ = 1
/** Bumped by the worker to throw away what's buffered, e.g. after a seek. */
export const GENERATION = 2
/** Where playing picks up after the generation changes. */
export const FLUSH_AT = 3
const SLOTS = 4

export const SECONDS = 8

export function makeRing(rate: number): SharedArrayBuffer {
  return new SharedArrayBuffer(SLOTS * 8 + Math.ceil(rate * SECONDS) * 2 * 4)
}

export function views(sab: SharedArrayBuffer) {
  const header = new BigInt64Array(sab, 0, SLOTS)
  const data = new Float32Array(sab, SLOTS * 8)
  return { header, data, frames: data.length / 2 }
}
