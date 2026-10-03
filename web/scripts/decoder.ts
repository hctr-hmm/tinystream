// SPDX-License-Identifier: AGPL-3.0-or-later
// Builds the music player's decoder (web/decoder, Rust) into target/wasm/pkg:
// cargo for wasm32, then wasm-bindgen, then wasm-opt when it's installed.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dir, '../..')
const target = join(root, 'target/wasm')
const out = join(target, 'pkg')

// Whatever cargo set for an outer build (rustflags for the host, a linker) mustn't reach this one.
const env = { ...process.env }
for (const key of Object.keys(env)) if (key.startsWith('CARGO_') || key === 'RUSTFLAGS' || key === 'RUSTC_WRAPPER') delete env[key]
env.CARGO_TARGET_DIR = target

function run(cmd: string, args: string[], hint: string) {
  const r = spawnSync(cmd, args, { cwd: root, env, stdio: 'inherit' })
  if (r.error || r.status !== 0) {
    console.error(`\n${cmd} failed. ${hint}`)
    process.exit(1)
  }
}

run(
  'cargo',
  ['build', '-p', 'tinystream-decoder', '--target', 'wasm32-unknown-unknown', '--release'],
  'The music player needs the wasm32 target: `rustup target add wasm32-unknown-unknown`.',
)
mkdirSync(out, { recursive: true })
run(
  'wasm-bindgen',
  ['--target', 'web', '--out-dir', out, join(target, 'wasm32-unknown-unknown/release/tinystream_decoder.wasm')],
  'Install the wasm-bindgen CLI at the version web/decoder pins: `cargo install wasm-bindgen-cli --version 0.2.126`.',
)
const wasm = join(out, 'tinystream_decoder_bg.wasm')
const opt = spawnSync('wasm-opt', ['--version'])
if (!opt.error && opt.status === 0 && existsSync(wasm)) run('wasm-opt', ['-O3', '--enable-bulk-memory', '--enable-nontrapping-float-to-int', wasm, '-o', wasm], '')
