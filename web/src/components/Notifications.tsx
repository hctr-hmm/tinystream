// SPDX-License-Identifier: AGPL-3.0-or-later

import { useNavigate } from '@tanstack/react-router'
import { Bell, BellOff, CircleCheck, CirclePlay, CircleX, Inbox as InboxIcon, Radio, Scissors, Send, Users, X } from 'lucide-react'
import { type KeyboardEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { relative, useNow } from '../lib/downloads'
import { type Notice, type NoticeKind, onArrival, pillNotices, useInbox, useMarkRead, useRemove } from '../lib/notifications'
import { Avatar } from './Avatar'
import { Squircle } from './Squircle'
import { Button, IconButton, Panel, Popover } from './ui'

const KINDS: Record<NoticeKind, { icon: ReactNode; tint: string }> = {
  AIRED: { icon: <Radio />, tint: 'text-warn-soft' },
  READY: { icon: <CirclePlay />, tint: 'text-info' },
  INVITE: { icon: <Users />, tint: 'text-social' },
  REQUEST: { icon: <InboxIcon />, tint: 'text-ink-2' },
  REQUEST_APPROVED: { icon: <CircleCheck />, tint: 'text-ok' },
  REQUEST_DECLINED: { icon: <CircleX />, tint: 'text-danger' },
  CLIP: { icon: <Send />, tint: 'text-highlight' },
  CLIP_READY: { icon: <Scissors />, tint: 'text-highlight' },
  OTHER: { icon: <InboxIcon />, tint: 'text-ink-2' },
}

const kind = (n: Notice) => KINDS[n.kind]

/** Opening the inbox from elsewhere (the pill, a shortcut). */
let inboxOpen = false
const inboxListeners = new Set<() => void>()
export function setInboxOpen(open: boolean) {
  inboxOpen = open
  inboxListeners.forEach((l) => l())
}
const subscribeInbox = (l: () => void) => (inboxListeners.add(l), () => void inboxListeners.delete(l))

/** Follows a notification wherever it points, and counts it as read. */
function useFollow() {
  const navigate = useNavigate()
  const read = useMarkRead()
  return (n: Notice) => {
    if (n.readAt == null) read.mutate([n.id])
    if (n.link) void navigate({ to: n.link })
  }
}

/** Artwork when there is some, with whoever caused it tucked in the corner. */
function Thumb({ n, size = 36 }: { n: Notice; size?: number }) {
  const [broken, setBroken] = useState(false)
  const k = kind(n)
  const art = n.image && !broken
  return (
    <span className="relative shrink-0" style={{ width: size }}>
      {art ? (
        <Squircle radius={size / 5} className={`${(n.kind === 'CLIP' || n.kind === 'CLIP_READY') ? 'aspect-square' : 'aspect-[2/3]'} w-full bg-panel`}>
          <img src={n.image!} alt="" onError={() => setBroken(true)} className="size-full object-cover" />
        </Squircle>
      ) : n.actor ? (
        <Avatar user={n.actor} size={size} />
      ) : (
        <Squircle radius={size / 4} className={`grid aspect-square w-full place-items-center bg-panel ${k.tint} [&>svg]:size-[45%]`}>
          {k.icon}
        </Squircle>
      )}
      {art && n.actor && (
        <span className="absolute -right-1.5 -bottom-1.5 rounded-full ring-2 ring-float">
          <Avatar user={n.actor} size={Math.round(size * 0.5)} />
        </span>
      )}
    </span>
  )
}
/** The bell, and everything that's happened. */
export function NotificationsMenu({ align = 'end' }: { align?: 'start' | 'end' }) {
  const { data } = useInbox()
  const open = useSyncExternalStore(subscribeInbox, () => inboxOpen, () => false)
  const unread = data?.unread ?? 0
  return (
    <Popover
      portal
      align={align}
      open={open}
      onOpenChange={setInboxOpen}
      trigger={({ toggle, open }) => (
        <IconButton label={unread ? `Notifications, ${unread} unread` : 'Notifications'} onClick={toggle} className={`relative ${open ? 'bg-hover text-ink' : ''}`}>
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 grid h-3.5 min-w-3.5 animate-[pop_160ms_ease-out] place-items-center rounded-full bg-ink px-1 text-[9px] leading-none font-semibold text-canvas tabular">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </IconButton>
      )}
    >
      {(close) => <InboxPanel items={data?.items ?? []} unread={unread} onClose={close} />}
    </Popover>
  )
}

function InboxPanel({ items, unread, onClose }: { items: Notice[]; unread: number; onClose: () => void }) {
  const read = useMarkRead()
  const remove = useRemove()
  const follow = useFollow()
  const now = useNow(30_000)
  const fresh = items.filter((n) => n.readAt == null)
  const earlier = items.filter((n) => n.readAt != null)
  return (
    <Panel radius={16} className="w-[min(24rem,calc(100vw-1.5rem))]">
      <div className="flex items-center gap-2 border-b border-line py-2 pr-2 pl-4">
        <p className="flex-1 text-sm font-medium">Notifications</p>
        {unread > 0 && (
          <Button size="sm" variant="plain" onClick={() => read.mutate(undefined)}>
            Mark all read
          </Button>
        )}
        {items.length > 0 && unread === 0 && (
          <Button size="sm" variant="plain" onClick={() => remove.mutate('all')}>
            Clear
          </Button>
        )}
      </div>
      <div className="max-h-[min(34rem,70dvh)] overflow-y-auto overscroll-contain p-1.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <BellOff className="size-5 text-ink-3" />
            <p className="text-sm text-ink-2">Nothing yet</p>
          </div>
        ) : (
          <>
            {fresh.length > 0 && earlier.length > 0 && <Heading>New</Heading>}
            {fresh.map((n) => (
              <Row key={n.id} n={n} now={now} onOpen={() => (onClose(), follow(n))} onRemove={() => remove.mutate(n.id)} />
            ))}
            {earlier.length > 0 && fresh.length > 0 && <Heading>Earlier</Heading>}
            {earlier.map((n) => (
              <Row key={n.id} n={n} now={now} onOpen={() => (onClose(), follow(n))} onRemove={() => remove.mutate(n.id)} />
            ))}
          </>
        )}
      </div>
    </Panel>
  )
}

function Heading({ children }: { children: ReactNode }) {
  return <p className="px-2.5 pt-2.5 pb-1 text-2xs font-medium tracking-wide text-ink-3 uppercase">{children}</p>
}

function Row({ n, now, onOpen, onRemove }: { n: Notice; now: number; onOpen: () => void; onRemove: () => void }) {
  const unread = n.readAt == null
  const expired = n.expiresAt != null && n.expiresAt * 1000 < now
  return (
    <Squircle
      radius={10}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className="group relative flex cursor-pointer gap-3 px-2.5 py-2.5 outline-none hover:bg-hover focus-visible:bg-hover"
    >
      <Thumb n={n} />
      <div className="min-w-0 flex-1 pr-5">
        <p className={`text-[13px] leading-snug ${unread ? 'font-medium text-ink' : 'text-ink-2'}`}>{n.title}</p>
        {n.body && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-3">{n.body}</p>}
        <p className="mt-1 flex items-center gap-1.5 text-2xs text-ink-3">
          <span className={`[&>svg]:size-3 ${kind(n).tint}`}>{kind(n).icon}</span>
          {relative(n.createdAt, now)}
          {expired && n.kind === 'INVITE' && <span>· expired</span>}
        </p>
      </div>
      {unread && <span className="absolute top-3.5 right-3 size-1.5 rounded-full bg-ink group-hover:hidden" />}
      <button
        aria-label="Remove"
        onClick={(e) => (e.stopPropagation(), onRemove())}
        className="absolute top-2 right-1.5 hidden size-6 place-items-center rounded-md text-ink-3 group-hover:grid group-focus-within:grid hover:bg-press hover:text-ink"
      >
        <X className="size-3.5" />
      </button>
    </Squircle>
  )
}
/** How long a new arrival stays opened up before it settles into the pill. */
const OPEN_FOR = 6000
/** How many notices fit in the opened pill. */
const STACK = 3

/**
 * The island at the top of the page: what needs attention right now (a new
 * episode, an invitation), until it's dealt with. It opens up when something
 * arrives or when pointed at, and settles back into a slim pill.
 */
export function PriorityPill() {
  const { data } = useInbox()
  const now = useNow(30_000)
  const notices = pillNotices(data, now / 1000)
  const read = useMarkRead()
  const follow = useFollow()
  const [fresh, setFresh] = useState(false)
  const [hover, setHover] = useState(false)
  const [tapped, setTapped] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  // Keeps showing the last notices while the pill leaves.
  const last = useRef<Notice[]>([])
  if (notices.length) last.current = notices
  const shown = notices.length ? notices : last.current
  const visible = notices.length > 0
  const open = visible && (fresh || hover || tapped)

  useEffect(
    () =>
      onArrival((n) => {
        if (n.priority) setFresh(true)
      }),
    [],
  )
  // Whatever's waiting when the page opens (or playback ends) gets a moment too.
  const loaded = !!data
  useEffect(() => {
    if (loaded && notices.length) setFresh(true)
  }, [loaded])
  useEffect(() => {
    if (!fresh || hover) return
    const t = setTimeout(() => setFresh(false), OPEN_FOR)
    return () => clearTimeout(t)
  }, [fresh, hover])
  // Taps elsewhere close it on touch screens.
  useEffect(() => {
    if (!tapped) return
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setTapped(false)
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [tapped])
  useEffect(() => {
    if (!visible) setTapped(false)
  }, [visible])

  // The outside follows the inside's size, so the pill morphs between shapes.
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (typeof document === 'undefined') return null
  const top = shown[0]
  const dismiss = (n: Notice) => read.mutate([n.id])

  return createPortal(
    <div
      ref={root}
      className="pointer-events-none fixed top-[calc(3.5rem+env(safe-area-inset-top))] left-1/2 z-[45] -translate-x-1/2 md:top-3 md:left-[calc(50%+7.5rem)]"
    >
      <div
        role="status"
        aria-live="polite"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}
        className={`lift origin-top transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
          visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none -translate-y-4 scale-90 opacity-0 blur-[2px]'
        }`}
      >
        <div
          className="material overflow-hidden bg-float inset-ring inset-ring-glow/8 transition-[width,height,border-radius] duration-[420ms] ease-[cubic-bezier(.3,1.25,.4,1)]"
          style={size ? { width: size.w, height: size.h, borderRadius: open ? 22 : size.h / 2 } : { borderRadius: 20 }}
        >
          <div ref={inner} className="w-max">
            {top &&
              (open ? (
                <div key="open" className="w-[min(25rem,calc(100vw-1.5rem))] animate-[fade_240ms_ease-out] p-1.5">
                  {shown.slice(0, STACK).map((n, i) => (
                    <PillRow key={n.id} n={n} first={i === 0} now={now} onOpen={() => follow(n)} onDismiss={() => dismiss(n)} />
                  ))}
                  {shown.length > STACK && (
                    <button
                      onClick={() => setInboxOpen(true)}
                      className="mt-0.5 w-full rounded-[14px] px-3 py-2 text-left text-xs text-ink-3 transition-colors hover:bg-hover hover:text-ink-2"
                    >
                      {shown.length - STACK} more in notifications
                    </button>
                  )}
                  {shown.length > 1 && (
                    <div className="flex justify-end px-1.5 pt-0.5 pb-0.5">
                      <Button size="sm" variant="plain" className="!h-6 !text-2xs" onClick={() => read.mutate(shown.map((n) => n.id))}>
                        Dismiss all
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key="closed"
                  onClick={(e) => {
                    // A tap opens it first; with a mouse it's already open.
                    if ((e.nativeEvent as PointerEvent).pointerType === 'mouse') follow(top)
                    else setTapped(true)
                  }}
                  className="flex h-10 max-w-[calc(100vw-1.5rem)] animate-[fade_240ms_ease-out] items-center gap-2.5 pr-4 pl-1.5 text-left outline-none"
                >
                  <PillThumb n={top} />
                  <span className="max-w-[15rem] truncate text-[13px] font-medium md:max-w-[22rem]">{top.title}</span>
                  {shown.length > 1 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-press px-1.5 text-2xs text-ink-2 tabular">
                      +{shown.length - 1}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** A small round glimpse of the notice: its artwork, or its kind. */
function PillThumb({ n }: { n: Notice }) {
  const [broken, setBroken] = useState(false)
  const k = kind(n)
  return (
    <span className="relative grid size-7 shrink-0 place-items-center">
      {n.image && !broken ? (
        <img src={n.image} alt="" onError={() => setBroken(true)} className="size-7 rounded-full object-cover" />
      ) : n.actor ? (
        <Avatar user={n.actor} size={28} />
      ) : (
        <span className={`grid size-7 place-items-center rounded-full bg-panel ${k.tint} [&>svg]:size-3.5`}>{k.icon}</span>
      )}
      <span className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-current ring-2 ring-float ${k.tint} animate-[pulse-dot_2s_ease-in-out_infinite]`} />
    </span>
  )
}

function PillRow({ n, first, now, onOpen, onDismiss }: { n: Notice; first: boolean; now: number; onOpen: () => void; onDismiss: () => void }) {
  const invite = n.kind === 'INVITE'
  return (
    <div
      role="button"
      tabIndex={0}
      className={`group relative flex cursor-pointer items-center gap-3 rounded-[16px] p-2 outline-none transition-colors hover:bg-hover focus-visible:bg-hover ${first ? '' : 'mt-0.5'}`}
      onClick={onOpen}
      onKeyDown={(e) => e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
    >
      <Thumb n={n} size={first ? 40 : 30} />
      <div className="min-w-0 flex-1">
        <p className={`leading-snug font-medium ${first ? 'text-sm' : 'text-[13px]'}`}>{n.title}</p>
        {n.body && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-2">{n.body}</p>}
        {first && (
          <p className="mt-1 flex items-center gap-1.5 text-2xs text-ink-3">
            <span className={`[&>svg]:size-3 ${kind(n).tint}`}>{kind(n).icon}</span>
            {relative(n.createdAt, now)}
          </p>
        )}
      </div>
      {invite ? (
        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="plain" onClick={onDismiss}>
            Not now
          </Button>
          <Button size="sm" variant="primary" onClick={onOpen}>
            Join
          </Button>
        </div>
      ) : (
        <button
          aria-label="Dismiss"
          onClick={(e) => (e.stopPropagation(), onDismiss())}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-press hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
