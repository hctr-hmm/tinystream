// SPDX-License-Identifier: AGPL-3.0-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, ImageUp, Minus, Plus, Trash2 } from 'lucide-react'
import { type DragEvent, type PointerEvent, type ReactNode, type WheelEvent, useEffect, useRef, useState } from 'react'
import { graphql } from '../gql'
import { request } from '../lib/api'
import { toastError } from './feedback'
import { Button, Dialog } from './ui'

/** `avatar` is the picture's URL (people in rooms carry a version instead, and pass `src`). */
type Who = { id: number | null; username: string; avatar?: string | number | null }

const SetAvatar = graphql(`
  mutation SetAvatar($image: Upload!, $userId: Int) {
    setAvatar(image: $image, userId: $userId) {
      id
      avatar
    }
  }
`)

const RemoveAvatar = graphql(`
  mutation RemoveAvatar($userId: Int) {
    removeAvatar(userId: $userId) {
      id
      avatar
    }
  }
`)

/** A stable, quiet hue per name, so pictureless people still look distinct. */
function hue(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 360
}

export const avatarUrl = (who: Who) => (typeof who.avatar === 'string' ? who.avatar : null)

export function Avatar({
  user,
  size = 32,
  className = '',
  src,
  fallback,
}: {
  user: Who
  size?: number
  className?: string
  /** Where the picture is, when not the usual place (e.g. for guests in a room). */
  src?: string | null
  /** Shown without a picture, instead of the name's first letter. */
  fallback?: ReactNode
}) {
  const [broken, setBroken] = useState(false)
  const url = src !== undefined ? src : avatarUrl(user)
  useEffect(() => setBroken(false), [url])
  const h = hue(user.username)
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold uppercase select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: `linear-gradient(145deg, oklch(0.42 0.06 ${h}), oklch(0.3 0.045 ${(h + 40) % 360}))`,
        color: `oklch(0.9 0.05 ${h})`,
      }}
    >
      {url && !broken ? (
        <img src={url} alt="" draggable={false} onError={() => setBroken(true)} className="size-full object-cover" />
      ) : (
        (fallback ?? user.username.slice(0, 1))
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full inset-ring inset-ring-glow/8" />
    </span>
  )
}

/**
 * An avatar you can change: click it or drop a picture on it, then crop.
 * `userId` is whose picture it is, when it isn't yours.
 */
export function AvatarPicker({ user, userId, size = 72 }: { user: Who; userId?: number; size?: number }) {
  const qc = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [over, setOver] = useState(false)
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['auth'] })
    void qc.invalidateQueries({ queryKey: ['users'] })
  }
  const remove = useMutation({ mutationFn: () => request(RemoveAvatar, { userId }), onSuccess: refresh, onError: toastError })
  const pick = (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toastError(new Error('That isn’t a picture.'))
    setFile(f)
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    pick(e.dataTransfer.files[0])
  }
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        aria-label="Change picture"
        className="group relative shrink-0 rounded-full outline-none"
      >
        <Avatar user={user} size={size} />
        <span
          className={`absolute inset-0 grid place-items-center rounded-full bg-shade/55 text-ink transition-opacity ${over ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}
        >
          <Camera className="size-5" />
        </span>
        {over && <span className="absolute -inset-1 rounded-full ring-2 ring-ink/60" />}
      </button>
      <div className="flex flex-col items-start gap-1">
        <Button size="sm" onClick={() => input.current?.click()}>
          <ImageUp className="size-3.5" /> {user.avatar ? 'Change picture' : 'Upload a picture'}
        </Button>
        {user.avatar && (
          <Button size="sm" variant="plain" onClick={() => remove.mutate()} disabled={remove.isPending}>
            <Trash2 className="size-3.5" /> Remove
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {file && <CropDialog file={file} userId={userId} onClose={() => setFile(null)} onSaved={refresh} />}
    </div>
  )
}

const VIEW = 256 // the crop circle on screen, in CSS pixels
const OUT = 320 // the saved picture, in pixels

function CropDialog({ file, userId, onClose, onSaved }: { file: File; userId?: number; onClose: () => void; onSaved: () => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const url = URL.createObjectURL(file)
    const i = new Image()
    i.onload = () => setImg(i)
    i.onerror = () => (toastError(new Error('That picture couldn’t be opened.')), close.current())
    i.src = url
    return () => {
      i.onload = i.onerror = null
      URL.revokeObjectURL(url)
    }
  }, [file])

  // At zoom 1 the picture just covers the circle.
  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1
  const w = (img?.naturalWidth ?? 0) * base * zoom
  const h = (img?.naturalHeight ?? 0) * base * zoom
  // Never let an edge come inside the circle.
  const clamp = (p: { x: number; y: number }, z = zoom) => {
    const mx = Math.max(0, ((img?.naturalWidth ?? 0) * base * z - VIEW) / 2)
    const my = Math.max(0, ((img?.naturalHeight ?? 0) * base * z - VIEW) / 2)
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) }
  }
  const zoomTo = (z: number) => {
    const next = Math.max(1, Math.min(5, z))
    setZoom(next)
    setPos((p) => clamp({ x: (p.x * next) / zoom, y: (p.y * next) / zoom }, next))
  }

  const onDown = (e: PointerEvent) => {
    ;(e.target as Element).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
  }
  const onMove = (e: PointerEvent) => {
    const d = drag.current
    if (d) setPos(clamp({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }))
  }
  const onWheel = (e: WheelEvent) => zoomTo(zoom * Math.exp(-e.deltaY * 0.0015))

  const save = useMutation({
    mutationFn: async () => {
      if (!img) return
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = OUT
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingQuality = 'high'
      const scale = OUT / VIEW
      ctx.drawImage(img, (VIEW / 2 - w / 2 + pos.x) * scale, (VIEW / 2 - h / 2 + pos.y) * scale, w * scale, h * scale)
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.88))
      if (!blob) throw new Error('Your browser couldn’t save the picture.')
      await request(SetAvatar, { image: blob, userId })
    },
    onSuccess: () => (onSaved(), onClose()),
    onError: toastError,
  })

  return (
    <Dialog onClose={onClose} width="max-w-sm">
      <p className="text-[15px] font-medium">Position your picture</p>
      <div className="mt-5 flex justify-center">
        <div
          className="relative touch-none overflow-hidden rounded-2xl bg-canvas"
          style={{ width: VIEW + 48, height: VIEW + 48 }}
          onWheel={onWheel}
        >
          {img && (
            <img
              src={img.src}
              alt=""
              draggable={false}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={() => (drag.current = null)}
              className="absolute max-w-none cursor-grab active:cursor-grabbing"
              style={{ width: w, height: h, left: `calc(50% - ${w / 2}px + ${pos.x}px)`, top: `calc(50% - ${h / 2}px + ${pos.y}px)` }}
            />
          )}
          {/* Everything outside the circle is dimmed; the ring shows the edge. */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 rounded-full shadow-[0_0_0_999px_color-mix(in_srgb,var(--color-media-shade)_62%,transparent),inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-media-ink)_50%,transparent)]"
            style={{ width: VIEW, height: VIEW, marginLeft: -VIEW / 2, marginTop: -VIEW / 2 }}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 px-2">
        <button aria-label="Zoom out" onClick={() => zoomTo(zoom / 1.2)} className="text-ink-3 hover:text-ink">
          <Minus className="size-4" />
        </button>
        <input
          type="range"
          min={1}
          max={5}
          step={0.01}
          value={zoom}
          onChange={(e) => zoomTo(Number(e.target.value))}
          aria-label="Zoom"
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-press accent-ink"
        />
        <button aria-label="Zoom in" onClick={() => zoomTo(zoom * 1.2)} className="text-ink-3 hover:text-ink">
          <Plus className="size-4" />
        </button>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="plain" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!img || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? 'Saving…' : 'Save picture'}
        </Button>
      </div>
    </Dialog>
  )
}
