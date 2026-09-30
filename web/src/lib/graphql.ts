// SPDX-License-Identifier: AGPL-3.0-or-later
// Talking to tinystream's GraphQL API: queries and mutations over HTTP
// (with file uploads), subscriptions over a WebSocket.

import { type Client, createClient } from 'graphql-ws'
import type { TypedDocumentString } from '../gql/graphql'

const ENDPOINT = '/api/graphql'

export class ApiError extends Error {
  constructor(
    /** The server's `extensions.code`: UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, BAD_REQUEST… */
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

type Result<T> = { data?: T | null; errors?: { message: string; extensions?: { code?: string } }[] }

/** Files anywhere in `value`, by where they are, e.g. `variables.image`. */
function findFiles(value: unknown, path: string, out: Map<string, Blob>): unknown {
  if (value instanceof Blob) {
    out.set(path, value)
    return null
  }
  if (Array.isArray(value)) return value.map((v, i) => findFiles(v, `${path}.${i}`, out))
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, findFiles(v, `${path}.${k}`, out)]))
  return value
}

/** The body for a request: JSON, or multipart when it carries files. */
function body(query: string, variables: unknown): { body: BodyInit; headers: HeadersInit } {
  const files = new Map<string, Blob>()
  const vars = findFiles(variables ?? {}, 'variables', files)
  if (!files.size) return { body: JSON.stringify({ query, variables }), headers: { 'content-type': 'application/json' } }
  // https://github.com/jaydenseric/graphql-multipart-request-spec
  const form = new FormData()
  form.append('operations', JSON.stringify({ query, variables: vars }))
  form.append('map', JSON.stringify(Object.fromEntries([...files.keys()].map((path, i) => [i, [path]]))))
  ;[...files.values()].forEach((file, i) => form.append(String(i), file))
  return { body: form, headers: {} }
}

/** Runs a query or mutation; any error the server reports is thrown. */
export async function request<R, V>(
  document: TypedDocumentString<R, V>,
  ...[variables]: V extends Record<string, never> ? [] : [V]
): Promise<R> {
  const init = body(document.toString(), variables)
  const res = await fetch(ENDPOINT, { method: 'POST', credentials: 'same-origin', ...init })
  let result: Result<R>
  try {
    result = await res.json()
  } catch {
    throw new ApiError('INTERNAL', res.statusText || 'the server sent something unexpected')
  }
  const error = result.errors?.[0]
  if (error) throw new ApiError(error.extensions?.code ?? 'INTERNAL', error.message)
  if (!result.data) throw new ApiError('INTERNAL', res.statusText || 'the server sent nothing back')
  return result.data
}

let client: Client | null = null

function ws() {
  client ??= createClient({
    url: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${ENDPOINT}`,
    lazy: true,
    retryAttempts: Infinity,
    shouldRetry: () => true,
  })
  return client
}

/** Follows a subscription; returns how to stop. `onConnected` runs on every (re)connection. */
export function subscribe<R, V>(
  document: TypedDocumentString<R, V>,
  variables: V,
  onData: (data: R) => void,
  onConnected?: () => void,
): () => void {
  const c = ws()
  const off = onConnected ? c.on('connected', onConnected) : () => {}
  const stop = c.subscribe<R>(
    { query: document.toString(), variables: variables as Record<string, unknown> },
    {
      next: (r) => r.data && onData(r.data),
      error: (e) => console.warn('live updates:', e),
      complete: () => {},
    },
  )
  return () => {
    off()
    stop()
  }
}

/** Drops the live connection, e.g. after signing out, so the next one is made as whoever's signed in. */
export function disconnect() {
  void client?.dispose()
  client = null
}
