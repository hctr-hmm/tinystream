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
  private requested: string | null = null
  private canvas: HTMLCanvasElement | null = null
  private glint: HTMLCanvasElement | null = null
  private animation: Animation | null = null
  private fetch: AbortController | null = null
  private update: Promise<void> = Promise.resolve()
  private revision = 0
  private destroyed = false

  constructor(
    private video: HTMLVideoElement,
    /** Where this video's endpoints live, e.g. `/api/media/12`. */
    private base: string,
    private fonts: string[],
  ) {}

  private url(track: string) {
    return `${this.base}/subtitles/${track}`
  }

  private shine() {
    const canvas = this.canvas!
    if (!canvas.width || !canvas.height) return
    const glint = document.createElement('canvas')
    glint.width = canvas.width
    glint.height = canvas.height
    const context = glint.getContext('2d')
    if (!context) return
    context.drawImage(canvas, 0, 0)
    glint.className = 'subtitle-glint'
    glint.style.cssText = canvas.style.cssText
    glint.style.filter = 'brightness(2) drop-shadow(0 0 3px rgb(255 255 255 / 0.5))'
    glint.style.maskImage = 'linear-gradient(110deg, transparent 40%, white 50%, transparent 60%)'
    glint.style.maskSize = '300% 100%'
    canvas.insertAdjacentElement('afterend', glint)
    this.glint = glint
    glint.animate([
      { maskPosition: '100% 0', opacity: 0 },
      { maskPosition: '50% 0', opacity: 0.8, offset: 0.5 },
      { maskPosition: '0% 0', opacity: 0 },
    ], { duration: 260, easing: 'ease-out', fill: 'forwards' })
  }

  private clearGlint() {
    this.glint?.remove()
    this.glint = null
  }

  async show(track: string | null) {
    if (this.destroyed || track === this.requested) return
    this.requested = track
    const revision = ++this.revision
    this.fetch?.abort()
    this.animation?.cancel()
    this.clearGlint()
    if (!track && !this.instance) return
    if (!this.instance) {
      this.canvas = document.createElement('canvas')
      this.canvas.className = 'JASSUB'
      this.canvas.style.position = 'absolute'
      this.canvas.style.pointerEvents = 'none'
      this.canvas.style.visibility = 'hidden'
      this.video.insertAdjacentElement('afterend', this.canvas)
      this.instance = new JASSUB({
        video: this.video,
        canvas: this.canvas,
        subContent: '[Script Info]\nScriptType: v4.00+\n[V4+ Styles]\n[Events]\n',
        workerUrl,
        wasmUrl,
        modernWasmUrl,
        fonts: [defaultFont, ...this.fonts],
        availableFonts: { 'liberation sans': defaultFont },
        defaultFont: 'liberation sans',
      })
    }
    const instance = this.instance
    const controller = new AbortController()
    this.fetch = controller
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const blurred = { filter: 'blur(6px) brightness(1.4)', opacity: 0.55 }
    const clear = { filter: 'blur(0px) brightness(1)', opacity: 1 }
    const fade = !reduced && this.current !== null
      ? this.canvas!.animate([clear, blurred], { duration: 160, easing: 'ease-out', fill: 'forwards' })
      : null
    this.animation = fade
    try {
      if (fade) this.shine()
      const content = track
        ? fetch(this.url(track), { signal: controller.signal }).then(async (response) => {
            if (!response.ok) throw new Error(`subtitle request failed: ${response.status}`)
            return response.text()
          })
        : Promise.resolve(null)
      const [text] = await Promise.all([content, instance.ready, fade?.finished])
      this.update = this.update.catch(() => {}).then(async () => {
        if (revision !== this.revision) return
        if (text === null) await instance.renderer.freeTrack()
        else await instance.renderer.setTrack(text)
        if (revision !== this.revision) return
        await instance.resize(true)
        if (revision !== this.revision) return
        await instance.renderer._draw(this.video.currentTime + instance.timeOffset, true)
        if (revision !== this.revision) return
        this.current = track
      })
      await this.update
      if (revision !== this.revision) return
      fade?.cancel()
      this.canvas!.style.visibility = track === null ? 'hidden' : 'visible'
      this.animation = !reduced && track !== null
        ? this.canvas!.animate([
            { ...blurred, filter: 'blur(6px) brightness(2)' },
            { filter: 'blur(2px) brightness(1.6)', opacity: 1, offset: 0.3 },
            clear,
          ], { duration: 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
        : null
      await this.animation?.finished
    } catch (error) {
      if (revision !== this.revision) return
      this.requested = this.current
      throw error
    } finally {
      if (revision === this.revision) {
        this.animation?.cancel()
        this.animation = null
        this.fetch = null
        this.clearGlint()
      }
    }
  }

  destroy() {
    this.destroyed = true
    ++this.revision
    this.fetch?.abort()
    this.animation?.cancel()
    this.clearGlint()
    void this.instance?.destroy()
    this.instance = null
    this.canvas?.remove()
    this.canvas = null
  }
}
