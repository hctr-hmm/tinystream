// SPDX-License-Identifier: AGPL-3.0-or-later
import { AppRegistry } from 'react-native'

// The foreground service keeps the existing queue controller alive after the activity closes.
AppRegistry.registerHeadlessTask('TinystreamMusic', () => async () => new Promise<void>(() => {}))
