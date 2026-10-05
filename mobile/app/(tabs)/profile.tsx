// SPDX-License-Identifier: AGPL-3.0-or-later
// Profile, for now: signing out and the debug screen (#44 builds the real one).

import { useRouter } from 'expo-router'
import { Bug, LogOut, Server } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { Avatar } from '../../src/components/Avatar'
import { Screen } from '../../src/components/Screen'
import { useSwitcher } from '../../src/components/Switcher'
import { Button } from '../../src/components/ui'
import { signOut } from '../../src/servers'
import { useSession } from '../../src/session'
import { useTheme } from '../../src/theme/ThemeProvider'

export default function Profile() {
  const { server } = useSession()
  const { open } = useSwitcher()
  const router = useRouter()
  const { tokens } = useTheme()
  return (
    <Screen title="Profile">
      <View className="items-center gap-2 py-4">
        <Avatar user={server} size={96} />
        <Text className="font-sans text-xl font-semibold text-ink">{server.username}</Text>
        <Text className="font-sans text-sm text-ink-2">{server.url}</Text>
      </View>
      <View className="gap-2">
        <Button size="lg" icon={<Server size={18} color={tokens.ink} />} onPress={open}>
          Switch server
        </Button>
        <Button size="lg" icon={<Bug size={18} color={tokens.ink} />} onPress={() => router.push('/debug')}>
          Debug screen
        </Button>
        <Button size="lg" variant="danger" icon={<LogOut size={18} color={tokens.danger} />} onPress={() => void signOut(server.id)}>
          Sign out
        </Button>
      </View>
    </Screen>
  )
}
