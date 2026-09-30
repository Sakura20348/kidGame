import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

import App from './App.tsx'
import { startSync } from './lib/sync'

// Caches the app for offline use (active in production builds).
registerSW({ immediate: true })

// Load the shared data from the sync server first (gives up after ~2.5s when it's offline).
void startSync().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
