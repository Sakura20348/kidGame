// Notification choices (Settings → Notifications), saved with the account so they apply on every device.

import { kidsKey } from "@/lib/kids-storage"

export type StudentPrefs = { reminders: boolean; assignments: boolean; report: boolean; kids: boolean }
export type TeacherPrefs = { work: boolean; joins: boolean; report: boolean }

export const studentDefaults: StudentPrefs = { reminders: true, assignments: true, report: false, kids: true }
export const teacherDefaults: TeacherPrefs = { work: true, joins: true, report: false }

export const prefsKey = (email: string | null, teacher: boolean) => kidsKey(email, teacher ? "settings.teacherNotifications" : "settings.notifications")

export function readPrefs(email: string | null, teacher: false): StudentPrefs
export function readPrefs(email: string | null, teacher: true): TeacherPrefs
export function readPrefs(email: string | null, teacher: boolean): StudentPrefs | TeacherPrefs {
  const fallback = teacher ? teacherDefaults : studentDefaults
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(prefsKey(email, teacher)) ?? "{}") }
  } catch {
    return fallback
  }
}

// ------------------------------------------------------------ "only once per day / week" and "already told"

const memoKey = (email: string | null) => kidsKey(email, "notified")
type Memo = { lastReminder?: string; lastReport?: string; seen?: Record<string, string[]> }

export function readMemo(email: string | null): Memo {
  try {
    return JSON.parse(localStorage.getItem(memoKey(email)) ?? "{}")
  } catch {
    return {}
  }
}

export function writeMemo(email: string | null, memo: Memo) {
  try {
    localStorage.setItem(memoKey(email), JSON.stringify(memo))
  } catch {
    // ignore
  }
}

/** Remembers the ids of one kind of thing already notified; returns the ones that are new since last time. */
export function newSince(email: string | null, kind: string, ids: string[]): { fresh: string[]; firstTime: boolean } {
  const memo = readMemo(email)
  const seen = memo.seen?.[kind]
  const fresh = seen ? ids.filter((id) => !seen.includes(id)) : []
  writeMemo(email, { ...memo, seen: { ...memo.seen, [kind]: ids.slice(-300) } })
  return { fresh, firstTime: !seen }
}

export const daysBetween = (a: string, b: Date) => Math.floor((b.getTime() - new Date(a).getTime()) / 86400000)
