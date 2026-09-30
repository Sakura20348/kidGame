/// <reference types="vite/client" />

// Settings from .env (see .env.example). Only VITE_* values reach the browser – never put secrets here.
interface ImportMetaEnv {
  /** Where the API server lives, e.g. https://api.example.com. Empty = same site (dev: Vite forwards /api). */
  readonly VITE_API_URL?: string
  /** How often to fetch changes from the server, in milliseconds (default 3000). */
  readonly VITE_SYNC_INTERVAL_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
