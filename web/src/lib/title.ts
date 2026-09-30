// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect } from 'react'

/** Sets the tab's title while a page is showing. */
export function useTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return
    const before = document.title
    document.title = `${title} · tinystream`
    return () => {
      document.title = before
    }
  }, [title])
}
