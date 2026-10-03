// SPDX-License-Identifier: AGPL-3.0-or-later
// Plays what the decoder put in the ring, at the volume asked for, fading
// in and out over a few milliseconds so pausing never clicks.

import { FLUSH_AT, GENERATION, READ, WRITTEN, views } from './ring'

declare const sampleRate: number
declare class AudioWorkletProcessor {
  readonly port: MessagePort
}
declare function registerProcessor(name: string, ctor: unknown): void

export type ToWorklet = { sab: SharedArrayBuffer } | { playing: boolean } | { volume: number }
export type FromWorklet = { read: number; starved: boolean }

/** How fast the level follows: about 8 ms to settle. */
const SMOOTH = 1 / (0.008 * sampleRate)

class Player extends AudioWorkletProcessor {
  private ring: ReturnType<typeof views> | null = null
  private generation = -1n
  private read = 0
  private playing = false
  private volume = 1
  private level = 0
  private reported = 0
  private starved = false

  constructor() {
    super()
    this.port.onmessage = (e: MessageEvent<ToWorklet>) => {
      const m = e.data
      if ('sab' in m) this.ring = views(m.sab)
      if ('playing' in m) this.playing = m.playing
      if ('volume' in m) this.volume = m.volume
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const out = outputs[0]
    const left = out[0]
    const right = out[1] ?? out[0]
    const ring = this.ring
    if (!ring) return true
    const { header, data, frames } = ring
    const generation = Atomics.load(header, GENERATION)
    if (generation !== this.generation) {
      this.generation = generation
      this.read = Number(Atomics.load(header, FLUSH_AT))
    }
    const target = this.playing ? this.volume : 0
    let available = Number(Atomics.load(header, WRITTEN)) - this.read
    let starved = false
    for (let i = 0; i < left.length; i++) {
      if (!this.playing && this.level < 1e-4) {
        this.level = 0
        left[i] = right[i] = 0
        continue
      }
      this.level += (target - this.level) * SMOOTH
      if (available <= 0) {
        if (this.playing) starved = true
        left[i] = right[i] = 0
        continue
      }
      const at = (this.read % frames) * 2
      left[i] = data[at] * this.level
      right[i] = data[at + 1] * this.level
      this.read++
      available--
    }
    Atomics.store(header, READ, BigInt(this.read))
    if (this.read - this.reported >= 1024 || starved !== this.starved) {
      this.reported = this.read
      this.starved = starved
      this.port.postMessage({ read: this.read, starved } satisfies FromWorklet)
    }
    return true
  }
}

registerProcessor('tinystream-music', Player)
