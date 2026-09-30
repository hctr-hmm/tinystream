// SPDX-License-Identifier: AGPL-3.0-or-later

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Check, Plus, X } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { toast, toastError } from '../components/feedback'
import { Empty, Page, PageTitle, Section } from '../components/Page'
import { ListSkeleton, useArrived } from '../components/Skeleton'
import { Squircle } from '../components/Squircle'
import { Badge, Button, Progress } from '../components/ui'
import { graphql } from '../gql'
import type { RequestsQuery } from '../gql/graphql'
import { request } from '../lib/api'
import { relative } from '../lib/downloads'
import { useMe } from '../lib/hooks'
import { useTitle } from '../lib/title'
import { Img } from '../components/Img'

export const Route = createFileRoute('/requests')({ component: RequestsPage })

const RequestsQueryDoc = graphql(`
  query Requests {
    requests {
      id
      user {
        ...Person
      }
      name
      year
      poster
      library
      state
      title {
        id
      }
      note
      createdAt
      have
      aired
    }
  }
`)

const Approve = graphql(`
  mutation ApproveRequest($id: Int!) {
    approveRequest(id: $id) {
      id
    }
  }
`)

const Decline = graphql(`
  mutation DeclineRequest($id: Int!) {
    declineRequest(id: $id) {
      id
    }
  }
`)

const Delete = graphql(`
  mutation DeleteRequest($id: Int!) {
    deleteRequest(id: $id)
  }
`)

type MediaRequest = RequestsQuery['requests'][number]

function RequestsPage() {
  const me = useMe()
  useTitle('Requests')
  const { data } = useQuery({ queryKey: ['requests'], queryFn: async () => (await request(RequestsQueryDoc)).requests, refetchInterval: 15_000 })
  const arrived = useArrived(!!data)
  if (!data) return <ListSkeleton rows={3} />
  const pending = data?.filter((r) => r.state === 'PENDING') ?? []
  const decided = data?.filter((r) => r.state !== 'PENDING') ?? []
  return (
    <Page arrive={arrived}>
      <PageTitle
        aside={
          <Link to="/discover" className="pb-0.5">
            <Button variant="primary">
              <Plus className="size-4" /> {me?.permissions.manageShows ? 'Add a show' : 'Request a show'}
            </Button>
          </Link>
        }
      >
        Requests
      </PageTitle>
      {data?.length === 0 && (
        <Empty title="No requests yet" />
      )}
      {pending.length > 0 && (
        <Section title={me?.permissions.manageRequests ? 'Waiting for you' : 'Waiting for approval'}>
          <div className="space-y-2">
            {pending.map((r) => (
              <RequestRow key={r.id} r={r} />
            ))}
          </div>
        </Section>
      )}
      {decided.length > 0 && (
        <Section title="Earlier">
          <div className="space-y-2">
            {decided.map((r) => (
              <RequestRow key={r.id} r={r} />
            ))}
          </div>
        </Section>
      )}
    </Page>
  )
}

function RequestRow({ r }: { r: MediaRequest }) {
  const me = useMe()
  const manage = !!me?.permissions.manageRequests
  const qc = useQueryClient()
  const done = () => {
    void qc.invalidateQueries({ queryKey: ['requests'] })
    void qc.invalidateQueries({ queryKey: ['calendar'] })
  }
  const approve = useMutation({
    mutationFn: () => request(Approve, { id: r.id }),
    onSuccess: () => (done(), toast({ title: `Approved ${r.name}`, image: r.poster, tone: 'ok' })),
    onError: toastError,
  })
  const decline = useMutation({ mutationFn: () => request(Decline, { id: r.id }), onSuccess: done, onError: toastError })
  const cancel = useMutation({ mutationFn: () => request(Delete, { id: r.id }), onSuccess: done, onError: toastError })
  const progress = r.aired ? (r.have ?? 0) / r.aired : null
  const error = (approve.error ?? decline.error ?? cancel.error) as Error | null
  return (
    <Squircle radius={16} edge className="flex gap-4 bg-raised p-3">
      <Squircle radius={10} className="aspect-[2/3] w-14 shrink-0 bg-panel">
        {r.poster && <Img src={r.poster} loading="lazy" className="size-full object-cover" />}
      </Squircle>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {r.title ? (
            <Link to="/title/$id" params={{ id: String(r.title.id) }} className="truncate text-sm font-medium hover:underline">
              {r.name}
            </Link>
          ) : (
            <span className="truncate text-sm font-medium">{r.name}</span>
          )}
          {r.year && <span className="text-xs text-ink-3">{r.year}</span>}
          <Badge tone={r.state === 'APPROVED' ? 'ok' : r.state === 'DECLINED' ? 'danger' : 'warn'}>
            {r.state === 'APPROVED' ? 'Approved' : r.state === 'DECLINED' ? 'Declined' : 'Pending'}
          </Badge>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
          {r.user && r.user.id !== me?.id && <Avatar user={r.user} size={16} />}
          {r.user?.id !== me?.id ? `${r.user?.username ?? 'Someone'} asked ` : 'You asked '}
          {relative(r.createdAt)}
          {r.library && ` · for ${r.library}`}
        </p>
        {r.note && <p className="mt-1.5 text-[13px] text-ink-2">“{r.note}”</p>}
        {r.state === 'APPROVED' && progress !== null && (
          <div className="mt-2.5 flex max-w-sm items-center gap-3">
            <Progress value={progress} tone={progress >= 1 ? 'ok' : 'live'} className="flex-1" />
            <span className="text-xs text-ink-3 tabular">
              {r.have} of {r.aired} episodes
            </span>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-danger">{error.message}</p>}
      </div>
      <div className="flex shrink-0 items-start gap-1.5">
        {r.state === 'PENDING' && manage && (
          <>
            <Button size="sm" variant="plain" onClick={() => decline.mutate()} disabled={decline.isPending}>
              <X className="size-3.5" /> Decline
            </Button>
            <Button size="sm" variant="primary" onClick={() => approve.mutate()} disabled={approve.isPending}>
              <Check className="size-3.5" /> Approve
            </Button>
          </>
        )}
        {r.state === 'PENDING' && !manage && r.user?.id === me?.id && (
          <Button size="sm" variant="plain" onClick={() => cancel.mutate()}>
            Cancel
          </Button>
        )}
      </div>
    </Squircle>
  )
}
