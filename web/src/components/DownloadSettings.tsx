// SPDX-License-Identifier: AGPL-3.0-or-later

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, CircleAlert, Plus, RefreshCw, Rss, Trash2, Undo2, Zap } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { graphql } from '../gql'
import type { DetectSourceQuery } from '../gql/graphql'
import { type ProfileConfig, type Seeding, type Settings, type SourceConfig, request } from '../lib/api'

const SaveSection = graphql(`
  mutation SaveSection($patch: ConfigPatch!) {
    updateSettings(patch: $patch) {
      raw
    }
  }
`)

const EngineQuery = graphql(`
  query SettingsEngine {
    downloadEngine {
      downloadPath
      killSwitch
    }
  }
`)

const AddSource = graphql(`
  mutation AddSource($input: SourceInput!) {
    addSource(input: $input) {
      raw
    }
  }
`)

const UpdateSource = graphql(`
  mutation UpdateSource($name: String!, $input: SourceInput!) {
    updateSource(name: $name, input: $input) {
      raw
    }
  }
`)

const RemoveSource = graphql(`
  mutation RemoveSource($name: String!) {
    removeSource(name: $name) {
      raw
    }
  }
`)

const DetectSource = graphql(`
  query DetectSource($url: String!, $apiKey: String) {
    detectSource(url: $url, apiKey: $apiKey) {
      kind
      url
      feed
      name
      searchable
      sample {
        link
        title
        size
        seeders
        published
      }
    }
  }
`)

const AddProfile = graphql(`
  mutation AddProfile($input: ProfileInput!) {
    addProfile(input: $input) {
      raw
    }
  }
`)

const UpdateProfile = graphql(`
  mutation UpdateProfile($name: String!, $input: ProfileInput!) {
    updateProfile(name: $name, input: $input) {
      raw
    }
  }
`)

const RemoveProfile = graphql(`
  mutation RemoveProfile($name: String!) {
    removeProfile(name: $name) {
      raw
    }
  }
`)

const RenameSuggestions = graphql(`
  query RenameSuggestions {
    renameSuggestions {
      id
      library
      managed
      root
      src
      dst
      reason
      confidence
    }
  }
`)

const FileHistory = graphql(`
  query FileHistory {
    fileHistory {
      batch
      label
      at
      count
      undone
      operations {
        kind
        src
        dst
      }
    }
  }
`)

const RefreshRenames = graphql(`
  mutation RefreshRenameSuggestions {
    refreshRenameSuggestions
  }
`)

const ApplyRenames = graphql(`
  mutation ApplyRenames($ids: [Int!]!) {
    applyRenames(ids: $ids) {
      renamed
      problems
    }
  }
`)

const DismissRenames = graphql(`
  mutation DismissRenames($ids: [Int!]!) {
    dismissRenames(ids: $ids)
  }
`)

const Undo = graphql(`
  mutation UndoFileChanges($batch: String!) {
    undoFileChanges(batch: $batch) {
      undone
      problems
    }
  }
`)

type Detected = DetectSourceQuery['detectSource']
/** The sections of config.toml edited here as a whole. */
type Section = 'downloads' | 'automation' | 'requests'
import { bytes, relative } from '../lib/downloads'
import { ask } from './feedback'
import { MonitorPicker } from './downloads'
import { Card, Row, useSave, useSettings } from './SettingsKit'
import { Squircle } from './Squircle'
import { Badge, Button, Checkbox, Dialog, Field, IconButton, Input, Segmented, Select, Spinner, Tip, Toggle } from './ui'

/** A draft of one config section with save/discard, like the Server tab. */
function useDraft<K extends Section>(key: K) {
  const { data } = useSettings()
  const refresh = useSave()
  const [draft, setDraft] = useState<Settings[K] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    if (data && !draft) setDraft(structuredClone(data[key]))
  }, [data, draft, key])
  const save = useMutation({
    mutationFn: () => request(SaveSection, { patch: { [key]: draft } }),
    onSuccess: () => {
      setError(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
      refresh()
    },
    onError: (e) => setError((e as Error).message),
  })
  const set = (fn: (d: Settings[K]) => void) => {
    const d = structuredClone(draft!)
    fn(d)
    setDraft(d)
  }
  const dirty = !!data && JSON.stringify(draft) !== JSON.stringify(data[key])
  const bar = (
    <div className="sticky bottom-4 flex items-center justify-end gap-3">
      {error && <p className="min-w-0 flex-1 text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-ink-2">Saved to config.toml</p>}
      <Button variant="plain" disabled={!dirty} onClick={() => data && setDraft(structuredClone(data[key]))}>
        Discard
      </Button>
      <Button variant="primary" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
        Save changes
      </Button>
    </div>
  )
  return { data, draft, set, bar }
}

const num = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0
const presets: { value: string; label: string; rules: Seeding }[] = [
  { value: 'none', label: "Don't seed", rules: { ratio: 0, time: null, idle: null, then: 'REMOVE' } },
  { value: 'ratio', label: 'Ratio 1.0', rules: { ratio: 1, time: null, idle: null, then: 'REMOVE' } },
  { value: 'week', label: '7 days', rules: { ratio: null, time: '7days', idle: null, then: 'REMOVE' } },
  { value: 'forever', label: 'Forever', rules: { ratio: null, time: null, idle: null, then: 'PAUSE' } },
]

function presetOf(s: Seeding) {
  return presets.find((p) => (p.rules.ratio ?? null) === (s.ratio ?? null) && (p.rules.time ?? null) === (s.time ?? null) && !s.idle)?.value ?? 'custom'
}

/** Pick a preset, or open up the rules behind them. */
export function SeedingEditor({ value, onChange }: { value: Seeding; onChange: (s: Seeding) => void }) {
  const [custom, setCustom] = useState(presetOf(value) === 'custom')
  const current = custom ? 'custom' : presetOf(value)
  return (
    <div>
      <Segmented
        value={current}
        onChange={(v) => {
          if (v === 'custom') return setCustom(true)
          setCustom(false)
          onChange(presets.find((p) => p.value === v)!.rules)
        }}
        options={[...presets.map((p) => ({ value: p.value, label: p.label })), { value: 'custom', label: 'Custom' }]}
      />
      {current === 'custom' && (
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Field label="Up to ratio">
            <Input
              value={value.ratio ?? ''}
              placeholder="no limit"
              onChange={(e) => onChange({ ...value, ratio: e.target.value.trim() ? num(e.target.value) : null })}
            />
          </Field>
          <Field label="For at most">
            <Input value={value.time ?? ''} placeholder="e.g. 3days" onChange={(e) => onChange({ ...value, time: e.target.value.trim() || null })} />
          </Field>
          <Field label="Or idle for">
            <Input value={value.idle ?? ''} placeholder="e.g. 1day" onChange={(e) => onChange({ ...value, idle: e.target.value.trim() || null })} />
          </Field>
          <Field label="Then">
            <Select
              value={value.then}
              options={[
                { value: 'REMOVE', label: 'Remove it' },
                { value: 'PAUSE', label: 'Pause it' },
              ]}
              onChange={(then) => onChange({ ...value, then })}
            />
          </Field>
        </div>
      )}
      <p className="mt-2 text-xs leading-relaxed text-ink-3">
        {describeSeeding(value)}
      </p>
    </div>
  )
}

function describeSeeding(s: Seeding) {
  if (s.ratio === 0) return 'Torrents stop as soon as they finish.'
  const limits = [s.ratio != null && `ratio ${s.ratio}`, s.time && `${s.time}`, s.idle && `${s.idle} without anyone downloading`].filter(Boolean)
  if (!limits.length) return 'Torrents seed until you stop them.'
  const until = limits.length > 1 ? `${limits.join(', or ')}, whichever comes first` : limits[0]
  return `Torrents seed until ${until}; then they're ${s.then === 'PAUSE' ? 'paused' : 'removed'}.`
}
export function DownloadsSettings() {
  const { draft, set, bar } = useDraft('downloads')
  const { data: engine } = useQuery({ queryKey: ['engine', 'path'], queryFn: async () => (await request(EngineQuery)).downloadEngine })
  if (!draft) return null
  const d = draft
  const kib = (v: number) => (v ? `${v}` : '')
  return (
    <>
      <Card title="Where downloads go">
        <Field label="Download folder">
          <Input value={d.path ?? ''} placeholder={engine?.downloadPath} onChange={(e) => set((c) => void (c.path = e.target.value.trim() || null))} />
        </Field>
        <div className="mt-5">
          <p className="mb-1.5 text-[13px] text-ink-2">Getting them into the library</p>
          <Segmented
            value={d.import}
            onChange={(v) => set((c) => void (c.import = v))}
            options={[
              { value: 'AUTO', label: 'Automatic' },
              { value: 'HARDLINK', label: 'Hardlink' },
              { value: 'COPY', label: 'Copy' },
              { value: 'MOVE', label: 'Move' },
            ]}
          />
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            {
              {
                AUTO: 'Hardlink on the same disk, otherwise copy while seeding or move.',
                HARDLINK: 'Same disk only.',
                COPY: 'Reflinks on btrfs and xfs.',
                MOVE: 'Can’t seed afterwards.',
              }[d.import]
            }
          </p>
        </div>
      </Card>

      <Card title="Seeding">
        <SeedingEditor value={d.seeding} onChange={(s) => set((c) => void (c.seeding = s))} />
      </Card>

      <Card title="Speed">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Download limit (KB/s)">
            <Input inputMode="numeric" value={kib(d.downloadLimit)} placeholder="unlimited" onChange={(e) => set((c) => void (c.downloadLimit = num(e.target.value)))} />
          </Field>
          <Field label="Upload limit (KB/s)">
            <Input inputMode="numeric" value={kib(d.uploadLimit)} placeholder="unlimited" onChange={(e) => set((c) => void (c.uploadLimit = num(e.target.value)))} />
          </Field>
          <Field label="Downloading at once">
            <Input inputMode="numeric" value={d.maxActive || ''} placeholder="no limit" onChange={(e) => set((c) => void (c.maxActive = num(e.target.value)))} />
          </Field>
        </div>
        <p className="mt-6 mb-3 text-sm font-medium">Slower hours</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="From">
            <Input value={d.slowFrom ?? ''} placeholder="08:00" onChange={(e) => set((c) => void (c.slowFrom = e.target.value.trim() || null))} />
          </Field>
          <Field label="Until">
            <Input value={d.slowTo ?? ''} placeholder="23:00" onChange={(e) => set((c) => void (c.slowTo = e.target.value.trim() || null))} />
          </Field>
          <Field label="Download (KB/s)">
            <Input inputMode="numeric" value={kib(d.slowDownloadLimit)} placeholder="same" onChange={(e) => set((c) => void (c.slowDownloadLimit = num(e.target.value)))} />
          </Field>
          <Field label="Upload (KB/s)">
            <Input inputMode="numeric" value={kib(d.slowUploadLimit)} placeholder="same" onChange={(e) => set((c) => void (c.slowUploadLimit = num(e.target.value)))} />
          </Field>
        </div>
      </Card>

      <Card
        title="Privacy"
        description={
          engine?.killSwitch ? (
            <span className="text-danger">{engine.killSwitch} is down right now; every torrent is paused.</span>
          ) : undefined
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Only use this network interface">
            <Input value={d.bindInterface ?? ''} placeholder="wg0" onChange={(e) => set((c) => void (c.bindInterface = e.target.value.trim() || null))} />
          </Field>
          <Field label="Proxy" hint="socks5://user:pass@host:1080 or http://host:8080">
            <Input value={d.proxy ?? ''} placeholder="none" onChange={(e) => set((c) => void (c.proxy = e.target.value.trim() || null))} />
          </Field>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Port">
            <Input inputMode="numeric" value={d.port} onChange={(e) => set((c) => void (c.port = num(e.target.value)))} />
          </Field>
          <div className="space-y-3 pt-6">
            <Row label="Open the port on the router (UPnP)">
              <Toggle label="UPnP" checked={d.upnp} onChange={(v) => set((c) => void (c.upnp = v))} />
            </Row>
            <Row label="Find peers without trackers (DHT)">
              <Toggle label="DHT" checked={d.dht} onChange={(v) => set((c) => void (c.dht = v))} />
            </Row>
          </div>
        </div>
      </Card>
      {bar}
    </>
  )
}
export function SourcesSettings() {
  const { data } = useSettings()
  const [editing, setEditing] = useState<{ source: SourceConfig | null } | null>(null)
  const refresh = useSave()
  const toggle = useMutation({
    mutationFn: (s: SourceConfig) => request(UpdateSource, { name: s.name, input: { ...s, enabled: !s.enabled } }),
    onSuccess: refresh,
  })
  if (!data) return null
  const sources = data.sources
  return (
    <>
      <Card
        title="Sources"
        aside={
          <Button variant="primary" onClick={() => setEditing({ source: null })}>
            <Plus className="size-4" /> Add
          </Button>
        }
      >
        {sources.length === 0 && (
          <div className="grid place-items-center py-8 text-center">
            <Rss className="size-6 text-ink-3" />
            <p className="mt-3 text-sm text-ink-2">No sources yet</p>
          </div>
        )}
        <div className="-mx-2 space-y-0.5">
          {sources.map((s) => {
            const on = s.enabled
            return (
              <div key={s.name} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-hover">
                <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditing({ source: s })}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-panel text-ink-3">
                    {s.kind === 'TORZNAB' ? <Zap className="size-4" /> : <Rss className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${on ? '' : 'text-ink-3'}`}>
                      {s.name} <span className="ml-1 text-xs font-normal text-ink-3">{s.kind === 'TORZNAB' ? 'Torznab' : 'RSS'}</span>
                    </p>
                    <p className="truncate text-xs text-ink-3">{s.url.replace(/(apikey|passkey)=[^&]+/i, '$1=…')}</p>
                  </div>
                </button>
                {s.seeding && <Badge>own seeding</Badge>}
                <Toggle label={`Use ${s.name}`} checked={on} onChange={() => toggle.mutate(s)} />
              </div>
            )
          })}
        </div>
      </Card>
      {editing && <SourceDialog source={editing.source} onClose={() => setEditing(null)} />}
    </>
  )
}

function SourceDialog({ source, onClose }: { source: SourceConfig | null; onClose: () => void }) {
  const refresh = useSave()
  const { data: settings } = useSettings()
  const [s, setS] = useState<SourceConfig>(
    source ?? { name: '', kind: 'RSS', url: '', feed: null, apiKey: null, categories: [], enabled: true, downloadPath: null, seeding: null },
  )
  const [link, setLink] = useState(source?.url ?? '')
  const [detected, setDetected] = useState<Detected | null>(null)
  const set = (patch: Partial<SourceConfig>) => setS((x) => ({ ...x, ...patch }))
  const detect = useMutation({
    mutationFn: async () => (await request(DetectSource, { url: link, apiKey: s.apiKey || null })).detectSource,
    onSuccess: (d) => {
      setDetected(d)
      setS((x) => ({
        ...x,
        kind: d.kind,
        url: d.url,
        feed: d.feed,
        name: x.name || d.name?.replace(/\s*[-–|].*$/, '').trim() || new URL(link.replace('{query}', '')).hostname,
      }))
    },
  })
  const save = useMutation({
    mutationFn: async () => void (source === null ? await request(AddSource, { input: s }) : await request(UpdateSource, { name: source.name, input: s })),
    onSuccess: () => {
      refresh()
      onClose()
    },
  })
  const remove = useMutation({
    mutationFn: () => request(RemoveSource, { name: source!.name }),
    onSuccess: () => {
      refresh()
      onClose()
    },
  })
  const ready = !!s.name.trim() && !!s.url.trim()
  const global = settings?.downloads.seeding

  return (
    <Dialog onClose={onClose} width="max-w-2xl">
      <p className="text-[15px] font-medium">{source ? `Edit ${source.name}` : 'Add a source'}</p>
      <div className="mt-5 space-y-4">
        <Field label="Link" hint="A Torznab API URL, an RSS search URL with {query}, or an RSS feed.">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input autoFocus={!source} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
            </div>
            <Button onClick={() => detect.mutate()} disabled={!link.trim() || detect.isPending}>
              {detect.isPending ? <Spinner className="size-4" /> : 'Check'}
            </Button>
          </div>
        </Field>
        <Field label="API key" hint="Torznab only.">
          <Input type="password" value={s.apiKey ?? ''} onChange={(e) => set({ apiKey: e.target.value.trim() || null })} />
        </Field>
        {detect.error && (
          <p className="flex items-start gap-2 text-sm text-danger">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {(detect.error as Error).message}
          </p>
        )}
        {detected && (
          <Squircle radius={12} className="bg-canvas p-3">
            <p className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-ok" />
              {detected.kind === 'TORZNAB' ? 'A Torznab API' : detected.searchable ? 'An RSS feed that can search' : 'An RSS feed (watched, not searched)'}
              {detected.name && <span className="text-ink-3">· {detected.name}</span>}
            </p>
            <div className="mt-2 space-y-1">
              {detected.sample.slice(0, 5).map((r) => (
                <p key={r.link} className="flex gap-3 truncate text-xs text-ink-3">
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  <span className="shrink-0 tabular">{bytes(r.size)}</span>
                </p>
              ))}
              {detected.sample.length === 0 && <p className="text-xs text-ink-3">No results</p>}
            </div>
          </Squircle>
        )}
        {(detected || source) && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={s.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Type">
                <Select
                  value={s.kind}
                  options={[
                    { value: 'RSS', label: 'RSS' },
                    { value: 'TORZNAB', label: 'Torznab' },
                  ]}
                  onChange={(kind) => set({ kind })}
                />
              </Field>
            </div>
            <Field label={s.kind === 'TORZNAB' ? 'API URL' : 'Search URL'}>
              <Input value={s.url} onChange={(e) => set({ url: e.target.value })} />
            </Field>
            {s.kind === 'RSS' && (
              <Field label="Feed of new releases">
                <Input value={s.feed ?? ''} onChange={(e) => set({ feed: e.target.value.trim() || null })} />
              </Field>
            )}
            {s.kind === 'TORZNAB' && (
              <Field label="Categories" hint="Comma-separated, e.g. 5070 for anime. Empty searches everything.">
                <Input
                  value={(s.categories ?? []).join(', ')}
                  onChange={(e) => set({ categories: e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0) })}
                />
              </Field>
            )}
            <Field label="Download folder">
              <Input value={s.downloadPath ?? ''} onChange={(e) => set({ downloadPath: e.target.value.trim() || null })} />
            </Field>
            <div>
              <Row label="Its own seeding rules">
                <Toggle
                  label="Own seeding rules"
                  checked={!!s.seeding}
                  onChange={(v) => set({ seeding: v ? (global ?? { ratio: 1, time: null, idle: null, then: 'REMOVE' }) : null })}
                />
              </Row>
              {s.seeding && (
                <div className="mt-3">
                  <SeedingEditor value={s.seeding} onChange={(seeding) => set({ seeding })} />
                </div>
              )}
            </div>
          </>
        )}
        {save.error && <p className="text-sm text-danger">{(save.error as Error).message}</p>}
      </div>
      <div className="mt-6 flex items-center gap-2">
        {source !== null && (
          <Button variant="danger" onClick={async () => (await ask({ title: `Remove ${source?.name}?`, confirm: 'Remove', danger: true })) && remove.mutate()}>
            <Trash2 className="size-4" /> Remove
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="plain" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!ready || save.isPending} onClick={() => save.mutate()}>
          {source === null ? 'Add source' : 'Save'}
        </Button>
      </div>
    </Dialog>
  )
}
const RESOLUTIONS = ['2160p', '1080p', '720p', '576p', '480p']
const CODECS = ['hevc', 'av1', 'h264']

const blankProfile: ProfileConfig = {
  name: '',
  resolutions: ['1080p', '720p'],
  groups: [],
  require: [],
  reject: [],
  minSize: null,
  maxSize: null,
  codecs: [],
  preferDualAudio: false,
  batches: true,
  minSeeders: 1,
}

export function ProfilesSettings() {
  const { data } = useSettings()
  const [editing, setEditing] = useState<{ existing: boolean; profile: ProfileConfig } | null>(null)
  if (!data) return null
  const profiles = data.profiles
  return (
    <>
      <Card
        title="Quality profiles"
        aside={
          <Button variant="primary" onClick={() => setEditing({ existing: false, profile: blankProfile })}>
            <Plus className="size-4" /> Add
          </Button>
        }
      >
        {profiles.length === 0 && (
          <p className="text-sm text-ink-3">Built-in: 1080p › 720p › 2160p › 480p</p>
        )}
        <div className="-mx-2 space-y-0.5">
          {profiles.map((p) => (
            <button key={p.name} onClick={() => setEditing({ existing: true, profile: p })} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-hover">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-ink-3">
                  {[p.resolutions.join(' › ') || 'any resolution', p.groups.length ? p.groups.join(' › ') : null, p.preferDualAudio && 'dual audio', !p.batches && 'no packs']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {data.libraries.filter((l) => l.profile === p.name).map((l) => (
                <Badge key={l.name}>{l.name}</Badge>
              ))}
            </button>
          ))}
        </div>
      </Card>
      {editing && <ProfileDialog existing={editing.existing} initial={editing.profile} onClose={() => setEditing(null)} />}
    </>
  )
}

/** Toggle chips whose order is the order you clicked them in. */
function OrderedChips({ all, value, onChange, label }: { all: string[]; value: string[]; onChange: (v: string[]) => void; label: (s: string) => ReactNode }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((x) => {
        const i = value.indexOf(x)
        return (
          <Squircle
            key={x}
            as="button"
            radius={8}
            onClick={() => onChange(i >= 0 ? value.filter((v) => v !== x) : [...value, x])}
            className={`flex h-7 items-center gap-1.5 px-2.5 text-xs transition-colors ${i >= 0 ? 'bg-ink text-canvas' : 'bg-panel text-ink-2 hover:text-ink'}`}
          >
            {i >= 0 && <span className="opacity-50 tabular">{i + 1}</span>}
            {label(x)}
          </Squircle>
        )
      })}
    </div>
  )
}

const csv = (v: string[]) => v.join(', ')
const uncsv = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

function ProfileDialog({ existing, initial, onClose }: { existing: boolean; initial: ProfileConfig; onClose: () => void }) {
  const refresh = useSave()
  const [p, setP] = useState<ProfileConfig>(initial)
  const [groups, setGroups] = useState(csv(initial.groups))
  const [require, setRequire] = useState(csv(initial.require))
  const [reject, setReject] = useState(csv(initial.reject))
  const set = (x: Partial<ProfileConfig>) => setP((o) => ({ ...o, ...x }))
  const body = () => ({ ...p, groups: uncsv(groups), require: uncsv(require), reject: uncsv(reject) })
  const save = useMutation({
    mutationFn: async () => void (existing ? await request(UpdateProfile, { name: initial.name, input: body() }) : await request(AddProfile, { input: body() })),
    onSuccess: () => {
      refresh()
      onClose()
    },
  })
  const remove = useMutation({
    mutationFn: () => request(RemoveProfile, { name: initial.name }),
    onSuccess: () => {
      refresh()
      onClose()
    },
  })
  return (
    <Dialog onClose={onClose} width="max-w-2xl">
      <p className="text-[15px] font-medium">{existing ? `Edit ${initial.name}` : 'New profile'}</p>
      <div className="mt-5 space-y-5">
        <Field label="Name">
          <Input autoFocus value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="1080p subs" />
        </Field>
        <div>
          <p className="mb-1.5 text-[13px] text-ink-2">Resolutions, best first</p>
          <OrderedChips all={RESOLUTIONS} value={p.resolutions} onChange={(resolutions) => set({ resolutions })} label={(x) => x} />
        </div>
        <Field label="Release groups, best first">
          <Input value={groups} onChange={(e) => setGroups(e.target.value)} placeholder="SubsPlease, Erai-raws" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Must contain" hint="Words or regular expressions.">
            <Input value={require} onChange={(e) => setRequire(e.target.value)} />
          </Field>
          <Field label="Must not contain">
            <Input value={reject} onChange={(e) => setReject(e.target.value)} placeholder="cam, hardsub" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min size per episode (MB)">
            <Input value={p.minSize ?? ''} placeholder="none" onChange={(e) => set({ minSize: e.target.value.trim() ? num(e.target.value) : null })} />
          </Field>
          <Field label="Max size per episode (MB)">
            <Input value={p.maxSize ?? ''} placeholder="none" onChange={(e) => set({ maxSize: e.target.value.trim() ? num(e.target.value) : null })} />
          </Field>
          <Field label="At least this many seeding">
            <Input value={p.minSeeders} onChange={(e) => set({ minSeeders: num(e.target.value) })} />
          </Field>
        </div>
        <div>
          <p className="mb-1.5 text-[13px] text-ink-2">Codecs, best first</p>
          <OrderedChips all={CODECS} value={p.codecs} onChange={(codecs) => set({ codecs })} label={(x) => x.toUpperCase()} />
        </div>
        <div className="space-y-3">
          <Row label="Prefer dual audio">
            <Toggle label="Prefer dual audio" checked={p.preferDualAudio} onChange={(v) => set({ preferDualAudio: v })} />
          </Row>
          <Row label="Allow season packs">
            <Toggle label="Season packs" checked={p.batches} onChange={(v) => set({ batches: v })} />
          </Row>
        </div>
        {save.error && <p className="text-sm text-danger">{(save.error as Error).message}</p>}
        {remove.error && <p className="text-sm text-danger">{(remove.error as Error).message}</p>}
      </div>
      <div className="mt-6 flex items-center gap-2">
        {existing && (
          <Button variant="danger" onClick={() => remove.mutate()}>
            <Trash2 className="size-4" /> Remove
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="plain" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!p.name.trim() || save.isPending} onClick={() => save.mutate()}>
          Save
        </Button>
      </div>
    </Dialog>
  )
}
export function AutomationSettings() {
  const auto = useDraft('automation')
  const req = useDraft('requests')
  if (!auto.draft || !req.draft) return null
  const a = auto.draft
  const r = req.draft
  return (
    <>
      <Card title="New shows">
        <MonitorPicker value={a.defaultMonitor} onChange={(m) => auto.set((c) => void (c.defaultMonitor = m))} />
      </Card>
      <Card title="Catching new episodes">
        <div className="space-y-2">
          {a.retry.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-ink-2">
              <span className="w-12 text-ink-3">every</span>
              <div className="w-28">
                <Input value={step.every} onChange={(e) => auto.set((c) => void (c.retry[i].every = e.target.value))} />
              </div>
              <span className="text-ink-3">until</span>
              <div className="w-28">
                <Input value={step.until} onChange={(e) => auto.set((c) => void (c.retry[i].until = e.target.value))} />
              </div>
              <span className="text-ink-3">after it airs</span>
              <IconButton label="Remove step" onClick={() => auto.set((c) => void c.retry.splice(i, 1))}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          ))}
          <Button size="sm" variant="plain" onClick={() => auto.set((c) => void c.retry.push({ every: '1day', until: '14days' }))}>
            <Plus className="size-3.5" /> Add a step
          </Button>
        </div>
        <div className="mt-5 max-w-xs">
          <Field label="Check every source's feed every" hint="E.g. 15m.">
            <Input value={a.rssInterval} onChange={(e) => auto.set((c) => void (c.rssInterval = e.target.value))} />
          </Field>
        </div>
      </Card>
      <Card title="Tidying up">
        <Row label="Suggest fixes for badly named files">
          <Toggle label="Rename suggestions" checked={a.renameSuggestions} onChange={(v) => auto.set((c) => void (c.renameSuggestions = v))} />
        </Row>
      </Card>
      {auto.bar}

      <div className="mt-8" />
      <Card title="Requests">
        <p className="mb-1.5 text-[13px] text-ink-2">Approved shows download</p>
        <MonitorPicker size="sm" value={r.monitor} onChange={(m) => req.set((c) => void (c.monitor = m))} />
      </Card>
      {req.bar}
    </>
  )
}
/** Highlights the part of a path that changes. */
function Diff({ from, to, root }: { from: string; to: string; root: string | null }) {
  const strip = (p: string) => (root && p.startsWith(root) ? p.slice(root.length + 1) : p)
  const a = strip(from)
  const b = strip(to)
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  const cut = a.lastIndexOf('/', i) + 1
  return (
    <div className="min-w-0 font-mono text-xs leading-relaxed">
      <Tip label={from} className="block truncate text-ink-3">
        {a.slice(0, cut)}
        <span className="text-danger/90 line-through decoration-danger/50">{a.slice(cut)}</span>
      </Tip>
      <Tip label={to} className="flex items-center gap-1 truncate text-ink-2">
        <ArrowRight className="size-3 shrink-0 text-ink-3" />
        <span className="truncate">
          {b.slice(0, cut)}
          <span className="text-ok">{b.slice(cut)}</span>
        </span>
      </Tip>
    </div>
  )
}

export function RenamesSettings() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['renames'], queryFn: async () => (await request(RenameSuggestions)).renameSuggestions })
  const { data: history } = useQuery({ queryKey: ['history'], queryFn: async () => (await request(FileHistory)).fileHistory })
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showLow, setShowLow] = useState(false)
  const done = () => {
    setSelected(new Set())
    void qc.invalidateQueries({ queryKey: ['renames'] })
    void qc.invalidateQueries({ queryKey: ['history'] })
  }
  const refresh = useMutation({ mutationFn: () => request(RefreshRenames), onSuccess: done })
  const apply = useMutation({ mutationFn: async (ids: number[]) => (await request(ApplyRenames, { ids })).applyRenames, onSuccess: done })
  const dismiss = useMutation({ mutationFn: (ids: number[]) => request(DismissRenames, { ids }), onSuccess: done })
  const undo = useMutation({ mutationFn: async (batch: string) => (await request(Undo, { batch })).undoFileChanges, onSuccess: done })

  const visible = useMemo(() => (data ?? []).filter((s) => showLow || s.confidence === 'HIGH'), [data, showLow])
  const low = (data ?? []).filter((s) => s.confidence === 'LOW').length
  const libraries = [...new Set(visible.map((s) => s.library))]
  const toggle = (id: number) => setSelected((s) => (s.has(id) ? (s.delete(id), new Set(s)) : new Set(s).add(id)))
  const ids = [...selected]

  return (
    <>
      <Card
        title="Renames"
        aside={
          <IconButton label="Look again" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            <RefreshCw className={`size-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
          </IconButton>
        }
      >
        {data && visible.length === 0 && (
          <p className="text-sm text-ink-3">{data.length === 0 ? 'Nothing to fix.' : 'Only guesses left; show them below.'}</p>
        )}
        {visible.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setSelected(selected.size === visible.length ? new Set() : new Set(visible.map((s) => s.id)))}>
              {selected.size === visible.length ? 'Select none' : 'Select all'}
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="plain" disabled={!ids.length} onClick={() => dismiss.mutate(ids)}>
              Dismiss
            </Button>
            <Button size="sm" variant="primary" disabled={!ids.length || apply.isPending} onClick={() => apply.mutate(ids)}>
              <Check className="size-3.5" /> Rename {ids.length || ''}
            </Button>
          </div>
        )}
        {apply.data && apply.data.problems.length > 0 && (
          <div className="mb-3 space-y-1">
            {apply.data.problems.map((p) => (
              <p key={p} className="text-xs text-danger">
                {p}
              </p>
            ))}
          </div>
        )}
        {libraries.map((lib) => (
          <div key={lib} className="mb-4">
            <p className="mb-1 text-xs font-medium text-ink-3">{lib}</p>
            {visible.some((s) => s.library === lib && !s.managed) && (
              <p className="mb-2 text-xs text-warn">Not managed; can't rename.</p>
            )}
            <div className="-mx-2 space-y-0.5">
              {visible
                .filter((s) => s.library === lib)
                .map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-hover">
                    <Checkbox checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <Diff from={s.src} to={s.dst} root={s.root} />
                      <p className="mt-1 flex items-center gap-2 text-xs text-ink-3">
                        {s.reason}
                        {s.confidence === 'LOW' && <Badge tone="warn">guess</Badge>}
                      </p>
                    </div>
                  </label>
                ))}
            </div>
          </div>
        ))}
        {low > 0 && (
          <button className="text-xs text-ink-3 hover:text-ink-2" onClick={() => setShowLow((v) => !v)}>
            {showLow ? 'Hide' : 'Show'} {low} less certain suggestion{low === 1 ? '' : 's'}
          </button>
        )}
      </Card>

      <Card title="History">
        {history?.length === 0 && <p className="text-sm text-ink-3">Nothing yet.</p>}
        <div className="-mx-2 space-y-0.5">
          {history?.map((b) => (
            <div key={b.batch} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-hover">
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${b.undone ? 'text-ink-3 line-through' : ''}`}>{b.label}</p>
                <p className="text-xs text-ink-3">
                  {relative(b.at)} · {b.count} change{b.count === 1 ? '' : 's'}
                </p>
              </div>
              {!b.undone && (
                <Button
                  size="sm"
                  variant="plain"
                  disabled={undo.isPending}
                  onClick={async () =>
                    (await ask(
                      b.batch.startsWith('import')
                        ? { title: 'Undo this import?', body: 'The imported files are removed from the library (the download keeps its copy).', confirm: 'Undo import' }
                        : { title: 'Put these files back the way they were?', confirm: 'Undo' },
                    )) && undo.mutate(b.batch)
                  }
                >
                  <Undo2 className="size-3.5" /> Undo
                </Button>
              )}
            </div>
          ))}
        </div>
        {undo.data && undo.data.problems.length > 0 && <p className="mt-2 text-xs text-danger">{undo.data.problems.join(' ')}</p>}
      </Card>
    </>
  )
}
