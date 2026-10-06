// SPDX-License-Identifier: AGPL-3.0-or-later
// The video player's place, until it's built (#45).

import { Play } from 'lucide-react-native'
import { Page } from '../../src/components/Page'
import { Soon } from '../../src/components/Soon'

export default function Watch() {
  return (
    <Page title="Player" large={false}>
      <Soon icon={Play} title="Playing videos comes soon" body="The app can't play videos yet. Open this one in tinystream in a browser for now." />
    </Page>
  )
}
