// SPDX-License-Identifier: AGPL-3.0-or-later
// ASS/SSA rendering via JASSUB (libass in WebAssembly), with the file's own
// embedded fonts.

import JASSUB from 'jassub'
import workerUrl from 'jassub/dist/worker/worker.js?worker&url'
import wasmUrl from 'jassub/dist/wasm/jassub-worker.wasm?url'
import modernWasmUrl from 'jassub/dist/wasm/jassub-worker-modern.wasm?url'
import defaultFont from 'jassub/dist/default.woff2?url'

export class SubtitleRenderer {
  private instance: JASSUB | null = null
  private current: string | null = null

  constructor(
    private video: HTMLVideoElement,
    /** Where this video's endpoints live, e.g. `/api/media/12`. */
    private base: string,
    private fonts: string[],
  ) {}

  private url(track: string) {
    return `${this.base}/subtitles/${track}`
  }

  async show(track: string | null) {
    if (track === this.current) return
    this.current = track
    if (!track) {
      if (this.instance) await this.instance.renderer.freeTrack()
      return
    }
    if (!this.instance) {
      this.instance = new JASSUB({
        video: this.video,
        subUrl: this.url(track),
        workerUrl,
        wasmUrl,
        modernWasmUrl,
        fonts: this.fonts,
        availableFonts: { 'liberation sans': defaultFont },
        defaultFont: 'liberation sans',
      })
      await this.instance.ready
      return
    }
    await this.instance.ready
    await this.instance.renderer.setTrackByUrl(this.url(track))
  }

  destroy() {
    void this.instance?.destroy()
    this.instance = null
  }
}
