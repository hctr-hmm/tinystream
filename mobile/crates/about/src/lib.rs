// SPDX-License-Identifier: AGPL-3.0-or-later
//
// What the app's native code was built from. Mostly here to keep the path
// from Rust to Kotlin (cargo-ndk, uniffi) working end to end.

uniffi::setup_scaffolding!();

/// The workspace version this was built as.
#[uniffi::export]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_owned()
}
