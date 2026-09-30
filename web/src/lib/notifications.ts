// SPDX-License-Identifier: AGPL-3.0-or-later
// Someone's notifications: the inbox, live arrivals, and which ones belong in the pill.

import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { graphql } from '../gql'
import type { InboxFieldsFragment } from '../gql/graphql'
import { type Notice, request } from './api'
import { notifyEnabled } from './notify'

export type { Notice, NotificationKind as NoticeKind } from './api'

export type Inbox = InboxFieldsFragment

graphql(`
  fragment InboxFields on Inbox {
    items {
      ...NotificationFields
    }
    unread
  }
`)

const InboxQuery = graphql(`
  query Inbox {
    notifications {
      ...InboxFields
    }
  }
`)

const MarkRead = graphql(`
  mutation MarkNotificationsRead($ids: [Int!]) {
    markNotificationsRead(ids: $ids) {
      ...InboxFields
    }
  }
`)

const Delete = graphql(`
  mutation DeleteNotifications($id: Int) {
    deleteNotifications(id: $id) {
      ...InboxFields
    }
  }
`)

const KEY = ['notifications']

/** Priority notices older than this have stopped being news. */
const PILL_WINDOW = 24 * 3600

export function useInbox(enabled = true) {
  return useQuery({ queryKey: KEY, queryFn: async () => (await request(InboxQuery)).notifications, enabled, staleTime: 60_000 })
}

/** What belongs in the pill, newest first. */
export function pillNotices(inbox: Inbox | undefined, now = Date.now() / 1000) {
  return (inbox?.items ?? []).filter(
    (n) => n.priority && n.readAt == null && now - n.createdAt < PILL_WINDOW && (n.expiresAt == null || n.expiresAt > now),
  )
}

/** Marks some (or, without ids, all) as read, straight away on screen. */
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids?: number[]) => request(MarkRead, { ids }),
    onMutate: (ids) => {
      const now = Math.floor(Date.now() / 1000)
      qc.setQueryData<Inbox>(KEY, (inbox) => {
        if (!inbox) return inbox
        const items = inbox.items.map((n) => (n.readAt == null && (!ids || ids.includes(n.id)) ? { ...n, readAt: now } : n))
        return { items, unread: ids ? Math.max(0, inbox.unread - inbox.items.filter((n) => n.readAt == null && ids.includes(n.id)).length) : 0 }
      })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRemove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number | 'all') => request(Delete, { id: id === 'all' ? null : id }),
    onMutate: (id) =>
      qc.setQueryData<Inbox>(KEY, (inbox) => {
        if (!inbox || id === 'all') return { items: [], unread: 0 }
        const gone = inbox.items.find((n) => n.id === id)
        return { items: inbox.items.filter((n) => n.id !== id), unread: inbox.unread - (gone && gone.readAt == null ? 1 : 0) }
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
type Listener = (n: Notice) => void
const listeners = new Set<Listener>()

/** Hears about each notification the moment it arrives. */
export function onArrival(l: Listener) {
  listeners.add(l)
  return () => void listeners.delete(l)
}

/** A notification from the server: into the inbox, to the pill, and to the OS when the tab is hidden. */
export function receive(qc: QueryClient, n: Notice) {
  qc.setQueryData<Inbox>(KEY, (inbox) => {
    if (!inbox || inbox.items.some((x) => x.id === n.id)) return inbox
    // An invitation to the same room again replaces the first one.
    const replaced = (x: Notice) => n.kind === 'INVITE' && x.kind === 'INVITE' && x.link === n.link && x.readAt == null
    const gone = inbox.items.filter(replaced).length
    return { items: [n, ...inbox.items.filter((x) => !replaced(x))], unread: inbox.unread + 1 - gone }
  })
  if (!qc.getQueryData(KEY)) refresh(qc)
  listeners.forEach((l) => l(n))
  if (n.priority && document.hidden && notifyEnabled()) {
    const os = new Notification(n.title, { body: n.body ?? undefined, icon: n.image ?? '/favicon.svg', tag: `tinystream-${n.id}` })
    os.onclick = () => {
      window.focus()
      void request(MarkRead, { ids: [n.id] })
      if (n.link) location.href = n.link
    }
  }
}

export function refresh(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: KEY })
}
