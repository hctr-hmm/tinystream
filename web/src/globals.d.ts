// SPDX-License-Identifier: AGPL-3.0-or-later

interface Contributor {
  name: string
  github: string | null
  commits: number
}

/** Filled in by vite.config.ts from the git history the UI is built from. */
declare const __CONTRIBUTORS__: Contributor[]
