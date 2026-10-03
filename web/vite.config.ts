// SPDX-License-Identifier: AGPL-3.0-or-later

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In development, API calls go to a running tinystream (default port 3000).
const api = process.env.TINYSTREAM_API ?? 'http://127.0.0.1:3000'

const BOT = /\[bot\]|^(claude|copilot|blacksmith)\b|@anthropic\.com$/i

// Everyone who authored or co-authored a commit reachable from HEAD, most commits first.
function contributors(): Contributor[] {
  let log: string
  try {
    log = execFileSync('git', ['log', '--format=%aN <%aE>%x1f%(trailers:key=Co-authored-by,valueonly,separator=%x1f)%x1e'], { encoding: 'utf8' })
  } catch {
    return []
  }
  const people = new Map<string, Contributor>()
  for (const commit of log.split('\x1e')) {
    for (const entry of commit.split('\x1f')) {
      const m = entry.trim().match(/^(.+?)\s*<(.*)>$/)
      if (!m || BOT.test(m[1]) || BOT.test(m[2])) continue
      const key = m[1].toLowerCase()
      const person = people.get(key) ?? { name: m[1], github: null, commits: 0 }
      person.github ??= m[2].match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/)?.[1] ?? null
      person.commits++
      people.set(key, person)
    }
  }
  return [...people.values()].sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name))
}

export default defineConfig({
  define: { __CONTRIBUTORS__: JSON.stringify(contributors()) },
  resolve: {
    // The music player's decoder, built from web/decoder by `bun run decoder`.
    alias: { '#decoder': fileURLToPath(new URL('../target/wasm/pkg', import.meta.url)) },
  },
  server: {
    fs: { allow: ['.', '../target/wasm/pkg'] },
    proxy: { '/api': { target: api, changeOrigin: false, ws: true } },
    headers: {
      // Lets the subtitle renderer use threads (SharedArrayBuffer).
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: { outputPath: '/index.html' },
      },
    }),
    react(),
  ],
})
