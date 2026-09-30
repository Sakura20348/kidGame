// Who in my class is online: the server records "last seen" (POST /api/presence) and
// sends the times of the people in my class as "pragmalab.members".

import { api, getToken } from "@/lib/api"

const STORAGE_KEY = "pragmalab.members"

export type JoinedUser = {
  email: string
  joinedAt: string // ISO
  lastSeen: string // ISO
}

/** Someone is "online" if they were active within this window. */
export const ONLINE_WINDOW_MS = 2 * 60 * 1000

export function readJoined(): JoinedUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

/** "I'm here" – refreshes the signed-in user's last-seen time on the server. */
export function touch(_email: string) {
  if (getToken()) void api("/api/presence", { body: {} }).catch(() => undefined)
}

/** Marks the user as gone, so the green "online" dot goes off right away. */
export function markAway(_email: string) {
  if (getToken()) void api("/api/presence", { body: { away: true }, keepalive: true }).catch(() => undefined)
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

/** "just now", "5 minutes ago", "3 hours ago", "yesterday" … */
export function lastSeenLabel(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return "just now"
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour")
  return rtf.format(Math.round(diff / 86400), "day")
}

/** "bakhrambek.khaitbaev@..." -> "Bakhrambek Khaitbaev" */
export function nameFromEmail(email: string | null) {
  const local = email?.split("@")[0] ?? ""
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
}
