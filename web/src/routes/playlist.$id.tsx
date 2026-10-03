// SPDX-License-Identifier: AGPL-3.0-or-later

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Globe, Lock, Play, Shuffle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ask, toastError } from '../components/feedback'
import { Empty, Page } from '../components/Page'
import { TitleSkeleton } from '../components/Skeleton'
import { Button, Input } from '../components/ui'
import { graphql } from '../gql'
import { request } from '../lib/api'
import { useTitle } from '../lib/title'
import { length } from '../music/api'
import { Mosaic, TrackList } from '../music/components'
import { music } from '../music/player'

export const Route = createFileRoute('/playlist/$id')({ component: PlaylistPage })

const PlaylistQuery = graphql(`
  query Playlist($id: Int!) {
    playlist(id: $id) {
      ...PlaylistCard
      tracks {
        ...MusicTrack
      }
    }
  }
`)

const UpdatePlaylist = graphql(`
  mutation UpdatePlaylist($id: Int!, $input: PlaylistInput!) {
    updatePlaylist(id: $id, input: $input) {
      id
    }
  }
`)

const DeletePlaylist = graphql(`
  mutation DeletePlaylist($id: Int!) {
    deletePlaylist(id: $id)
  }
`)

function PlaylistPage() {
  const id = Number(Route.useParams().id)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: list, isPending } = useQuery({ queryKey: ['music', 'playlist', id], queryFn: async () => (await request(PlaylistQuery, { id })).playlist })
  useTitle(list?.name)
  const [name, setName] = useState<string | null>(null)

  if (isPending) return <TitleSkeleton />
  if (!list) return <Page><Empty title="This playlist isn't here anymore" /></Page>

  const update = async (input: { name?: string; public?: boolean; tracks?: number[] }) => {
    try {
      await request(UpdatePlaylist, { id, input })
      await qc.invalidateQueries({ queryKey: ['music'] })
    } catch (e) {
      toastError(e)
    }
  }

  return (
    <Page>
      <div className="flex flex-col gap-8 pt-2 sm:flex-row sm:items-end md:pt-10">
        <div className="lift w-52 shrink-0 sm:w-60">
          <Mosaic covers={list.covers} size={240} />
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <p className="text-xs font-medium tracking-wide text-ink-3 uppercase">{list.public ? 'Public playlist' : 'Playlist'}</p>
          {list.mine && name !== null ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (name.trim()) void update({ name: name.trim() })
                setName(null)
              }}
            >
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(null)} className="mt-1.5 !h-14 w-full max-w-xl !text-[30px] font-semibold" />
            </form>
          ) : (
            <h1
              onClick={() => list.mine && setName(list.name)}
              className={`mt-1.5 text-[34px] leading-[1.1] font-semibold tracking-[-0.025em] md:text-[44px] ${list.mine ? 'cursor-text' : ''}`}
            >
              {list.name}
            </h1>
          )}
          <p className="mt-2.5 text-sm text-ink-2 tabular">
            {!list.mine && <span className="font-medium text-ink">{list.owner.username} · </span>}
            {list.trackCount} song{list.trackCount === 1 ? '' : 's'}, {length(list.duration)}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button variant="primary" size="lg" disabled={!list.tracks.length} onClick={() => music.play(list.tracks)}>
              <Play className="size-4.5 fill-current" /> Play
            </Button>
            <Button size="lg" disabled={!list.tracks.length} onClick={() => music.play(list.tracks, 0, true)}>
              <Shuffle className="size-4.5" /> Shuffle
            </Button>
            {list.mine && (
              <>
                <Button size="lg" variant="plain" onClick={() => update({ public: !list.public })}>
                  {list.public ? <Globe className="size-4.5" /> : <Lock className="size-4.5" />}
                  {list.public ? 'Everyone here sees it' : 'Only you see it'}
                </Button>
                <Button
                  size="lg"
                  variant="danger"
                  onClick={async () => {
                    if (!(await ask({ title: `Delete “${list.name}”?`, body: 'The songs stay; only the list goes.', confirm: 'Delete', danger: true }))) return
                    await request(DeletePlaylist, { id }).catch(toastError)
                    void qc.invalidateQueries({ queryKey: ['music'] })
                    void navigate({ to: '/' })
                  }}
                >
                  <Trash2 className="size-4.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mt-10">
        {list.tracks.length ? (
          <TrackList tracks={list.tracks} showAlbum onRemove={list.mine ? (i) => void update({ tracks: list.tracks.filter((_, j) => j !== i).map((t) => t.id) }) : undefined} />
        ) : (
          <Empty title="Nothing in here yet">Add songs from any album or list with their ••• menu.</Empty>
        )}
      </div>
    </Page>
  )
}
