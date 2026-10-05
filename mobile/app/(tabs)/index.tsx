// SPDX-License-Identifier: AGPL-3.0-or-later
// Home, for now: just the version warning (#44 builds the real one).

import { MismatchBanner } from '../../src/components/MismatchBanner'
import { Screen } from '../../src/components/Screen'

export default function Home() {
  return (
    <Screen title="Home">
      <MismatchBanner />
    </Screen>
  )
}
