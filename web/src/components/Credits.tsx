// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar } from './Avatar'
import { Card } from './SettingsKit'

const contributors = __CONTRIBUTORS__

export function Credits() {
  return (
    <>
      <Card title="Contributors" description="Everyone who has written code for this build of tinystream.">
        {contributors.length ? (
          <ul className="grid gap-1 sm:grid-cols-2">
            {contributors.map((c) => {
              const body = (
                <>
                  <Avatar user={{ id: null, username: c.name }} src={null} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
                  <span className="shrink-0 text-xs text-ink-3 tabular">
                    {c.commits} {c.commits === 1 ? 'commit' : 'commits'}
                  </span>
                </>
              )
              return (
                <li key={c.name}>
                  {c.github ? (
                    <a href={`https://github.com/${c.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-hover">
                      {body}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-1.5">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">This build was made without its git history, so there's no one to list.</p>
        )}
      </Card>
      <Card title="Metadata" description="Titles, artwork and episode details come from these services.">
        <div className="flex flex-col gap-5">
          <Source href="https://www.themoviedb.org" logo={<img src="/tmdb.svg" alt="TMDB" className="h-3.5" />}>
            tinystream uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
          </Source>
          <Source href="https://anilist.co" logo={<span className="text-sm font-semibold">AniList</span>}>
            Anime information is provided by AniList. tinystream is not affiliated with or endorsed by AniList.
          </Source>
        </div>
      </Card>
    </>
  )
}

function Source({ href, logo, children }: { href: string; logo: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-ink-2 hover:text-ink">
        {logo}
        <ArrowUpRight className="size-3.5 text-ink-3" />
      </a>
      <p className="text-xs leading-relaxed text-ink-3">{children}</p>
    </div>
  )
}
