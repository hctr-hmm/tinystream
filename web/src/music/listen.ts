// SPDX-License-Identifier: AGPL-3.0-or-later
// Listening together: a room holds a queue and a clock, and everyone's
// player follows it. The decoder plays one track into the next on its own,
// so the room only steps in when someone drifts or does something.

import { useNavigate } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { toastError } from '../components/feedback'
import { graphql } from '../gql'
import { request } from '../lib/api'
import { type Clock, type Member, type Status, positionAt } from '../player/sync'
import type { MusicTrack } from './api'
import { getState, music, position } from './player'

export type ListenState = {
  code: string
  queue: number[]
  current: number
  host: { id: number; name: string }
  public: boolean
  invited: number[]
  settings: { control: 'everyone' | 'host'; waitForAll: boolean }
  clock: Clock
  members: Member[]
  action: { seq: number; member: number; by: string; kind: string } | null
}

export type ListenSnapshot = {
  room: ListenState | null
  you: number | null
  connected: boolean
  ended: boolean
  error: string | null
}

const StartRoom = graphql(`
  mutation StartListenRoom($input: NewListenRoom!) {
    startListenRoom(input: $input) {
      code
    }
  }
`)

/** Opens a room playing some tracks, from the one at `index`, and goes there. */
export function useStartListening() {
  const navigate = useNavigate()
  return async (tracks: MusicTrack[], index = 0, position = 0) => {
    try {
      const { startListenRoom: r } = await request(StartRoom, {
        input: { tracks: tracks.map((t) => t.id), current: index, position, paused: true },
      })
      await navigate({ to: '/listen/$code', params: { code: r.code } })
    } catch (e) {
      toastError(e)
    }
  }
}

type Outgoing =
  | { type: 'ping'; id: number; c: number }
  | { type: 'play' | 'pause' | 'seek'; position: number }
  | { type: 'skip'; index: number; from: number }
  | { type: 'queue'; tracks: number[]; current: number; position: number }
  | { type: 'add'; tracks: number[]; next: boolean }
  | { type: 'remove'; index: number }
  | { type: 'move'; from: number; to: number }
  | { type: 'status'; status: Status }
  | { type: 'name'; name: string }
  | { type: 'settings'; control?: 'everyone' | 'host'; waitForAll?: boolean; public?: boolean }
  | { type: 'invite'; userId: number }
  | { type: 'end' }

const localNow = () => performance.timeOrigin + performance.now()

export class ListenClient {
  private snap: ListenSnapshot = { room: null, you: null, connected: false, ended: false, error: null }
  private watchers = new Set<() => void>()
  private ws: WebSocket | null = null
  private closed = false
  private retry = 0
  private offset = 0
  private samples: { rtt: number; offset: number }[] = []
  private ping = 0
  private timers: ReturnType<typeof setInterval>[] = []
  private status: Status | null = null
  private following: Promise<void> = Promise.resolve()

  constructor(
    private code: string,
    /** The room's tracks, in queue order, by id. */
    private tracks: (ids: number[]) => Promise<MusicTrack[]>,
    private name?: string,
  ) {}

  get = () => this.snap

  subscribe = (f: () => void) => {
    this.watchers.add(f)
    return () => void this.watchers.delete(f)
  }

  private set(patch: Partial<ListenSnapshot>) {
    this.snap = { ...this.snap, ...patch }
    this.watchers.forEach((f) => f())
  }

  private send(m: Outgoing) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m))
  }

  private now() {
    return localNow() + this.offset
  }

  /** Where the room is right now. */
  where(): { index: number; time: number; playing: boolean } | null {
    const r = this.snap.room
    if (!r) return null
    return { index: r.current, time: positionAt(r.clock, this.now()), playing: r.clock.running }
  }

  async join() {
    this.closed = false
    await music.enterRoom(this.code, {
      play: () => this.send({ type: 'play', position: position()?.time ?? 0 }),
      pause: () => this.send({ type: 'pause', position: position()?.time ?? 0 }),
      seek: (t) => this.send({ type: 'seek', position: t }),
      skip: (index) => this.send({ type: 'skip', index, from: this.snap.room?.current ?? 0 }),
      add: (tracks, next) => this.send({ type: 'add', tracks: tracks.map((t) => t.id), next }),
      remove: (index) => this.send({ type: 'remove', index }),
      move: (from, to) => this.send({ type: 'move', from, to }),
    })
    this.connect()
    this.timers.push(setInterval(() => this.sync(), 1000))
    this.timers.push(setInterval(() => this.measure(), 5000))
  }

  leave() {
    this.closed = true
    this.timers.forEach(clearInterval)
    this.timers = []
    this.ws?.close()
    void music.leaveRoom()
  }

  private connect() {
    const q = this.name ? `?name=${encodeURIComponent(this.name)}` : ''
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/listen/${this.code}/ws${q}`)
    this.ws = ws
    ws.onopen = () => {
      this.retry = 0
      this.samples = []
      this.set({ connected: true })
      this.measure()
    }
    ws.onmessage = (e) => this.receive(JSON.parse(e.data))
    ws.onclose = () => {
      this.set({ connected: false })
      if (this.closed || this.snap.ended) return
      setTimeout(() => !this.closed && this.connect(), Math.min(10_000, 500 * 2 ** this.retry++))
    }
  }

  private measure() {
    this.send({ type: 'ping', id: ++this.ping, c: localNow() })
  }

  private receive(m: { type: string } & Record<string, unknown>) {
    switch (m.type) {
      case 'welcome':
        this.set({ you: m.you as number })
        this.offset = (m.serverTime as number) - localNow()
        break
      case 'pong': {
        const t = localNow()
        const c = m.c as number
        const rtt = t - c
        this.samples = [...this.samples, { rtt, offset: (m.s as number) - (c + rtt / 2) }].slice(-8)
        this.offset = this.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a)).offset
        break
      }
      case 'state': {
        const room = m as unknown as ListenState
        // Someone's status changing isn't a reason to touch the player.
        const before = this.snap.room
        const moved = !before || before.current !== room.current || before.queue.join() !== room.queue.join() || JSON.stringify(before.clock) !== JSON.stringify(room.clock)
        this.set({ room })
        if (moved) this.sync()
        break
      }
      case 'ended':
        this.set({ ended: true })
        this.leave()
        break
      case 'error':
        this.set({ error: m.message as string })
        setTimeout(() => this.set({ error: null }), 4000)
        break
    }
  }

  private tell(status: Status) {
    if (status === this.status) return
    this.status = status
    this.send({ type: 'status', status })
  }

  /** Brings the player in line with the room, one change at a time. */
  private sync() {
    this.following = this.following.then(async () => {
      const r = this.snap.room
      const at = this.where()
      if (!r || !at || !r.queue.length) return
      const queue = getState().queue
      const changed = queue.length !== r.queue.length || r.queue.some((id, i) => queue[i]?.track.id !== id)
      const tracks = changed ? await this.tracks(r.queue) : queue.map((e) => e.track)
      if (tracks.length !== r.queue.length) return
      const loading = getState().index !== at.index
      if (loading) this.tell('loading')
      await music.follow(tracks, at.index, at.time, at.playing)
      this.tell(getState().waiting && getState().playing ? 'buffering' : 'ready')
    })
  }

  command(m: Outgoing) {
    this.send(m)
  }
}

export function useListen(client: ListenClient | null): ListenSnapshot | null {
  return useSyncExternalStore(
    (f) => client?.subscribe(f) ?? (() => {}),
    () => client?.get() ?? null,
    () => null,
  )
}
