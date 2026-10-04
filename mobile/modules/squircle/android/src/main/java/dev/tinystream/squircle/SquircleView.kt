// SPDX-License-Identifier: AGPL-3.0-or-later

package dev.tinystream.squircle

import android.content.Context
import android.graphics.Matrix
import android.graphics.Outline
import android.graphics.Path
import android.view.View
import android.view.ViewOutlineProvider
import androidx.core.graphics.PathParser
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Clips itself and everything in it to a squircle. The path (in dp, from
 * the shared squircle maths) comes once the box has been measured; until
 * then it's a plain rounded rectangle of the same radius.
 */
class SquircleView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val density = context.resources.displayMetrics.density
  private var path: Path? = null
  private var radius = 0f

  init {
    clipToOutline = true
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        val p = path
        if (p != null) outline.setPath(p) else outline.setRoundRect(0, 0, view.width, view.height, radius * density)
      }
    }
  }

  // React Native measures and lays out the children; the LinearLayout underneath mustn't redo it.
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) =
    setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.getSize(heightMeasureSpec))

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) = Unit

  fun setPath(data: String?) {
    path = data?.takeIf { it.isNotEmpty() }?.let { d ->
      PathParser.createPathFromPathData(d).apply { transform(Matrix().apply { setScale(density, density) }) }
    }
    invalidateOutline()
  }

  fun setRadius(value: Float) {
    radius = value
    invalidateOutline()
  }
}
