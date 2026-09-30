// Keeps this browser's "pragmalab.*" data in step with the API server (server/), so every
// window, browser and device sees the same classes, lessons and results.
//
// How: every localStorage write of a shared key is queued and sent to POST /api/sync;
// every few seconds GET /api/sync?since=<version> brings in changes from elsewhere.
// The server only accepts and returns what the signed-in user may see (their own data
// and their class), so syncing needs a sign-in token. Without the server (offline) the
// app keeps working on local data and sends the queued changes once it is back.

import { apiUrl, authHeaders, getToken, SIGNED_OUT_EVENT, TOKEN_KEY } from "@/lib/api"

const POLL_MS = Number(import.meta.env.VITE_SYNC_INTERVAL_MS) || 3000
const OFFLINE_RETRY_MS = 15000
// not "pragmalab." so these are never synced themselves; one set per account
const versionKey = (who: string) => `pragmalabSync.version:${who.toLowerCase()}`
const pendingKey = (who: string) => `pragmalabSync.pending:${who.toLowerCase()}`

/** Per-tab / per-device keys that must never be shared. */
const LOCAL_ONLY = new Set([
  "pragmalab.email",
  "pragmalab.role",
  TOKEN_KEY,
  "pragmalab.verify.session",
  "pragmalab.verify.pending",
  "pragmalab.studentView.layout",
])
const shared = (key: string) => key.startsWith("pragmalab.") && !LOCAL_ONLY.has(key)

const proto = Storage.prototype
const rawSet = proto.setItem
const rawRemove = proto.removeItem
let applying = false // true while writing server data, so it isn't sent back
let flushTimer: number | undefined
let online = false
let blocked = false // signed out, or a teacher who hasn't entered their email code yet

/** The account signed in in this tab. */
function who(): string | null {
  try {
    return sessionStorage.getItem("pragmalab.email") ?? localStorage.getItem("pragmalab.email")
  } catch {
    return null
  }
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T
  } catch {
    return fallback
  }
}

const version = (me: string) => readJSON<number>(versionKey(me), 0)
const setVersion = (me: string, v: number) => rawSet.call(localStorage, versionKey(me), JSON.stringify(v))
const readPending = (me: string) => readJSON<Record<string, string | null>>(pendingKey(me), {})
const savePending = (me: string, p: Record<string, string | null>) => rawSet.call(localStorage, pendingKey(me), JSON.stringify(p))

function queue(key: string, value: string | null) {
  const me = who()
  if (!me) return
  const pending = readPending(me)
  pending[key] = value
  savePending(me, pending)
  window.clearTimeout(flushTimer)
  flushTimer = window.setTimeout(() => void flush(), 300)
}

/** Handles "not signed in" (401) and "email code needed" (403) answers. */
function refused(status: number) {
  if (status === 401) {
    blocked = true
    if (getToken()) window.dispatchEvent(new Event(SIGNED_OUT_EVENT))
    return true
  }
  if (status === 403) {
    blocked = true // waits until the teacher confirms their code (syncNow() is called then)
    return true
  }
  return false
}

/** Sends queued changes (in small batches). */
async function flush() {
  const me = who()
  if (!me || !getToken()) return
  const entries = Object.entries(readPending(me))
  for (let i = 0; i < entries.length; i += 100) {
    const batch = entries.slice(i, i + 100)
    try {
      const res = await fetch(apiUrl("/api/sync"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ items: batch.map(([key, value]) => ({ key, value })) }),
      })
      if (refused(res.status)) return
      if (!res.ok) throw new Error(String(res.status))
      online = true
      // forget what was sent (unless it changed again meanwhile); refused keys stay on this device only
      const pending = readPending(me)
      for (const [key, value] of batch) if (pending[key] === value) delete pending[key]
      savePending(me, pending)
    } catch {
      online = false
      return // try again on the next poll
    }
  }
}

/** Events other parts of the app already listen to. */
function announce(keys: string[]) {
  if (keys.length === 0) return
  const has = (part: string) => keys.some((k) => k.includes(part))
  if (has("classes")) window.dispatchEvent(new Event("pragmalab:classes"))
  if (has("assignments")) window.dispatchEvent(new Event("pragmalab:assignments"))
  if (has("avatar")) window.dispatchEvent(new Event("pragmalab:avatar"))
  window.dispatchEvent(new CustomEvent("pragmalab:sync", { detail: keys }))
}

/** Brings in changes made elsewhere. */
async function pull(me: string, since: number) {
  try {
    const res = await fetch(apiUrl(`/api/sync?since=${since}`), { headers: authHeaders() })
    if (refused(res.status)) return null
    if (!res.ok) throw new Error(String(res.status))
    const data: { version: number; items: { key: string; value: string | null }[] } = await res.json()
    online = true
    const pending = readPending(me)
    const changed: string[] = []
    applying = true
    try {
      for (const { key, value } of data.items) {
        if (!shared(key) || key in pending) continue // our own unsent change wins
        if (localStorage.getItem(key) === value) continue
        if (value === null) rawRemove.call(localStorage, key)
        else rawSet.call(localStorage, key, value)
        changed.push(key)
      }
    } finally {
      applying = false
    }
    setVersion(me, data.version)
    announce(changed)
    return data
  } catch {
    online = false
    return null
  }
}

/** This account's own keys on this device ("pragmalab.<name>:<me>"). */
function localOwn(me: string) {
  const out: [string, string][] = []
  const suffix = `:${me.toLowerCase()}`
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && shared(k) && k.toLowerCase().endsWith(suffix)) out.push([k, localStorage.getItem(k) ?? ""])
  }
  return out
}

let running: Promise<void> | null = null

/** Sends and fetches right now (e.g. just after signing in). */
export function syncNow(): Promise<void> {
  const me = who()
  if (!me || !getToken()) return Promise.resolve()
  blocked = false
  running ??= (async () => {
    try {
      const firstTime = version(me) === 0 // this account has never synced on this device
      await flush()
      const data = await pull(me, version(me))
      if (firstTime && data) {
        // first sync here: send this account's data the server doesn't have yet (e.g. from before the server)
        const onServer = new Set(data.items.map((i) => i.key))
        const pending = readPending(me)
        for (const [k, v] of localOwn(me)) if (!onServer.has(k)) pending[k] = v
        savePending(me, pending)
        await flush()
      }
    } finally {
      running = null
    }
  })()
  return running
}

/** Watch writes, catch up with the server, then keep polling. Resolves quickly even when offline. */
export async function startSync() {
  if (typeof window === "undefined" || !("localStorage" in window)) return

  proto.setItem = function (key: string, value: string) {
    rawSet.call(this, key, value)
    if (this === localStorage && !applying && shared(key)) queue(key, String(value))
  }
  proto.removeItem = function (key: string) {
    rawRemove.call(this, key)
    if (this === localStorage && !applying && shared(key)) queue(key, null)
  }

  // don't keep the app waiting long when the server is down
  await Promise.race([syncNow(), new Promise((r) => setTimeout(r, 2500))])

  // every few seconds while the server answers; when it's down, try again only every 15s
  let wait = 0
  window.setInterval(() => {
    if (document.visibilityState !== "visible" || blocked || !getToken()) return
    if (!online && (wait += POLL_MS) < OFFLINE_RETRY_MS) return
    wait = 0
    void syncNow()
  }, POLL_MS)
  window.addEventListener("focus", () => void syncNow())
}

export const isSyncOnline = () => online
