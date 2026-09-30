import { kidsKey } from "@/lib/kids-storage"

// Daily activity per account, used by the dashboard's activity calendar.
// TODO: record this on the server so it follows the user across devices.

export type ActivityKind = "lesson" | "game" | "assignment"
export type DayActivity = Record<ActivityKind, number>
export type ActivityLog = Record<string, DayActivity> // "2026-09-28" → counts

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

export function readActivity(email: string | null): ActivityLog {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(email, "activity")) ?? "{}")
  } catch {
    return {}
  }
}

/** Adds one activity to today's square. */
export function logActivity(email: string | null, kind: ActivityKind) {
  if (!email) return
  const log = readActivity(email)
  const today = dayKey(new Date())
  const day = log[today] ?? { lesson: 0, game: 0, assignment: 0 }
  day[kind] += 1
  log[today] = day
  try {
    localStorage.setItem(kidsKey(email, "activity"), JSON.stringify(log))
  } catch {
    // ignore
  }
}

/** Example history (same every time) shown until real activity builds up. */
export function sampleActivity(year: number, until: Date): ActivityLog {
  const log: ActivityLog = {}
  const rand = (n: number) => {
    const x = Math.sin(n * 91.7 + year * 13.1) * 43758.5453
    return x - Math.floor(x)
  }
  for (let d = new Date(year, 0, 1); d.getFullYear() === year && d <= until; d.setDate(d.getDate() + 1)) {
    const n = d.getMonth() * 31 + d.getDate()
    const weekday = d.getDay() !== 0 && d.getDay() !== 6
    const busy = rand(n)
    if (busy < (weekday ? 0.35 : 0.7)) continue // quiet day
    log[dayKey(d)] = {
      lesson: Math.floor(rand(n + 1) * (weekday ? 4 : 2)),
      game: Math.floor(rand(n + 2) * 3),
      assignment: rand(n + 3) > 0.7 ? 1 : 0,
    }
  }
  return log
}
