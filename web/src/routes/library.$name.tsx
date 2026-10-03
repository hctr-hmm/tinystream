// SPDX-License-Identifier: AGPL-3.0-or-later

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Empty, Page, PageTitle } from '../components/Page'
import { Poster } from '../components/Poster'
import { PosterGrid } from '../components/PosterGrid'
import { PosterGridSkeleton } from '../components/Skeleton'
import { Squircle } from '../components/Squircle'
import { graphql } from '../gql'
import { type Card, librariesQuery, request } from '../lib/api'
import { MusicLibrary } from '../music/Library'
import { useTitle } from '../lib/title'

export const Route = createFileRoute('/library/$name')({ component: LibraryPage })

const LibraryQuery = graphql(`
  query Library($name: String!) {
    library(name: $name) {
      titles {
        ...Card
      }
    }
  }
`)

type Filter = 'all' | 'unwatched' | 'watching' | 'watched'
type Sort = 'title' | 'year'

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'watching', label: 'Watching' },
  { value: 'unwatched', label: 'Not started' },
  { value: 'watched', label: 'Watched' },
]

function matches(c: Card, f: Filter) {
  const done = c.videoCount > 0 && c.watchedCount >= c.videoCount
  const started = c.watchedCount > 0 || c.progress !== null
  if (f === 'watched') return done
  if (f === 'watching') return started && !done
  if (f === 'unwatched') return !started
  return true
}

function LibraryPage() {
  const { name } = Route.useParams()
  const { data: libraries } = useQuery(librariesQuery)
  const lib = libraries?.find((l) => l.name === name)
  useTitle(name)
  if (lib?.kind === 'MUSIC') return <MusicLibrary key={name} name={name} albums={lib.albumCount} tracks={lib.trackCount} />
  return <VideoLibrary name={name} />
}

function VideoLibrary({ name }: { name: string }) {
  const { data } = useQuery({ queryKey: ['library', name], queryFn: async () => (await request(LibraryQuery, { name })).library?.titles ?? [] })
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('title')

  const cards = useMemo(() => {
    const list = (data ?? []).filter((c) => matches(c, filter))
    if (sort === 'year') list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    return list
  }, [data, filter, sort])

  return (
    <Page>
      <PageTitle
        aside={
          data && <span className="pb-1 text-sm text-ink-3 tabular">{data.length} title{data.length === 1 ? "" : "s"}</span>
        }
      >
        {name}
      </PageTitle>
      <div className="mb-7 flex flex-wrap items-center gap-1">
        {filters.map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
        <div className="flex-1" />
        <Chip active={sort === 'title'} onClick={() => setSort('title')}>
          A–Z
        </Chip>
        <Chip active={sort === 'year'} onClick={() => setSort('year')}>
          Newest
        </Chip>
      </div>
      {data && cards.length === 0 && (
        <Empty title={data.length ? 'Nothing matches this filter' : 'This library is empty'} />
      )}
      {data ? (
        <PosterGrid>
          {cards.map((c) => (
            <Poster key={c.id} card={c} />
          ))}
        </PosterGrid>
      ) : (
        <PosterGridSkeleton />
      )}
    </Page>
  )
}

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
