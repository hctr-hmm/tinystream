/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type ClipState =
  | 'EVICTED'
  | 'FAILED'
  | 'QUEUED'
  | 'READY'
  | 'RENDERING';

export type ComponentStyle =
  | 'FLAT'
  | 'GLASS'
  | 'LAYERED';

export type DownloadState =
  | 'DONE'
  | 'DOWNLOADING'
  | 'FAILED'
  | 'PAUSED'
  | 'REMOVED'
  | 'SEEDING';

export type EpisodeState =
  | 'DONE'
  | 'GRABBED'
  | 'IDLE'
  | 'MISSING'
  | 'SKIPPED'
  | 'WANTED';

export type Hardware =
  | 'AUTO'
  | 'SOFTWARE'
  | 'VAAPI';

export type ImportMode =
  | 'AUTO'
  | 'COPY'
  | 'HARDLINK'
  | 'MOVE';

export type ImportState =
  | 'DONE'
  | 'FAILED'
  | 'PENDING'
  | 'SKIPPED';

export type LibraryKind =
  | 'MUSIC'
  | 'VIDEO';

export type MatchState =
  | 'MANUAL'
  | 'MATCHED'
  | 'PENDING'
  | 'UNMATCHED';

export type MediaCategory =
  | 'EPISODES'
  | 'MOVIES'
  | 'OTHER'
  | 'SPECIALS';

export type Monitor =
  | 'FUTURE'
  | 'MISSING'
  | 'NONE';

export type NotificationKind =
  | 'AIRED'
  | 'CLIP'
  | 'CLIP_READY'
  | 'INVITE'
  | 'OTHER'
  | 'READY'
  | 'REQUEST'
  | 'REQUEST_APPROVED'
  | 'REQUEST_DECLINED';

export type Numbering =
  | 'ABSOLUTE'
  | 'AUTO'
  | 'SEASONAL';

export type Provider =
  | 'ANILIST'
  | 'TMDB';

export type RequestState =
  | 'APPROVED'
  | 'DECLINED'
  | 'PENDING';

export type SchemeMode =
  | 'SINGLE'
  /** One scheme for the system's light mode, one for its dark mode. */
  | 'SYSTEM';

export type SeedAction =
  | 'PAUSE'
  | 'REMOVE';

export type SignInStyle =
  | 'PROFILES'
  | 'USERNAME';

export type SourceKind =
  | 'RSS'
  | 'TORZNAB';

export type SourceStatus =
  | 'CHANGED'
  | 'GONE'
  | 'OK';

export type TitleKind =
  | 'MOVIE'
  | 'SHOW';

export type TorrentStage =
  | 'CHECKING'
  | 'DOWNLOADING'
  | 'METADATA'
  | 'SEEDING';

export type SignInServerQueryVariables = Exact<{ [key: string]: never; }>;


export type SignInServerQuery = { server: { setupRequired: boolean, signInStyle: SignInStyle } };

export type SignInProfilesQueryVariables = Exact<{ [key: string]: never; }>;


export type SignInProfilesQuery = { signInProfiles: Array<{ key: string, avatar: string | null, passkey: boolean }> };

export type SetupMutationVariables = Exact<{
  username: string;
  password: string;
}>;


export type SetupMutation = { setup: { token: string, user: { id: number, username: string, avatar: string | null } } };

export type SignInMutationVariables = Exact<{
  username?: string | null | undefined;
  profile?: string | null | undefined;
  password: string;
}>;


export type SignInMutation = { signIn: { token: string, user: { id: number, username: string, avatar: string | null } } };

export type StatusQueryVariables = Exact<{ [key: string]: never; }>;


export type StatusQuery = { server: { version: string, setupRequired: boolean, clips: boolean, downloads: boolean, sources: number }, viewer: { isAdmin: boolean, id: number, username: string, avatar: string | null, permissions: { allLibraries: boolean, libraries: Array<string>, request: boolean, autoApprove: boolean, requestLimit: number, manageRequests: boolean, manageShows: boolean, downloads: boolean, editMetadata: boolean, watchTogether: boolean, shareLinks: boolean, clip: boolean, clipMaxLength: number, clipLimit: number, clipStorage: number, clipLinks: boolean } } | null };

export type AppearanceQueryVariables = Exact<{ [key: string]: never; }>;


export type AppearanceQuery = { appearance: { mode: SchemeMode, style: ComponentStyle, mediaTint: boolean, light: { id: string, palette: { tokens: Array<{ name: string, value: string }> } }, dark: { id: string, palette: { tokens: Array<{ name: string, value: string }> } } } };

export type SignOutMutationVariables = Exact<{ [key: string]: never; }>;


export type SignOutMutation = { signOut: boolean };

export type PersonFragment = { id: number, username: string, avatar: string | null };

export type PermissionsFieldsFragment = { allLibraries: boolean, libraries: Array<string>, request: boolean, autoApprove: boolean, requestLimit: number, manageRequests: boolean, manageShows: boolean, downloads: boolean, editMetadata: boolean, watchTogether: boolean, shareLinks: boolean, clip: boolean, clipMaxLength: number, clipLimit: number, clipStorage: number, clipLinks: boolean };

export type ViewerFragment = { isAdmin: boolean, id: number, username: string, avatar: string | null, permissions: { allLibraries: boolean, libraries: Array<string>, request: boolean, autoApprove: boolean, requestLimit: number, manageRequests: boolean, manageShows: boolean, downloads: boolean, editMetadata: boolean, watchTogether: boolean, shareLinks: boolean, clip: boolean, clipMaxLength: number, clipLimit: number, clipStorage: number, clipLinks: boolean } };

export type CardFragment = { id: number, kind: TitleKind, library: string, name: string, year: number | null, poster: string | null, backdrop: string | null, watchedCount: number, videoCount: number, progress: number | null, freshCount: number };

export type VideoRowFragment = { id: number, season: number | null, episode: number | null, episodeEnd: number | null, label: string | null, name: string | null, overview: string | null, still: string, customStill: boolean, airDate: string | null, duration: number | null, position: number | null, finished: boolean | null };

export type TitleDetailFragment = { customPoster: boolean, customBackdrop: boolean, overview: string | null, genres: Array<string>, rating: number | null, path: string | null, matchState: MatchState, provider: Provider | null, providerId: string | null, libraryProvider: Provider | null, id: number, kind: TitleKind, library: string, name: string, year: number | null, poster: string | null, backdrop: string | null, watchedCount: number, videoCount: number, progress: number | null, freshCount: number, seasons: Array<{ number: number, name: string, title: string | null, overview: string | null, poster: string | null, episodes: Array<{ id: number, season: number | null, episode: number | null, episodeEnd: number | null, label: string | null, name: string | null, overview: string | null, still: string, customStill: boolean, airDate: string | null, duration: number | null, position: number | null, finished: boolean | null }> }>, movie: { id: number, season: number | null, episode: number | null, episodeEnd: number | null, label: string | null, name: string | null, overview: string | null, still: string, customStill: boolean, airDate: string | null, duration: number | null, position: number | null, finished: boolean | null } | null, nextUp: { resuming: boolean, video: { id: number, season: number | null, episode: number | null, episodeEnd: number | null, label: string | null, name: string | null, overview: string | null, still: string, customStill: boolean, airDate: string | null, duration: number | null, position: number | null, finished: boolean | null } } | null };

export type PlaybackFragment = { id: number, still: string, label: string | null, name: string | null, position: number | null, finished: boolean | null, title: { id: number, kind: TitleKind, name: string, backdrop: string | null }, previous: { id: number, label: string | null, name: string | null } | null, next: { id: number, still: string, label: string | null, name: string | null } | null, media: { duration: number | null, video: { index: number, codec: string, codecString: string | null, width: number, height: number, fps: number, bitDepth: number, hdr: boolean } | null, audio: Array<{ index: number, codec: string, codecString: string | null, channels: number, language: string | null, title: string | null, default: boolean }>, subtitles: Array<{ id: string, codec: string, language: string | null, title: string | null, default: boolean, forced: boolean, supported: boolean }>, fonts: Array<{ index: number, filename: string }>, chapters: Array<{ start: number, end: number, title: string | null }> } };

export type TranscodingFieldsFragment = { vaapi: string | null, vaapiError: string | null, softwareH264: boolean };

export type DiscoverResultFieldsFragment = { category: MediaCategory, provider: Provider, id: string, name: string, romaji: string | null, year: number | null, poster: string | null, overview: string | null, library: string, titleId: number | null, seriesId: number | null, monitor: Monitor | null, requestState: RequestState | null, because: string | null };

export type ClipFieldsFragment = { id: number, screenshot: boolean, name: string, mine: boolean, canManage: boolean, start: number, end: number, audio: number | null, subtitles: string | null, state: ClipState, progress: number | null, error: string | null, bytes: number | null, width: number | null, height: number | null, fps: number | null, renderedAt: number | null, createdAt: number, sharedAt: number | null, public: boolean, link: string | null, linkLive: boolean, file: string, poster: string | null, owner: { id: number, username: string, avatar: string | null }, source: { name: string, kind: TitleKind, label: string | null, year: number | null, status: SourceStatus, video: { id: number } | null, title: { id: number } | null }, quality: { height: number, halfRate: boolean }, recipients: Array<{ sharedAt: number, hidden: boolean, user: { id: number, username: string, avatar: string | null } }> };

export type ClipAllowanceFieldsFragment = { canClip: boolean, canLink: boolean, maxLength: number, bytes: number, rendered: number, storage: number, limit: number, customDefaultFont: boolean };

export type NotificationFieldsFragment = { id: number, kind: NotificationKind, priority: boolean, title: string, body: string | null, image: string | null, link: string | null, createdAt: number, expiresAt: number | null, readAt: number | null, actor: { id: number, username: string, avatar: string | null } | null };

export type DownloadFieldsFragment = { category: MediaCategory, id: number, name: string, seriesId: number | null, seriesName: string | null, poster: string | null, source: string | null, size: number | null, savePath: string, state: DownloadState, importState: ImportState, importError: string | null, importMode: string | null, error: string | null, addedAt: number, finishedAt: number | null, importedAt: number | null, title: { id: number } | null, episodes: Array<{ season: number, episode: number }>, requestedBy: { username: string } | null, live: { stage: TorrentStage, paused: boolean, progress: number, downloadRate: number, uploadRate: number, done: number, uploaded: number, ratio: number, peers: number, seeds: number, seedingSeconds: number, eta: number | null, pieces: Array<number> } | null, seedGoal: { ratio: number | null, seconds: number | null } };

export type EngineFieldsFragment = { version: string, downloadRate: number, uploadRate: number, active: number, killSwitch: string | null, listening: string | null, listenError: string | null, slowHours: boolean, downloadPath: string };

export type SeriesEpisodeFieldsFragment = { season: number, episode: number, absolute: number | null, name: string | null, airAt: number | null, aired: boolean, state: EpisodeState, attempts: number, searchedAt: number | null, nextSearch: number | null, downloadId: number | null, video: { id: number } | null };

export type SeedingFieldsFragment = { ratio: number | null, time: string | null, idle: string | null, then: SeedAction };

export type SeriesFieldsFragment = { id: number, monitor: Monitor, status: string | null, library: string, managed: boolean, path: string, name: string, year: number | null, poster: string | null, overview: string | null, provider: Provider | null, providerId: string | null, profile: string | null, effectiveProfile: string, sources: Array<string>, groups: Array<string>, aliases: Array<string>, knownAs: Array<string>, numbering: Numbering, naming: string | null, scheduleAt: number | null, addedAt: number, next: { season: number, episode: number, absolute: number | null, name: string | null, airAt: number | null, aired: boolean, state: EpisodeState, attempts: number, searchedAt: number | null, nextSearch: number | null, downloadId: number | null, video: { id: number } | null } | null, title: { id: number } | null, style: { file: string, folder: string, agreement: number | null, samples: number }, seeding: { ratio: number | null, time: string | null, idle: string | null, then: SeedAction } | null, counts: { have: number, wanted: number, missing: number, grabbed: number, total: number, upcoming: number, skipped: number }, episodes: Array<{ season: number, episode: number, absolute: number | null, name: string | null, airAt: number | null, aired: boolean, state: EpisodeState, attempts: number, searchedAt: number | null, nextSearch: number | null, downloadId: number | null, video: { id: number } | null }> };

export type ReleaseCandidateFieldsFragment = { batch: boolean, release: { title: string, source: string, link: string, infoHash: string | null, size: number | null, seeders: number | null, leechers: number | null, published: number | null, page: string | null }, attributes: { group: string | null, resolution: number | null, codec: string | null, source: string | null, dualAudio: boolean, version: number, proper: boolean, tenBit: boolean }, episodes: Array<{ season: number, episode: number }>, verdict: { accepted: boolean, score: number, rejections: Array<string>, warnings: Array<string>, nonstandard: boolean } };

export type CalendarEntryFieldsFragment = { seriesId: number, library: string, show: string, poster: string | null, backdrop: string | null, monitor: Monitor, season: number, episode: number, absolute: number | null, name: string | null, airAt: number, state: EpisodeState, title: { id: number } | null, video: { id: number } | null, download: { stage: TorrentStage, progress: number, downloadRate: number, eta: number | null } | null };

export type SettingsFieldsFragment = { raw: string, error: string | null, network: { host: string, port: number, cors: Array<string> }, log: { level: string }, scan: { watch: boolean, interval: string | null }, metadata: { tmdbApiKey: string | null, language: string }, transcode: { hardware: Hardware, vaapiDevice: string }, clips: { enabled: boolean, path: string | null, publicLinks: boolean, concurrency: number, maxStorage: number, fontsDir: string | null, defaultFont: string | null }, music: { onlineLyrics: boolean, lyricsUrl: string, analyzeLoudness: boolean }, downloads: { path: string | null, import: ImportMode, port: number, upnp: boolean, dht: boolean, maxActive: number, downloadLimit: number, uploadLimit: number, slowDownloadLimit: number, slowUploadLimit: number, slowFrom: string | null, slowTo: string | null, bindInterface: string | null, proxy: string | null, seeding: { ratio: number | null, time: string | null, idle: string | null, then: SeedAction } }, automation: { defaultMonitor: Monitor, rssInterval: string, renameSuggestions: boolean, retry: Array<{ every: string, until: string }> }, requests: { monitor: Monitor }, signIn: { style: SignInStyle }, sources: Array<{ name: string, kind: SourceKind, url: string, feed: string | null, apiKey: string | null, categories: Array<number>, enabled: boolean, downloadPath: string | null, seeding: { ratio: number | null, time: string | null, idle: string | null, then: SeedAction } | null }>, profiles: Array<{ name: string, resolutions: Array<string>, groups: Array<string>, require: Array<string>, reject: Array<string>, minSize: number | null, maxSize: number | null, codecs: Array<string>, preferDualAudio: boolean, batches: boolean, minSeeders: number }>, libraries: Array<{ name: string, path: string, kind: LibraryKind, metadataProvider: Provider | null, managed: boolean, profile: string | null, downloadPath: string | null, resolvedPath: string | null, exists: boolean, error: string | null, titleCount: number, skippedCount: number }>, paths: { config: string, data: string, log: string } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const PersonFragmentDoc = new TypedDocumentString(`
    fragment Person on User {
  id
  username
  avatar
}
    `, {"fragmentName":"Person"}) as unknown as TypedDocumentString<PersonFragment, unknown>;
export const PermissionsFieldsFragmentDoc = new TypedDocumentString(`
    fragment PermissionsFields on Permissions {
  allLibraries
  libraries
  request
  autoApprove
  requestLimit
  manageRequests
  manageShows
  downloads
  editMetadata
  watchTogether
  shareLinks
  clip
  clipMaxLength
  clipLimit
  clipStorage
  clipLinks
}
    `, {"fragmentName":"PermissionsFields"}) as unknown as TypedDocumentString<PermissionsFieldsFragment, unknown>;
export const ViewerFragmentDoc = new TypedDocumentString(`
    fragment Viewer on User {
  ...Person
  isAdmin
  permissions {
    ...PermissionsFields
  }
}
    fragment Person on User {
  id
  username
  avatar
}
fragment PermissionsFields on Permissions {
  allLibraries
  libraries
  request
  autoApprove
  requestLimit
  manageRequests
  manageShows
  downloads
  editMetadata
  watchTogether
  shareLinks
  clip
  clipMaxLength
  clipLimit
  clipStorage
  clipLinks
}`, {"fragmentName":"Viewer"}) as unknown as TypedDocumentString<ViewerFragment, unknown>;
export const CardFragmentDoc = new TypedDocumentString(`
    fragment Card on Title {
  id
  kind
  library
  name
  year
  poster
  backdrop
  watchedCount
  videoCount
  progress
  freshCount
}
    `, {"fragmentName":"Card"}) as unknown as TypedDocumentString<CardFragment, unknown>;
export const VideoRowFragmentDoc = new TypedDocumentString(`
    fragment VideoRow on Video {
  id
  season
  episode
  episodeEnd
  label
  name
  overview
  still
  customStill
  airDate
  duration
  position
  finished
}
    `, {"fragmentName":"VideoRow"}) as unknown as TypedDocumentString<VideoRowFragment, unknown>;
export const TitleDetailFragmentDoc = new TypedDocumentString(`
    fragment TitleDetail on Title {
  ...Card
  customPoster
  customBackdrop
  overview
  genres
  rating
  path
  matchState
  provider
  providerId
  libraryProvider
  seasons {
    number
    name
    title
    overview
    poster
    episodes {
      ...VideoRow
    }
  }
  movie {
    ...VideoRow
  }
  nextUp {
    resuming
    video {
      ...VideoRow
    }
  }
}
    fragment Card on Title {
  id
  kind
  library
  name
  year
  poster
  backdrop
  watchedCount
  videoCount
  progress
  freshCount
}
fragment VideoRow on Video {
  id
  season
  episode
  episodeEnd
  label
  name
  overview
  still
  customStill
  airDate
  duration
  position
  finished
}`, {"fragmentName":"TitleDetail"}) as unknown as TypedDocumentString<TitleDetailFragment, unknown>;
export const PlaybackFragmentDoc = new TypedDocumentString(`
    fragment Playback on Video {
  id
  still
  label
  name
  position
  finished
  title {
    id
    kind
    name
    backdrop
  }
  previous {
    id
    label
    name
  }
  next {
    id
    still
    label
    name
  }
  media {
    duration
    video {
      index
      codec
      codecString
      width
      height
      fps
      bitDepth
      hdr
    }
    audio {
      index
      codec
      codecString
      channels
      language
      title
      default
    }
    subtitles {
      id
      codec
      language
      title
      default
      forced
      supported
    }
    fonts {
      index
      filename
    }
    chapters {
      start
      end
      title
    }
  }
}
    `, {"fragmentName":"Playback"}) as unknown as TypedDocumentString<PlaybackFragment, unknown>;
export const TranscodingFieldsFragmentDoc = new TypedDocumentString(`
    fragment TranscodingFields on Transcoding {
  vaapi
  vaapiError
  softwareH264
}
    `, {"fragmentName":"TranscodingFields"}) as unknown as TypedDocumentString<TranscodingFieldsFragment, unknown>;
export const DiscoverResultFieldsFragmentDoc = new TypedDocumentString(`
    fragment DiscoverResultFields on DiscoverResult {
  category
  provider
  id
  name
  romaji
  year
  poster
  overview
  library
  titleId
  seriesId
  monitor
  requestState
  because
}
    `, {"fragmentName":"DiscoverResultFields"}) as unknown as TypedDocumentString<DiscoverResultFieldsFragment, unknown>;
export const ClipFieldsFragmentDoc = new TypedDocumentString(`
    fragment ClipFields on Clip {
  id
  screenshot
  name
  mine
  canManage
  owner {
    ...Person
  }
  source {
    video {
      id
    }
    title {
      id
    }
    name
    kind
    label
    year
    status
  }
  start
  end
  audio
  subtitles
  quality {
    height
    halfRate
  }
  state
  progress
  error
  bytes
  width
  height
  fps
  renderedAt
  createdAt
  sharedAt
  public
  link
  linkLive
  recipients {
    user {
      ...Person
    }
    sharedAt
    hidden
  }
  file
  poster
}
    fragment Person on User {
  id
  username
  avatar
}`, {"fragmentName":"ClipFields"}) as unknown as TypedDocumentString<ClipFieldsFragment, unknown>;
export const ClipAllowanceFieldsFragmentDoc = new TypedDocumentString(`
    fragment ClipAllowanceFields on ClipAllowance {
  canClip
  canLink
  maxLength
  bytes
  rendered
  storage
  limit
  customDefaultFont
}
    `, {"fragmentName":"ClipAllowanceFields"}) as unknown as TypedDocumentString<ClipAllowanceFieldsFragment, unknown>;
export const NotificationFieldsFragmentDoc = new TypedDocumentString(`
    fragment NotificationFields on Notification {
  id
  kind
  priority
  title
  body
  image
  link
  actor {
    ...Person
  }
  createdAt
  expiresAt
  readAt
}
    fragment Person on User {
  id
  username
  avatar
}`, {"fragmentName":"NotificationFields"}) as unknown as TypedDocumentString<NotificationFieldsFragment, unknown>;
export const DownloadFieldsFragmentDoc = new TypedDocumentString(`
    fragment DownloadFields on Download {
  category
  id
  name
  seriesId
  seriesName
  title {
    id
  }
  poster
  episodes {
    season
    episode
  }
  source
  size
  savePath
  state
  importState
  importError
  importMode
  error
  addedAt
  finishedAt
  importedAt
  requestedBy {
    username
  }
  live {
    stage
    paused
    progress
    downloadRate
    uploadRate
    done
    uploaded
    ratio
    peers
    seeds
    seedingSeconds
    eta
    pieces
  }
  seedGoal {
    ratio
    seconds
  }
}
    `, {"fragmentName":"DownloadFields"}) as unknown as TypedDocumentString<DownloadFieldsFragment, unknown>;
export const EngineFieldsFragmentDoc = new TypedDocumentString(`
    fragment EngineFields on DownloadEngine {
  version
  downloadRate
  uploadRate
  active
  killSwitch
  listening
  listenError
  slowHours
  downloadPath
}
    `, {"fragmentName":"EngineFields"}) as unknown as TypedDocumentString<EngineFieldsFragment, unknown>;
export const SeriesEpisodeFieldsFragmentDoc = new TypedDocumentString(`
    fragment SeriesEpisodeFields on SeriesEpisode {
  season
  episode
  absolute
  name
  airAt
  aired
  state
  attempts
  searchedAt
  nextSearch
  downloadId
  video {
    id
  }
}
    `, {"fragmentName":"SeriesEpisodeFields"}) as unknown as TypedDocumentString<SeriesEpisodeFieldsFragment, unknown>;
export const SeedingFieldsFragmentDoc = new TypedDocumentString(`
    fragment SeedingFields on Seeding {
  ratio
  time
  idle
  then
}
    `, {"fragmentName":"SeedingFields"}) as unknown as TypedDocumentString<SeedingFieldsFragment, unknown>;
export const SeriesFieldsFragmentDoc = new TypedDocumentString(`
    fragment SeriesFields on Series {
  id
  monitor
  status
  next {
    ...SeriesEpisodeFields
  }
  title {
    id
  }
  library
  managed
  path
  name
  year
  poster
  overview
  provider
  providerId
  profile
  effectiveProfile
  sources
  groups
  aliases
  knownAs
  numbering
  naming
  style {
    file
    folder
    agreement
    samples
  }
  seeding {
    ...SeedingFields
  }
  scheduleAt
  addedAt
  counts {
    have
    wanted
    missing
    grabbed
    total
    upcoming
    skipped
  }
  episodes {
    ...SeriesEpisodeFields
  }
}
    fragment SeriesEpisodeFields on SeriesEpisode {
  season
  episode
  absolute
  name
  airAt
  aired
  state
  attempts
  searchedAt
  nextSearch
  downloadId
  video {
    id
  }
}
fragment SeedingFields on Seeding {
  ratio
  time
  idle
  then
}`, {"fragmentName":"SeriesFields"}) as unknown as TypedDocumentString<SeriesFieldsFragment, unknown>;
export const ReleaseCandidateFieldsFragmentDoc = new TypedDocumentString(`
    fragment ReleaseCandidateFields on ReleaseCandidate {
  release {
    title
    source
    link
    infoHash
    size
    seeders
    leechers
    published
    page
  }
  attributes {
    group
    resolution
    codec
    source
    dualAudio
    version
    proper
    tenBit
  }
  episodes {
    season
    episode
  }
  batch
  verdict {
    accepted
    score
    rejections
    warnings
    nonstandard
  }
}
    `, {"fragmentName":"ReleaseCandidateFields"}) as unknown as TypedDocumentString<ReleaseCandidateFieldsFragment, unknown>;
export const CalendarEntryFieldsFragmentDoc = new TypedDocumentString(`
    fragment CalendarEntryFields on CalendarEntry {
  seriesId
  title {
    id
  }
  library
  show
  poster
  backdrop
  monitor
  season
  episode
  absolute
  name
  airAt
  state
  video {
    id
  }
  download {
    stage
    progress
    downloadRate
    eta
  }
}
    `, {"fragmentName":"CalendarEntryFields"}) as unknown as TypedDocumentString<CalendarEntryFieldsFragment, unknown>;
export const SettingsFieldsFragmentDoc = new TypedDocumentString(`
    fragment SettingsFields on Settings {
  network {
    host
    port
    cors
  }
  log {
    level
  }
  scan {
    watch
    interval
  }
  metadata {
    tmdbApiKey
    language
  }
  transcode {
    hardware
    vaapiDevice
  }
  clips {
    enabled
    path
    publicLinks
    concurrency
    maxStorage
    fontsDir
    defaultFont
  }
  music {
    onlineLyrics
    lyricsUrl
    analyzeLoudness
  }
  downloads {
    path
    import
    port
    upnp
    dht
    maxActive
    downloadLimit
    uploadLimit
    slowDownloadLimit
    slowUploadLimit
    slowFrom
    slowTo
    bindInterface
    proxy
    seeding {
      ...SeedingFields
    }
  }
  automation {
    defaultMonitor
    rssInterval
    retry {
      every
      until
    }
    renameSuggestions
  }
  requests {
    monitor
  }
  signIn {
    style
  }
  sources {
    name
    kind
    url
    feed
    apiKey
    categories
    enabled
    downloadPath
    seeding {
      ...SeedingFields
    }
  }
  profiles {
    name
    resolutions
    groups
    require
    reject
    minSize
    maxSize
    codecs
    preferDualAudio
    batches
    minSeeders
  }
  libraries {
    name
    path
    kind
    metadataProvider
    managed
    profile
    downloadPath
    resolvedPath
    exists
    error
    titleCount
    skippedCount
  }
  raw
  error
  paths {
    config
    data
    log
  }
}
    fragment SeedingFields on Seeding {
  ratio
  time
  idle
  then
}`, {"fragmentName":"SettingsFields"}) as unknown as TypedDocumentString<SettingsFieldsFragment, unknown>;
export const SignInServerDocument = new TypedDocumentString(`
    query SignInServer {
  server {
    setupRequired
    signInStyle
  }
}
    `) as unknown as TypedDocumentString<SignInServerQuery, SignInServerQueryVariables>;
export const SignInProfilesDocument = new TypedDocumentString(`
    query SignInProfiles {
  signInProfiles {
    key
    avatar
    passkey
  }
}
    `) as unknown as TypedDocumentString<SignInProfilesQuery, SignInProfilesQueryVariables>;
export const SetupDocument = new TypedDocumentString(`
    mutation Setup($username: String!, $password: String!) {
  setup(username: $username, password: $password) {
    user {
      ...Person
    }
    token
  }
}
    fragment Person on User {
  id
  username
  avatar
}`) as unknown as TypedDocumentString<SetupMutation, SetupMutationVariables>;
export const SignInDocument = new TypedDocumentString(`
    mutation SignIn($username: String, $profile: String, $password: String!) {
  signIn(username: $username, profile: $profile, password: $password) {
    user {
      ...Person
    }
    token
  }
}
    fragment Person on User {
  id
  username
  avatar
}`) as unknown as TypedDocumentString<SignInMutation, SignInMutationVariables>;
export const StatusDocument = new TypedDocumentString(`
    query Status {
  server {
    version
    setupRequired
    clips
    downloads
    sources
  }
  viewer {
    ...Viewer
  }
}
    fragment Person on User {
  id
  username
  avatar
}
fragment PermissionsFields on Permissions {
  allLibraries
  libraries
  request
  autoApprove
  requestLimit
  manageRequests
  manageShows
  downloads
  editMetadata
  watchTogether
  shareLinks
  clip
  clipMaxLength
  clipLimit
  clipStorage
  clipLinks
}
fragment Viewer on User {
  ...Person
  isAdmin
  permissions {
    ...PermissionsFields
  }
}`) as unknown as TypedDocumentString<StatusQuery, StatusQueryVariables>;
export const AppearanceDocument = new TypedDocumentString(`
    query Appearance {
  appearance {
    mode
    style
    mediaTint
    light {
      id
      palette {
        tokens {
          name
          value
        }
      }
    }
    dark {
      id
      palette {
        tokens {
          name
          value
        }
      }
    }
  }
}
    `) as unknown as TypedDocumentString<AppearanceQuery, AppearanceQueryVariables>;
export const SignOutDocument = new TypedDocumentString(`
    mutation SignOut {
  signOut
}
    `) as unknown as TypedDocumentString<SignOutMutation, SignOutMutationVariables>;