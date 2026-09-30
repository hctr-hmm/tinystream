<div align="center">

# tinystream

A small self-hosted media server for your shows and movies.

[![CI](https://github.com/tinystream-dev/tinystream/actions/workflows/ci.yml/badge.svg)](https://github.com/tinystream-dev/tinystream/actions/workflows/ci.yml)
[![Release](https://github.com/tinystream-dev/tinystream/actions/workflows/release.yml/badge.svg)](https://github.com/tinystream-dev/tinystream/actions/workflows/release.yml)
[![Latest release](https://img.shields.io/github/v/release/tinystream-dev/tinystream?sort=semver)](https://github.com/tinystream-dev/tinystream/releases/latest)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue.svg)](LICENSE)
[![Rust 1.94+](https://img.shields.io/badge/rust-1.94%2B-orange.svg)](https://www.rust-lang.org)

</div>

## Installation

### Prebuilt binaries

Download the archive for your architecture from the [latest release](https://github.com/phrolova/tinystream/releases/latest), unpack it and run it:

```sh
tar xzf tinystream-*-x86_64.tar.gz
cd tinystream-*/
./tinystream
```

FFmpeg and libtorrent are linked in statically. At runtime tinystream needs a few common system libraries: libva and libdrm (for the GPU), OpenSSL, libstdc++, zlib, bzip2 and xz.

On first run tinystream writes a commented config to `~/.config/tinystream/config.toml` and serves the UI on <http://localhost:3000>. The first account you create is the admin.

### Building from source

You need Rust 1.94 or newer, bun or npm (for the web UI), and what the bundled FFmpeg and libtorrent builds use: curl, tar, git, make, meson, ninja, autotools, a C/C++17 compiler, libclang, and the OpenSSL, libdrm, zlib, bzip2 and xz headers.

```sh
git clone https://github.com/tinystream-dev/tinystream
cd tinystream
cargo build --release
```

The result is `target/release/tinystream`.

The first build compiles FFmpeg (with x264, dav1d, libva and libass) and libtorrent from source into `.native/`, which takes a few minutes. Each library is a crate under `native/`, so cargo's progress bar shows which one it's on, and each one's output goes to `.native/<library>-<version>/build.log`. Later builds reuse it, even after `cargo clean`.

| Variable | Effect |
| --- | --- |
| `TS_FFMPEG_NATIVE=1` | Tunes FFmpeg for your CPU (the result isn't portable). |
| `TINYSTREAM_NATIVE_DIR` | Builds the native libraries somewhere other than `.native/`. |
| `TINYSTREAM_SKIP_WEB_BUILD=1` | Embeds the UI already in `web/dist` instead of building it. |

### Cargo features

All on by default:

| Feature | What it adds |
| --- | --- |
| `web-ui` | Embeds the web UI into the binary. |
| `metadata` | Titles, artwork, descriptions and airing schedules from AniList, TMDB and TVmaze. Without it, you won't have metadata fetching |
| `torrent` | Downloads and library management: the torrent client, sources, monitoring, imports and renames. Implies `metadata`. |

Build with `--no-default-features` for a plain media server, or pick what you want, e.g. `--no-default-features --features web-ui,metadata`.

## License

Released under the [AGPL-3.0-or-later](./LICENSE) open-source license.
