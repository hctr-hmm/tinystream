// SPDX-License-Identifier: AGPL-3.0-or-later

import { Link } from '@tanstack/react-router'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { type ReactNode, useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Squircle } from './Squircle'
import { Button, Dialog } from './ui'
export type Toast = {
  id: number
  title: ReactNode
  body?: ReactNode
  image?: string | null
  tone?: 'ok' | 'danger' | 'quiet'
  action?: { label: string; run: () => void }
  /** Makes the whole toast a link. */
  to?: { to: string; params?: Record<string, string> }
  /** Milliseconds on screen; hovering pauses it. */
  duration?: number
  leaving?: boolean
}

let toasts: Toast[] = []
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(t: Omit<Toast, 'id'>) {
  const id = ++seq
  toasts = [...toasts.slice(-3), { ...t, id }]
  emit()
  return id
}

export function dismiss(id: number) {
  if (!toasts.some((t) => t.id === id && !t.leaving)) return
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t))
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 160)
}

/** Shows an error from a failed action. */
export function toastError(e: unknown) {
  toast({ title: 'That didn’t work', body: (e as Error)?.message ?? String(e), tone: 'danger', duration: 7000 })
}
type Ask = { title: string; body?: ReactNode; confirm?: string; danger?: boolean; resolve: (ok: boolean) => void }
let asking: Ask | null = null

/** A styled replacement for window.confirm. Resolves true when confirmed. */
export function ask(o: Omit<Ask, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    asking?.resolve(false)
    asking = { ...o, resolve }
    emit()
  })
}

function answer(ok: boolean) {
  asking?.resolve(ok)
  asking = null
  emit()
}

const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l))

export function Feedback() {
  const list = useSyncExternalStore(subscribe, () => toasts, () => toasts)
  const question = useSyncExternalStore(subscribe, () => asking, () => asking)
  if (typeof document === 'undefined') return null
  return (
    <>
      {createPortal(
        <div className="pointer-events-none fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 md:inset-x-auto md:right-5 md:bottom-5 md:items-end">
          {list.map((t) => (
            <ToastView key={t.id} t={t} />
          ))}
        </div>,
        document.body,
      )}
      {question && (
        <Dialog onClose={() => answer(false)} width="max-w-sm">
          <Confirm q={question} />
        </Dialog>
      )}
    </>
  )
}

function Confirm({ q }: { q: Ask }) {
  return (
    <>
      <p className="text-[15px] font-medium">{q.title}</p>
      {q.body && <div className="mt-1.5 text-sm leading-relaxed text-ink-2">{q.body}</div>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="plain" onClick={() => answer(false)}>
          Cancel
        </Button>
        <Button
          autoFocus
          variant="primary"
          className={q.danger ? '!bg-danger !text-canvas hover:!bg-danger/90' : ''}
          onClick={() => answer(true)}
        >
          {q.confirm ?? 'Continue'}
        </Button>
      </div>
    </>
  )
}

function ToastView({ t }: { t: Toast }) {
  const [hover, setHover] = useState(false)
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    if (hover || t.leaving) return
    const id = setTimeout(() => dismiss(t.id), t.duration ?? 5000)
    return () => clearTimeout(id)
  }, [hover, t])
  const icon =
    t.tone === 'ok' ? <CircleCheck className="size-4.5 text-ok" /> : t.tone === 'danger' ? <CircleAlert className="size-4.5 text-danger" /> : null
  const content = (
    <div className="flex items-center gap-3">
      {t.image && !broken ? (
        <Squircle radius={8} className="aspect-[2/3] w-9 shrink-0 bg-panel">
          <img src={t.image} alt="" onError={() => setBroken(true)} className="size-full object-cover" />
        </Squircle>
      ) : (
        icon
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t.title}</p>
        {t.body && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-2">{t.body}</p>}
      </div>
    </div>
  )
  return (
    <div
      className={`lift pointer-events-auto w-full max-w-sm ${t.leaving ? 'animate-[sink_160ms_ease-in_forwards]' : 'animate-[rise_220ms_cubic-bezier(.2,.8,.2,1)]'}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      role="status"
    >
      <Squircle radius={16} edge className="material flex items-center gap-2 bg-float py-2.5 pr-2 pl-3">
        <div className="min-w-0 flex-1">
          {t.to ? (
            <Link to={t.to.to} params={t.to.params} onClick={() => dismiss(t.id)} className="block outline-none">
              {content}
            </Link>
          ) : (
            content
          )}
        </div>
        {t.action && (
          <Button
            size="sm"
            variant="plain"
            className="font-medium !text-ink"
            onClick={() => {
              t.action!.run()
              dismiss(t.id)
            }}
          >
            {t.action.label}
          </Button>
        )}
        <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="grid size-7 place-items-center rounded-lg text-ink-3 hover:bg-hover hover:text-ink">
          <X className="size-3.5" />
        </button>
      </Squircle>
    </div>
  )
}
