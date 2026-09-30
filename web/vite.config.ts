// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In development, API calls go to a running tinystream (default port 3000).
const api = process.env.TINYSTREAM_API ?? 'http://127.0.0.1:3000'

export default defineConfig({
  server: {
    proxy: { '/api': { target: api, changeOrigin: false, ws: true } },
    headers: {
      // Lets the subtitle renderer use threads (SharedArrayBuffer).
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: { outputPath: '/index.html' },
      },
    }),
    react(),
  ],
})
