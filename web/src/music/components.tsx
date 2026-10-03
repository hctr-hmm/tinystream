// SPDX-License-Identifier: AGPL-3.0-or-later

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Disc3, Ellipsis, ListEnd, ListPlus, ListStart, Music2, Pause, Play, Plus, Star, User, X } from 'lucide-react'
import { type CSSProperties, type ReactNode, useState } from 'react'
import { morphFrom } from '../components/Poster'
import { Squircle } from '../components/Squircle'
import { toast, toastError } from '../components/feedback'
import { Img } from '../components/Img'
import { Badge, Dialog, Button, Input, Panel, Popover } from '../components/ui'
import { graphql } from '../gql'
import { request } from '../lib/api'
import { useTilt } from '../lib/tilt'
import { AlbumTracks, type AlbumCard, type ArtistCard, type MusicTrack, Star as StarMutation, cover, duration, hiRes, quality } from './api'
import { current, music, usePlayer } from './player'

/** Artwork, or a quiet note when there's none. */
export function Cover({ src, size, className = '', round = false, morph }: { src: string | null | undefined; size: number; className?: string; round?: boolean; morph?: boolean }) {
  const [broken, setBroken] = useState(false)
  const inner = src && !broken ? (
    <Img src={cover(src, size)} loading="lazy" decoding="async" onError={() => setBroken(true)} className="size-full object-cover" />
  ) : (
    <div className="grid size-full place-items-center bg-gradient-to-br from-panel to-float text-ink-3">
      <Music2 style={{ width: size / 4, height: size / 4 }} />
    </div>
  )
  if (round) return <div className={`overflow-hidden rounded-full bg-raised ${className}`} data-morph={morph || undefined}>{inner}</div>
  return (
    <Squircle radius={Math.max(6, Math.round(size / 14))} edge className={`bg-raised ${className}`} data-morph={morph || undefined}>
      {inner}
    </Squircle>
  )
}

/** Three little bars that dance while it plays. */
export function Playing({ paused, className = '' }: { paused: boolean; className?: string }) {
  return (
    <span aria-label="Playing" className={`inline-flex h-3 items-end gap-[2px] ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom rounded-full bg-current"
          style={{ height: '100%', animation: `eq 900ms ${i * -260}ms ease-in-out infinite alternate`, animationPlayState: paused ? 'paused' : 'running' } as CSSProperties}
        />
      ))}
    </span>
  )
}

export async function albumTracks(id: number): Promise<MusicTrack[]> {
  return (await request(AlbumTracks, { id })).album?.tracks ?? []
}

export async function playAlbum(id: number, shuffle = false, from = 0) {
  try {
    await music.play(await albumTracks(id), from, shuffle)
  } catch (e) {
    toastError(e)
  }
}

export function AlbumTile({ album, caption }: { album: AlbumCard; caption?: ReactNode }) {
  const tilt = useTilt<HTMLDivElement>()
  const playingHere = usePlayer((s) => current(s)?.track.albumId === album.id)
  const playing = usePlayer((s) => s.playing)
  return (
    <div className="group relative min-w-0" {...tilt.handlers}>
      <Link to="/album/$id" params={{ id: String(album.id) }} viewTransition onClick={(e) => morphFrom(e, 'cover')} className="block outline-none" aria-label={album.name}>
        <div className="rounded-[15px] transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
          <div ref={tilt.ref} className="tilt">
            <Cover src={album.cover} size={200} className="aspect-square" morph />
            <div className="glare pointer-events-none" />
          </div>
        </div>
        <p className="mt-2 truncate text-[13px] font-medium text-ink">{album.name}</p>
      </Link>
      <p className="truncate text-xs text-ink-3">{caption ?? album.artist}</p>
      <button
        aria-label={playingHere && playing ? 'Pause' : `Play ${album.name}`}
        onClick={() => (playingHere ? music.toggle() : playAlbum(album.id))}
        className={`absolute top-[calc(100%-4.6rem)] right-2.5 grid size-10 place-items-center rounded-full bg-accent text-on-accent shadow-lg transition-[opacity,translate,scale] duration-200 ease-out hover:scale-105 active:scale-95 ${playingHere ? 'opacity-100' : 'translate-y-1.5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
      >
        {playingHere && playing ? <Pause className="size-4.5 fill-current" /> : <Play className="ml-0.5 size-4.5 fill-current" />}
      </button>
    </div>
  )
}

export function AlbumGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-5 gap-y-7">{children}</div>
}

export function ArtistTile({ artist }: { artist: ArtistCard }) {
  return (
    <Link to="/artist/$id" params={{ id: String(artist.id) }} className="group block min-w-0 text-center outline-none">
      <div className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
        <Cover src={artist.cover} size={180} round className="mx-auto aspect-square w-full shadow-[0_8px_24px_-12px_var(--color-shade)]" />
      </div>
      <p className="mt-2.5 truncate text-[13px] font-medium">{artist.name}</p>
      <p className="truncate text-xs text-ink-3 tabular">
        {artist.albumCount} album{artist.albumCount === 1 ? '' : 's'}
      </p>
    </Link>
  )
}

export function QualityBadge({ track }: { track: Pick<MusicTrack, 'codec' | 'lossless' | 'bitDepth' | 'sampleRate' | 'bitrate'> }) {
  return (
    <Badge tone={hiRes(track) ? 'warn' : 'quiet'} title={hiRes(track) ? 'Hi-res' : track.lossless ? 'Lossless' : undefined}>
      {quality(track)}
    </Badge>
  )
}

export function StarButton({ kind, id, starred, className = '' }: { kind: 'TRACK' | 'ALBUM' | 'ARTIST'; id: number; starred: boolean; className?: string }) {
  const qc = useQueryClient()
  const [on, setOn] = useState(starred)
  const [seen, setSeen] = useState(starred)
  if (seen !== starred) {
    setSeen(starred)
    setOn(starred)
  }
  return (
    <button
      aria-label={on ? 'Unstar' : 'Star'}
      aria-pressed={on}
      onClick={async (e) => {
        e.stopPropagation()
        setOn(!on)
        try {
          await request(StarMutation, { kind, id, starred: !on })
          void qc.invalidateQueries({ queryKey: ['music'] })
        } catch (err) {
          setOn(on)
          toastError(err)
        }
      }}
      className={`grid size-8 place-items-center rounded-full transition-[color,scale] active:scale-90 ${on ? 'text-warn' : 'text-ink-3 hover:text-ink'} ${className}`}
    >
      <Star className={`size-4 transition-transform ${on ? 'scale-110 fill-current' : ''}`} />
    </button>
  )
}

const PlaylistsQuery = graphql(`
  query PlaylistNames {
    playlists {
      id
      name
      mine
    }
  }
`)

const AddToPlaylist = graphql(`
  mutation AddToPlaylist($id: Int!, $tracks: [Int!]!) {
    addToPlaylist(id: $id, tracks: $tracks) {
      id
      name
    }
  }
`)

const CreatePlaylist = graphql(`
  mutation CreatePlaylist($name: String!, $tracks: [Int!]!) {
    createPlaylist(name: $name, tracks: $tracks) {
      id
      name
    }
  }
`)

export function NewPlaylist({ tracks, onClose }: { tracks: number[]; onClose: () => void }) {
  const [name, setName] = useState('')
  const qc = useQueryClient()
  const navigate = useNavigate()
  const create = async () => {
    try {
      const { createPlaylist: p } = await request(CreatePlaylist, { name, tracks })
      void qc.invalidateQueries({ queryKey: ['music'] })
      onClose()
      if (tracks.length) toast({ title: `Made “${p.name}”`, tone: 'ok' })
      else void navigate({ to: '/playlist/$id', params: { id: String(p.id) } })
    } catch (e) {
      toastError(e)
    }
  }
  return (
    <Dialog onClose={onClose} width="max-w-sm">
      <p className="text-[15px] font-medium">New playlist</p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
      >
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="flex-1" />
        <Button variant="primary" disabled={!name.trim()}>
          Create
        </Button>
      </form>
    </Dialog>
  )
}

/** What can be done with some tracks: queue them, keep them, go to where they're from. */
export function TrackMenu({ tracks, trigger, album = true }: { tracks: MusicTrack[]; trigger?: ReactNode; album?: boolean }) {
  const [making, setMaking] = useState(false)
  const [lists, setLists] = useState(false)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data } = useQuery({ queryKey: ['music', 'playlist-names'], queryFn: () => request(PlaylistsQuery), enabled: lists })
  const one = tracks.length === 1 ? tracks[0] : null
  const add = async (id: number, name: string) => {
    try {
      await request(AddToPlaylist, { id, tracks: tracks.map((t) => t.id) })
      void qc.invalidateQueries({ queryKey: ['music'] })
      toast({ title: `Added to “${name}”`, tone: 'ok' })
    } catch (e) {
      toastError(e)
    }
  }
  const row = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-2 transition-colors hover:bg-hover hover:text-ink [&>svg]:size-4 [&>svg]:shrink-0'
  return (
    <>
      <Popover
        portal
        onOpenChange={(o) => !o && setLists(false)}
        trigger={({ toggle }) => (
          <button
            aria-label="More"
            onClick={(e) => {
              e.stopPropagation()
              toggle()
            }}
            className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-hover hover:text-ink"
          >
            {trigger ?? <Ellipsis className="size-4" />}
          </button>
        )}
      >
        {(close) => (
          <Panel className="w-56 p-1.5">
            {lists ? (
              <div className="max-h-72 overflow-y-auto">
                <button className={row} onClick={() => (close(), setMaking(true))}>
                  <Plus /> New playlist…
                </button>
                {data?.playlists
                  .filter((p) => p.mine)
                  .map((p) => (
                    <button key={p.id} className={row} onClick={() => (close(), void add(p.id, p.name))}>
                      <ListPlus /> <span className="truncate">{p.name}</span>
                    </button>
                  ))}
              </div>
            ) : (
              <>
                <button className={row} onClick={() => (close(), music.playNext(tracks))}>
                  <ListStart /> Play next
                </button>
                <button className={row} onClick={() => (close(), music.add(tracks))}>
                  <ListEnd /> Add to queue
                </button>
                <button className={row} onClick={() => setLists(true)}>
                  <ListPlus /> Add to playlist
                </button>
                {one && album && one.albumId != null && (
                  <button className={row} onClick={() => (close(), void navigate({ to: '/album/$id', params: { id: String(one.albumId) } }))}>
                    <Disc3 /> Go to album
                  </button>
                )}
                {one?.artists.slice(0, 3).map((a) => (
                  <button key={a.id} className={row} onClick={() => (close(), void navigate({ to: '/artist/$id', params: { id: String(a.id) } }))}>
                    <User /> <span className="truncate">{a.name}</span>
                  </button>
                ))}
              </>
            )}
          </Panel>
        )}
      </Popover>
      {making && <NewPlaylist tracks={tracks.map((t) => t.id)} onClose={() => setMaking(false)} />}
    </>
  )
}

/** Artists as links, the way they were credited. */
export function Artists({ track, className = '' }: { track: Pick<MusicTrack, 'artist' | 'artists'>; className?: string }) {
  if (track.artists.length <= 1) {
    const a = track.artists[0]
    return a ? (
      <Link to="/artist/$id" params={{ id: String(a.id) }} onClick={(e) => e.stopPropagation()} className={`hover:text-ink hover:underline ${className}`}>
        {track.artist || a.name}
      </Link>
    ) : (
      <span className={className}>{track.artist}</span>
    )
  }
  return (
    <span className={className}>
      {track.artists.map((a, i) => (
        <span key={a.id}>
          {i > 0 && ', '}
          <Link to="/artist/$id" params={{ id: String(a.id) }} onClick={(e) => e.stopPropagation()} className="hover:text-ink hover:underline">
            {a.name}
          </Link>
        </span>
      ))}
    </span>
  )
}

/**
 * Tracks, one per row. Clicking one plays the list from there; `numbers`
 * shows track numbers (albums) instead of covers (everything else).
 */
export function TrackList({ tracks, numbers = false, showAlbum = false, discs = false, discTitles = [], onRemove }: {
  tracks: MusicTrack[]
  numbers?: boolean
  showAlbum?: boolean
  discs?: boolean
  discTitles?: { disc: number; title: string }[]
  /** Takes the track at that place out of the list (a playlist of yours). */
  onRemove?: (index: number) => void
}) {
  const now = usePlayer((s) => current(s)?.track.id ?? null)
  const paused = usePlayer((s) => !s.playing)
  const multiDisc = discs && new Set(tracks.map((t) => t.disc ?? 1)).size > 1
  return (
    <div role="list" className="-mx-2">
      {tracks.map((t, i) => {
        const disc = t.disc ?? 1
        const header = multiDisc && (i === 0 || (tracks[i - 1].disc ?? 1) !== disc)
        const here = now === t.id
        return (
          <div key={`${t.id}-${i}`}>
            {header && (
              <p className="mt-5 mb-1.5 flex items-center gap-2 px-2 text-xs font-medium text-ink-3 first:mt-0">
                <Disc3 className="size-3.5" /> Disc {disc}
                {discTitles.find((d) => d.disc === disc)?.title && <span className="text-ink-2">· {discTitles.find((d) => d.disc === disc)!.title}</span>}
              </p>
            )}
            <div
              role="listitem"
              onClick={() => (here ? music.toggle() : music.play(tracks, i))}
              className={`group flex h-12 cursor-default items-center gap-3 rounded-[10px] px-2 transition-colors hover:bg-hover ${here ? 'text-ink' : ''}`}
            >
              <span className="grid w-8 shrink-0 place-items-center text-[13px] text-ink-3 tabular">
                {numbers ? (
                  here ? (
                    <Playing paused={paused} className="text-ink" />
                  ) : (
                    <>
                      <span className="group-hover:hidden">{t.number ?? i + 1}</span>
                      <Play className="hidden size-3.5 fill-current text-ink group-hover:block" />
                    </>
                  )
                ) : (
                  <span className="relative">
                    <Cover src={t.cover} size={32} className="size-8" />
                    {here && (
                      <span className="absolute inset-0 grid place-items-center rounded-md bg-media-shade/55 text-media-ink">
                        <Playing paused={paused} />
                      </span>
                    )}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm ${here ? 'font-medium' : ''}`}>{t.title}</span>
                <span className="block truncate text-xs text-ink-3">
                  <Artists track={t} />
                  {showAlbum && (
                    <>
                      {' · '}
                      <Link to="/album/$id" params={{ id: String(t.albumId) }} onClick={(e) => e.stopPropagation()} className="hover:text-ink hover:underline">
                        {t.album}
                      </Link>
                    </>
                  )}
                </span>
              </span>
              <span className="hidden opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                <QualityBadge track={t} />
              </span>
              <span onClick={(e) => e.stopPropagation()} className={`transition-opacity ${t.starred ? '' : 'opacity-0 group-hover:opacity-100'}`}>
                <StarButton kind="TRACK" id={t.id} starred={t.starred} />
              </span>
              <span className="w-11 shrink-0 text-right text-[13px] text-ink-3 tabular">{duration(t.duration)}</span>
              <span onClick={(e) => e.stopPropagation()} className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <TrackMenu tracks={[t]} album={!numbers} />
              </span>
              {onRemove && (
                <button
                  aria-label="Remove from the playlist"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(i)
                  }}
                  className="grid size-8 place-items-center rounded-full text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Up to four covers in a square, or one when that's all there is. */
export function Mosaic({ covers, size }: { covers: string[]; size: number }) {
  if (covers.length < 4) return <Cover src={covers[0]} size={size} className="aspect-square w-full" />
  return (
    <Squircle radius={Math.round(size / 14)} edge className="grid aspect-square w-full grid-cols-2 bg-raised">
      {covers.slice(0, 4).map((c) => (
        <img key={c} src={`${c}?size=${Math.round(size)}`} alt="" className="size-full object-cover" />
      ))}
    </Squircle>
  )
}
