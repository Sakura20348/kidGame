import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from "path"

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

// Sends /api to the API server (API_PROXY_TARGET in .env); when it isn't running,
// print one short hint instead of a stack trace per request.
let lastHint = 0
const apiProxy = (target: string): ProxyOptions => ({
  target,
  configure: (proxy) => {
    proxy.on('error', (_err, _req, res) => {
      if (Date.now() - lastHint > 30_000) {
        lastHint = Date.now()
        console.warn(`[api] server not reachable at ${target} – start it with \`npm run server\` (the app keeps working offline)`)
      }
      if ('writeHead' in res && !res.headersSent) res.writeHead(503).end()
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = { '/api': apiProxy(env.API_PROXY_TARGET || 'http://127.0.0.1:8000') }
  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] }),
      // Offline support: caches the app shell, JS, CSS and fonts so the app
      // (games, saved items, projects) keeps working without internet.
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'LittleReaderLab',
          short_name: 'LittleReaderLab',
          description: 'Read. Explore. Grow. Interactive reading adventures for young English learners.',
          theme_color: '#1C5CC4',
          background_color: '#FFFDF8',
          display: 'standalone',
          start_url: '/',
          icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: 'index.html',
        },
      }),
    ],
    // the FastAPI server (server/) – `npm run server`
    server: { proxy },
    preview: { proxy },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
