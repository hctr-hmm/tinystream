// SPDX-License-Identifier: AGPL-3.0-or-later

package dev.tinystream.about

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import uniffi.tinystream_about.version

class AboutModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TinystreamAbout")

    Function("version") { version() }
  }
}
