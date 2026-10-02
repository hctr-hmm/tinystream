// SPDX-License-Identifier: AGPL-3.0-or-later

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Login } from '../components/Login'
import { Spinner } from '../components/ui'
import { ApiError, request } from '../lib/api'
import { useMe } from '../lib/hooks'
import { Player } from '../player/Player'
import { type RoomContext, RoomInfoQuery, guestName, useSync } from '../player/Room'
import { SyncClient } from '../player/sync'

export const Route = createFileRoute('/together/$code')({ component: Together })

/** A watch-together room. Works without an account when the link is public. */
function Together() {
  const { code } = Route.useParams()
  const me = useMe()
  const { data: info, error } = useQuery({
    // Signing in can change what we may do here.
    queryKey: ['room', code, me?.id ?? null],
    queryFn: async () => (await request(RoomInfoQuery, { code })).room,
    retry: false,
    staleTime: Infinity,
  })
  const [client] = useState(() => new SyncClient(code, guestName))
  useEffect(() => {
    if (!info) return
    client.connect()
    return () => client.close()
  }, [client, info])
  const ctx = useMemo<RoomContext | null>(() => (info ? { client, info } : null), [client, info])

  if (error) {
    const code = error instanceof ApiError ? error.code : ''
    if (code === 'UNAUTHENTICATED') return <Login setup={false} />
    return <Gone message={code === 'NOT_FOUND' ? 'This room has ended, or the link isn’t right.' : error.message} signedIn={!!me} />
  }
  if (!info || !ctx) return <Arriving />
  return <Room ctx={ctx} />
}

function Room({ ctx }: { ctx: RoomContext }) {
  const snap = useSync(ctx.client)
  const stillHere = snap.ended && ctx.info.isHost && snap.room
  if (snap.ended && !stillHere) return <Gone message="Whoever started this room has ended it." signedIn={ctx.info.signedIn} />
  if (!snap.room) return <Arriving backdrop={ctx.info.title.backdrop ?? undefined} title={ctx.info.title.name} />
  // Keyed so each episode starts from a clean player; the room carries on.
  // When the host ends it, the same player just carries on alone, right where
  // it was, rather than being thrown out of what they're watching.
  return <Player key={snap.room.mediaId} mediaId={snap.room.mediaId} room={snap.ended ? undefined : ctx} />
}

function Arriving({ backdrop, title }: { backdrop?: string; title?: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="fixed inset-0 grid place-items-center bg-media-shade text-media-ink/80">
      {backdrop && !broken && (
        <img src={backdrop} alt="" onError={() => setBroken(true)} className="absolute inset-0 size-full object-cover opacity-25 blur-sm" />
      )}
      <div className="relative flex flex-col items-center gap-4">
        <Spinner className="size-9" />
        {title && <p className="text-[15px] text-media-ink/70">Joining {title}…</p>}
      </div>
    </div>
  )
}

function Gone({ message, signedIn }: { message: string; signedIn: boolean }) {
  const navigate = useNavigate()
  return (
    <div className="fixed inset-0 grid place-items-center bg-media-shade p-6">
      <div className="max-w-sm text-center">
        <p className="text-[22px] font-semibold tracking-tight text-media-ink">Nothing playing here</p>
        <p className="mt-2 text-[15px] leading-relaxed text-media-ink/60">{message}</p>
        {signedIn && (
          <button
            onClick={() => void navigate({ to: '/' })}
            className="mt-6 inline-flex h-11 items-center rounded-[14px] bg-media-ink px-5 text-[15px] font-medium text-media-shade hover:bg-media-ink/90"
          >
            Go home
          </button>
        )}
      </div>
    </div>
  )
}
