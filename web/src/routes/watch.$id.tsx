// SPDX-License-Identifier: AGPL-3.0-or-later

import { createFileRoute } from '@tanstack/react-router'
import { preload } from '../lib/refreshing'
import { Player } from '../player/Player'

export const Route = createFileRoute('/watch/$id')({
  // `clip` opens the clip editor on one of your clips.
  validateSearch: (s: Record<string, unknown>): { clip?: number } => ({ clip: s.clip ? Number(s.clip) : undefined }),
  // The still the player opens on is decoded before the page changes, so the
  // one that was clicked grows into it rather than into black.
  loader: ({ params }) => {
    if (typeof window !== 'undefined') return preload([`/api/images/media/${params.id}`], 600)
  },
  component: Watch,
})

function Watch() {
  const { id } = Route.useParams()
  const { clip } = Route.useSearch()
  // Keyed so moving to the next episode starts from a clean player.
  return <Player key={id} mediaId={Number(id)} editClip={clip} />
}
