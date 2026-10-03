// SPDX-License-Identifier: AGPL-3.0-or-later
// The pieces of tinystream's GraphQL API the UI shares: fragments for what
// shows up in several places, and their types. Each page keeps its own
// queries next to it; `bun run codegen` types them all from schema.graphql.

import { graphql } from '../gql'
import type {
  CalendarEntryFieldsFragment,
  CardFragment,
  ClipAllowanceFieldsFragment,
  ClipFieldsFragment,
  DiscoverResultFieldsFragment,
  DownloadFieldsFragment,
  EngineFieldsFragment,
  NotificationFieldsFragment,
  PermissionsFieldsFragment,
  PlaybackFragment,
  TranscodingFieldsFragment,
  PersonFragment,
  ReleaseCandidateFieldsFragment,
  SeriesEpisodeFieldsFragment,
  SeriesFieldsFragment,
  SettingsFieldsFragment,
  TitleDetailFragment,
  VideoRowFragment,
  ViewerFragment,
} from '../gql/graphql'

import { request } from './graphql'

export { ApiError, request, subscribe } from './graphql'
export type {
  ClipState,
  EpisodeState,
  Monitor,
  NotificationKind,
  Provider,
  SourceKind,
  TitleKind,
} from '../gql/graphql'

graphql(`
  fragment Person on User {
    id
    username
    avatar
  }
`)

graphql(`
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
`)

graphql(`
  fragment Viewer on User {
    ...Person
    isAdmin
    permissions {
      ...PermissionsFields
    }
  }
`)

graphql(`
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
`)

graphql(`
  fragment VideoRow on Video {
    id
    season
    episode
    episodeEnd
    label
    name
    overview
    still
    airDate
    duration
    position
    finished
  }
`)

graphql(`
  fragment TitleDetail on Title {
    ...Card
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
`)

graphql(`
  fragment Playback on Video {
    id
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
`)

graphql(`
  fragment TranscodingFields on Transcoding {
    vaapi
    vaapiError
    softwareH264
  }
`)

graphql(`
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
`)

graphql(`
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
`)

graphql(`
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
`)

graphql(`
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
`)

graphql(`
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
`)

graphql(`
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
`)

graphql(`
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
`)

graphql(`
  fragment SeedingFields on Seeding {
    ratio
    time
    idle
    then
  }
`)

graphql(`
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
`)

graphql(`
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
`)

graphql(`
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
`)

graphql(`
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
`)

/** Someone on this server, as anyone sees them. */
export type Person = PersonFragment
export type Permissions = PermissionsFieldsFragment
/** Whoever is signed in. */
export type User = ViewerFragment
/** A title, as a poster. */
export type Card = CardFragment
export type Episode = VideoRowFragment
export type Item = TitleDetailFragment
export type Season = Item['seasons'][number]
export type Transcoding = TranscodingFieldsFragment
/** A video, as the player needs it, and what the server can transcode with. */
export type Playback = PlaybackFragment & { transcoding: Transcoding }
export type SubtitleTrack = Playback['media']['subtitles'][number]
export type AudioTrack = Playback['media']['audio'][number]
export type Chapter = Playback['media']['chapters'][number]
export type DiscoverResult = DiscoverResultFieldsFragment
export type Clip = ClipFieldsFragment
export type ClipAllowance = ClipAllowanceFieldsFragment
export type Notice = NotificationFieldsFragment
export type Download = DownloadFieldsFragment
export type EngineOverview = EngineFieldsFragment
export type Series = SeriesFieldsFragment
export type SeriesEpisode = SeriesEpisodeFieldsFragment
export type ReleaseCandidate = ReleaseCandidateFieldsFragment
export type Release = ReleaseCandidate['release']
export type CalendarEntry = CalendarEntryFieldsFragment
export type Settings = SettingsFieldsFragment
export type ConfigLibrary = Settings['libraries'][number]
export type SourceConfig = Settings['sources'][number]
export type ProfileConfig = Settings['profiles'][number]
export type Seeding = NonNullable<SourceConfig['seeding']>
export type DownloadsConfig = Settings['downloads']
export type ClipsConfig = Settings['clips']

const LibrariesQuery = graphql(`
  query Libraries {
    libraries {
      name
      showCount
      movieCount
    }
  }
`)

export type Library = { name: string; showCount: number; movieCount: number }

/** The libraries you can see; cached under ['libraries']. */
export const librariesQuery = {
  queryKey: ['libraries'],
  queryFn: async (): Promise<Library[]> => (await request(LibrariesQuery)).libraries,
}

const SettingsQuery = graphql(`
  query Settings {
    settings {
      ...SettingsFields
    }
    server {
      transcoding {
        ...TranscodingFields
      }
    }
  }
`)

/** config.toml and what came of it (admins only), and what transcoding can use; cached under ['settings']. */
export const settingsQuery = {
  queryKey: ['settings'],
  queryFn: async (): Promise<Settings & { transcoding: Transcoding }> => {
    const r = await request(SettingsQuery)
    return { ...r.settings, transcoding: r.server.transcoding }
  },
}
