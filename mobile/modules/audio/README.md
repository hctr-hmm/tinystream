# Music audio

`TinystreamAudio` adapts the shared TypeScript queue to an Android foreground
media service. Kotlin owns authenticated range/file I/O, audio focus and
`AudioTrack`; `mobile/crates/decoder` exposes the platform-independent decoder
and sequencer in `decoder/core` through UniFFI. Android enables Opus; WASM does not.

Marks are emitted when the playback head reaches them. Decoding ahead does not
advance the JS queue. Replacing an unheard successor rewinds pending PCM; if it
was already submitted to AudioTrack, the engine reloads from the audible
position. Unedited playback keeps one continuous AudioTrack stream.

The service exposes the queue timeline to Media3 and sends transport commands
back to JS. A React Native headless task keeps the queue controller running
after the activity closes. Clearing the queue stops the service and that task.
Transient focus loss keeps the focus request so playback can resume on regain.

## Checks

From the repository root:

```sh
cargo test -p tinystream-decoder-core --features opus
bun run --cwd packages/shared test
bun run --cwd mobile test
bun run --cwd mobile typecheck
```

After `bun run android` has generated the Android project, with an emulator or
device connected:

```sh
cd mobile/android
./gradlew :audio:connectedDebugAndroidTest -PreactNativeArchitectures=arm64-v8a
```

The device tests exercise native MP3/Opus trimming, audible AudioTrack marks,
pause, screen-off playback, transient audio focus loss/regain, MediaSession
next/seek commands, and media notification handoff/repeated service starts.

For manual acceptance, play consecutive album tracks and tracks from different
albums, change gain/crossfade settings, edit the queue from another client, seek
from lyrics and the notification, and remove the activity from recents. Check
headset unplug, Bluetooth media keys and transient focus loss on a physical
device. OEM media surfaces use the standard MediaSession; their appearance
requires a device from the relevant vendor.
