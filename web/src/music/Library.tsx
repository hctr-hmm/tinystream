// SPDX-License-Identifier: AGPL-3.0-or-later
// A music library: its albums, artists, songs and everyone's playlists.

import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Empty, Page, PageTitle } from '../components/Page'
import { PosterGridSkeleton } from '../components/Skeleton'
import { Squircle } from '../components/Squircle'
import { Segmented, Swap } from '../components/ui'
import { graphql } from '../gql'
import type { AlbumSort } from '../gql/graphql'
import { request } from '../lib/api'
import { length } from './api'
import { AlbumGrid, AlbumTile, ArtistTile, Mosaic, NewPlaylist, TrackList } from './components'

const AlbumsQuery = graphql(`
  query LibraryAlbums($library: String!, $sort: AlbumSort!) {
    albums(library: $library, sort: $sort, limit: 5000) {
      ...AlbumCard
    }
  }
`)

const ArtistsQuery = graphql(`
  query LibraryArtists($library: String!) {
    artists(library: $library) {
      ...ArtistCard
    }
  }
`)

const SongsQuery = graphql(`
  query LibrarySongs($library: String!, $query: String!) {
    songs(library: $library, query: $query, limit: 300) {
      ...MusicTrack
    }
  }
`)

export const PlaylistsQuery = graphql(`
  query Playlists {
    playlists {
      ...PlaylistCard
    }
  }
`)

type Tab = 'albums' | 'artists' | 'songs' | 'playlists'
const TABS: Tab[] = ['albums', 'artists', 'songs', 'playlists']

const SORTS: { value: AlbumSort; label: string }[] = [
  { value: 'NAME', label: 'A–Z' },
  { value: 'ARTIST', label: 'Artist' },
  { value: 'NEWEST', label: 'Added' },
  { value: 'YEAR', label: 'Year' },
  { value: 'RECENT', label: 'Played' },
]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Squircle
      as="button"
      radius={9}
      onClick={onClick}
      aria-pressed={active}
      className={`h-7.5 px-3 text-[13px] transition-colors ${active ? 'bg-press text-ink' : 'text-ink-2 hover:bg-hover hover:text-ink'}`}
    >
      {children}
    </Squircle>
  )
}

function Albums({ library }: { library: string }) {
  const [sort, setSort] = useState<AlbumSort>('NAME')
  const { data } = useQuery({
    queryKey: ['music', 'albums', library, sort],
    queryFn: async () => (await request(AlbumsQuery, { library, sort })).albums,
    placeholderData: (prev) => prev,
  })
  return (
    <>
      <div className="mb-7 flex flex-wrap items-center gap-1">
        {SORTS.map((s) => (
          <Chip key={s.value} active={sort === s.value} onClick={() => setSort(s.value)}>
            {s.label}
          </Chip>
        ))}
      </div>
      {!data ? (
        <PosterGridSkeleton />
      ) : data.length === 0 ? (
        <Empty title={sort === 'RECENT' ? "You haven't played anything here yet" : 'No albums here yet'} />
      ) : (
        <AlbumGrid>
          {data.map((a) => (
            <AlbumTile key={a.id} album={a} caption={sort === 'YEAR' ? `${a.artist}${a.year ? ` · ${a.year}` : ''}` : undefined} />
          ))}
        </AlbumGrid>
      )}
    </>
  )
}

function Artists({ library }: { library: string }) {
  const { data } = useQuery({ queryKey: ['music', 'artists', library], queryFn: async () => (await request(ArtistsQuery, { library })).artists })
  if (!data) return <PosterGridSkeleton />
  if (!data.length) return <Empty title="No artists here yet" />
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-5 gap-y-7">
      {data.map((a) => (
        <ArtistTile key={a.id} artist={a} />
      ))}
    </div>
  )
}

function Songs({ library }: { library: string }) {
  const [q, setQ] = useState('')
  const query = useDeferredValue(q)
  const { data } = useQuery({
    queryKey: ['music', 'songs', library, query],
    queryFn: async () => (await request(SongsQuery, { library, query })).songs,
    placeholderData: (prev) => prev,
  })
  return (
    <>
      <Squircle radius={10} edge className="mb-5 flex h-9 max-w-md items-center gap-2.5 bg-panel px-3">
        <Search className="size-4 text-ink-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a song" className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3" />
      </Squircle>
      {data && data.length === 0 ? <Empty title={query ? `Nothing called “${query}”` : 'No songs here yet'} /> : <TrackList tracks={data ?? []} showAlbum />}
    </>
  )
}

export function Playlists() {
  const [making, setMaking] = useState(false)
  const { data } = useQuery({ queryKey: ['music', 'playlists'], queryFn: async () => (await request(PlaylistsQuery)).playlists })
  return (
    <AlbumGrid>
      <button onClick={() => setMaking(true)} className="group min-w-0 text-left outline-none">
        <Squircle radius={14} className="grid aspect-square place-items-center border border-dashed border-line-strong text-ink-3 transition-colors group-hover:border-ink-3 group-hover:text-ink">
          <Plus className="size-8" />
        </Squircle>
        <p className="mt-2 text-[13px] font-medium">New playlist</p>
      </button>
      {data?.map((p) => (
        <Link key={p.id} to="/playlist/$id" params={{ id: String(p.id) }} className="group block min-w-0 outline-none">
          <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
            <Mosaic covers={p.covers} size={200} />
          </div>
          <p className="mt-2 truncate text-[13px] font-medium">{p.name}</p>
          <p className="truncate text-xs text-ink-3 tabular">
            {p.mine ? '' : `${p.owner.username} · `}
            {p.trackCount} songs{p.trackCount ? `, ${length(p.duration)}` : ''}
          </p>
        </Link>
      ))}
      {making && <NewPlaylist tracks={[]} onClose={() => setMaking(false)} />}
    </AlbumGrid>
  )
}

export function MusicLibrary({ name, albums, tracks }: { name: string; albums: number; tracks: number }) {
  const [tab, setTab] = useState<Tab>('albums')
  return (
    <Page>
      <PageTitle aside={<span className="pb-1 text-sm text-ink-3 tabular">{albums} albums · {tracks} songs</span>}>{name}</PageTitle>
      <div className="mb-6">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'albums', label: 'Albums' },
            { value: 'artists', label: 'Artists' },
            { value: 'songs', label: 'Songs' },
            { value: 'playlists', label: 'Playlists' },
          ]}
        />
      </div>
      <Swap value={tab} order={TABS}>
        {tab === 'albums' && <Albums library={name} />}
        {tab === 'artists' && <Artists library={name} />}
        {tab === 'songs' && <Songs library={name} />}
        {tab === 'playlists' && <Playlists />}
      </Swap>
    </Page>
  )
}
