import { classStudents } from "@/lib/classes"
import { kidsKey } from "@/lib/kids-storage"

// Work a student hands in, kept per account (shared through the sync server).
// The teacher reads it in the dashboard inbox (✉), which marks it as seen.

export type SubmittedFile = { name: string; size: number; type: string; dataUrl?: string }

export type Submission = {
  id: string
  title: string
  assignmentId: string | null
  text: string
  files: SubmittedFile[]
  createdAt: string // ISO
  status: "sent"
  seenAt?: string // ISO – when the teacher opened it
}

/** Files up to this size are kept (as data URLs) so they can be opened again. */
export const KEEP_FILE_BYTES = 1_500_000
export const MAX_FILE_BYTES = 10_000_000

export function readSubmissions(email: string | null): Submission[] {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(email, "submissions")) ?? "[]")
  } catch {
    return []
  }
}

/** Saves the list; if storage is full, retries without the file contents. */
export function saveSubmissions(email: string | null, list: Submission[]) {
  const key = kidsKey(email, "submissions")
  try {
    localStorage.setItem(key, JSON.stringify(list))
    return true
  } catch {
    try {
      const light = list.map((s) => ({ ...s, files: s.files.map(({ dataUrl: _drop, ...f }) => f) }))
      localStorage.setItem(key, JSON.stringify(light))
    } catch {
      // ignore
    }
    return false
  }
}

export const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

export const prettySize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

// ------------------------------------------------------------ teacher inbox

export type InboxItem = Submission & { student: { id: string; name: string } }

/** Everything the students in a teacher's class sent, newest first. */
export function classSubmissions(teacher: string | null): InboxItem[] {
  return classStudents(teacher)
    .flatMap((s) => readSubmissions(s.id).map((sub) => ({ ...sub, student: { id: s.id, name: s.name } })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Marks a student's submission as opened by the teacher (the student sees "Seen by teacher"). */
export function markSeen(student: string, submissionId: string) {
  const list = readSubmissions(student)
  if (!list.some((s) => s.id === submissionId && !s.seenAt)) return
  saveSubmissions(student, list.map((s) => (s.id === submissionId ? { ...s, seenAt: new Date().toISOString() } : s)))
  window.dispatchEvent(new Event("pragmalab:submissions"))
}
