// SPDX-License-Identifier: AGPL-3.0-or-later
// What the app's Rust code was built from (mobile/crates/about).

import { requireNativeModule } from 'expo'

const About = requireNativeModule<{ version(): string }>('TinystreamAbout')

/** The version the Rust crates were built as; the same as the app's. */
export const nativeVersion = () => About.version()
