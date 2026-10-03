// SPDX-License-Identifier: AGPL-3.0-or-later

import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react'
import { type PointerEvent, useRef, useState } from 'react'
import { duration } from './api'
import { current, music, usePlayer, usePosition } from './player'

/** Where in the track, and a way to go elsewhere in it: thin, thicker when it's being touched. */
export function Scrubber({ tint, compact = false }: { tint?: string | null; compact?: boolean }) {
  const time = usePosition()
  const length = usePlayer((s) => current(s)?.track.duration ?? 0)
  const [drag, setDrag] = useState<number | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  const at = (e: PointerEvent) => {
    const r = bar.current!.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * length
  }
  const shown = drag ?? time
  const fill = length > 0 ? Math.min(1, shown / length) : 0
  return (
    <div className="select-none">
      <div
        ref={bar}
        role="slider"
        aria-label="Position"
        aria-valuemin={0}
        aria-valuemax={Math.round(length)}
        aria-valuenow={Math.round(shown)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') music.seek(time + 5)
          else if (e.key === 'ArrowLeft') music.seek(time - 5)
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDrag(at(e))
        }}
        onPointerMove={(e) => drag !== null && setDrag(at(e))}
        onPointerUp={(e) => {
          if (drag !== null) music.seek(at(e))
          setDrag(null)
        }}
        className="group relative flex h-5 cursor-pointer items-center outline-none"
      >
        <div className={`relative w-full overflow-hidden rounded-full bg-ink/15 transition-[height] duration-200 ${drag !== null ? 'h-2' : 'h-1 group-hover:h-1.5'}`}>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-ink"
            style={{ width: `${fill * 100}%`, background: tint ? `rgb(${tint})` : undefined }}
          />
        </div>
        <div
          className={`absolute size-3 -translate-x-1/2 rounded-full bg-ink shadow transition-[opacity,scale] duration-150 ${drag !== null ? 'scale-110 opacity-100' : 'scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}
          style={{ left: `${fill * 100}%` }}
        />
      </div>
      {!compact && (
        <div className="mt-0.5 flex justify-between text-2xs text-ink-3 tabular">
          <span>{duration(shown)}</span>
          <span>-{duration(Math.max(0, length - shown))}</span>
        </div>
      )}
    </div>
  )
}

export function PlayButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const playing = usePlayer((s) => s.playing)
  const waiting = usePlayer((s) => s.waiting && s.playing)
  const box = size === 'lg' ? 'size-16' : size === 'md' ? 'size-12' : 'size-9'
  const icon = size === 'lg' ? 'size-7' : size === 'md' ? 'size-5' : 'size-4'
  return (
    <button
      aria-label={playing ? 'Pause' : 'Play'}
      onClick={(e) => {
        e.stopPropagation()
        void music.toggle()
      }}
      className={`relative grid shrink-0 place-items-center rounded-full bg-ink text-canvas transition-[scale] duration-150 hover:scale-105 active:scale-95 ${box}`}
    >
      {waiting && <span className="absolute -inset-1 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />}
      <span key={playing ? 'pause' : 'play'} className="grid animate-[pop_160ms_ease-out]">
        {playing ? <Pause className={`${icon} fill-current`} /> : <Play className={`${icon} translate-x-[6%] fill-current`} />}
      </span>
    </button>
  )
}

export function Transport({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const shuffled = usePlayer((s) => s.shuffled)
  const repeat = usePlayer((s) => s.repeat)
  const hasNext = usePlayer((s) => s.index + 1 < s.queue.length || s.repeat === 'ALL')
  const btn = 'grid size-10 place-items-center rounded-full text-ink-2 transition-[color,scale,background-color] hover:bg-hover hover:text-ink active:scale-90 disabled:opacity-30'
  const on = 'text-ink after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-current relative'
  const icon = size === 'lg' ? 'size-5.5' : 'size-5'
  return (
    <div className="flex items-center justify-between">
      <button aria-label="Shuffle" aria-pressed={shuffled} onClick={() => music.shuffle()} className={`${btn} ${shuffled ? on : ''}`}>
        <Shuffle className="size-4" />
      </button>
      <button aria-label="Previous" onClick={() => music.previous()} className={btn}>
        <SkipBack className={`${icon} fill-current`} />
      </button>
      <PlayButton size={size} />
      <button aria-label="Next" disabled={!hasNext} onClick={() => music.next()} className={btn}>
        <SkipForward className={`${icon} fill-current`} />
      </button>
      <button
        aria-label={repeat === 'OFF' ? 'Repeat' : repeat === 'ALL' ? 'Repeat one' : 'Stop repeating'}
        onClick={() => music.repeat(repeat === 'OFF' ? 'ALL' : repeat === 'ALL' ? 'ONE' : 'OFF')}
        className={`${btn} ${repeat !== 'OFF' ? on : ''}`}
      >
        {repeat === 'ONE' ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
      </button>
    </div>
  )
}

export function Volume() {
  const { volume, muted } = usePlayer((s) => s.settings)
  const bar = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState(false)
  const set = (e: PointerEvent) => {
    const r = bar.current!.getBoundingClientRect()
    music.settings({ volume: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), muted: false })
  }
  const level = muted ? 0 : volume
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2
  return (
    <div className="flex items-center gap-2">
      <button aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => music.settings({ muted: !muted })} className="grid size-8 place-items-center text-ink-3 hover:text-ink">
        <Icon className="size-4" />
      </button>
      <div
        ref={bar}
        role="slider"
        aria-label="Volume"
        aria-valuenow={Math.round(level * 100)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') music.settings({ volume: Math.min(1, volume + 0.05), muted: false })
          else if (e.key === 'ArrowLeft') music.settings({ volume: Math.max(0, volume - 0.05) })
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setDrag(true)
          set(e)
        }}
        onPointerMove={(e) => drag && set(e)}
        onPointerUp={() => setDrag(false)}
        className="group flex h-5 flex-1 cursor-pointer items-center outline-none"
      >
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-ink/15 transition-[height] group-hover:h-1.5">
          <div className="absolute inset-y-0 left-0 bg-ink-2 group-hover:bg-ink" style={{ width: `${level * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
