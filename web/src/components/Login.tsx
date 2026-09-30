// SPDX-License-Identifier: AGPL-3.0-or-later

import { useQueryClient } from '@tanstack/react-query'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { graphql } from '../gql'
import { request } from '../lib/api'
import { getCredential } from '../lib/webauthn'
import { Button, Field, Input, Panel } from './ui'

const LAST_USER = 'tinystream.lastUsername'

const Setup = graphql(`
  mutation Setup($username: String!, $password: String!) {
    setup(username: $username, password: $password) {
      user {
        id
      }
    }
  }
`)

const SignIn = graphql(`
  mutation SignIn($username: String!, $password: String!) {
    signIn(username: $username, password: $password) {
      user {
        id
      }
    }
  }
`)

const StartPasskey = graphql(`
  mutation StartPasskeySignIn($username: String!) {
    startPasskeySignIn(username: $username) {
      challenge
      options
    }
  }
`)

const FinishPasskey = graphql(`
  mutation FinishPasskeySignIn($challenge: String!, $credential: JSON!) {
    finishPasskeySignIn(challenge: $challenge, credential: $credential) {
      user {
        id
      }
    }
  }
`)

export function Login({ setup }: { setup: boolean }) {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState(() => localStorage.getItem(LAST_USER) ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const done = async () => {
    localStorage.setItem(LAST_USER, username.trim())
    await queryClient.invalidateQueries()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (setup) await request(Setup, { username, password })
      else await request(SignIn, { username, password })
      await done()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const passkey = async () => {
    if (!username.trim()) {
      setError('Type your username first, then use your passkey.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { challenge, options } = (await request(StartPasskey, { username })).startPasskeySignIn
      const credential = await getCredential(options)
      await request(FinishPasskey, { challenge, credential })
      await done()
    } catch (err) {
      const e = err as Error
      setError(e.name === 'NotAllowedError' ? 'The passkey prompt was closed.' : e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="size-8" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{setup ? 'Welcome to tinystream' : 'Sign in'}</h1>
            {setup && <p className="text-sm text-ink-2">Create the admin account.</p>}
          </div>
        </div>
        <Panel radius={20} className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Username">
              <Input
                autoFocus={!username}
                autoComplete="username webauthn"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoFocus={!!username}
                autoComplete={setup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button variant="primary" size="lg" className="w-full" disabled={busy || !username || !password}>
              {setup ? 'Create account' : 'Sign in'}
            </Button>
          </form>
          {!setup && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-ink-3">
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
              <Button size="lg" className="w-full" disabled={busy} onClick={passkey}>
                <KeyRound className="size-4.5" />
                Sign in with a passkey
              </Button>
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
