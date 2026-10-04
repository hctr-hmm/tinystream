// SPDX-License-Identifier: AGPL-3.0-or-later

package dev.tinystream.squircle

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SquircleModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TinystreamSquircle")

    View(SquircleView::class) {
      Prop("path") { view: SquircleView, path: String? -> view.setPath(path) }
      Prop("radius") { view: SquircleView, radius: Float -> view.setRadius(radius) }
    }
  }
}
