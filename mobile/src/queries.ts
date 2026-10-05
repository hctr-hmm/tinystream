// SPDX-License-Identifier: AGPL-3.0-or-later
// What several screens ask the active server.

import { useQuery } from '@tanstack/react-query'
import { graphql } from './gql'
import { useApi } from './session'

const StatusQuery = graphql(`
  query Status {
    server {
      version
      setupRequired
      clips
      downloads
      sources
    }
    viewer {
      ...Viewer
    }
  }
`)

/** Who's signed in, and what this server is and can do. */
export function useStatus() {
  const api = useApi()
  return useQuery({ queryKey: ['auth'], queryFn: () => api.request(StatusQuery) })
}

export const AppearanceQuery = graphql(`
  query Appearance {
    appearance {
      mode
      style
      mediaTint
      light {
        id
        palette {
          tokens {
            name
            value
          }
        }
      }
      dark {
        id
        palette {
          tokens {
            name
            value
          }
        }
      }
    }
  }
`)
