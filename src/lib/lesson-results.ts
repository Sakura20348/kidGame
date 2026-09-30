// Finished lesson tests, saved per student so their teacher can see them.
// TODO: send results to the API (e.g. POST /lessons/:id/results).

import { classStudents } from "@/lib/classes"
import { kidsKey } from "@/lib/kids-storage"

export type LessonResult = {
  id: string
  resourceId: string
  lesson: string
  level: string
  takenAt: string // ISO
  minutes: number
  score: number // 0–5 (quiz questions right)
  points?: number // 0–100 for study-style lessons (all four steps)
}

export function readLessonResults(student: string | null): LessonResult[] {
  try {
    const list: LessonResult[] = JSON.parse(localStorage.getItem(kidsKey(student, "lessons")) ?? "[]")
    return list.map((r) => ({ ...r, level: "A1" })) // every lesson is A1 now (older results may say A2/B1)
  } catch {
    return []
  }
}

export function saveLessonResult(student: string | null, result: Omit<LessonResult, "id">) {
  if (!student) return
  const list = [{ ...result, id: `l-${Date.now()}` }, ...readLessonResults(student)]
  try {
    localStorage.setItem(kidsKey(student, "lessons"), JSON.stringify(list))
  } catch {
    // storage unavailable
  }
}

export type ClassResult = LessonResult & { student: { id: string; name: string } }

/** Every lesson result from the students in a teacher's class, newest first. */
export function classLessonResults(teacher: string | null): ClassResult[] {
  return classStudents(teacher)
    .flatMap((s) => readLessonResults(s.id).map((r) => ({ ...r, student: { id: s.id, name: s.name } })))
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
}

// ------------------------------------------------------------ started lessons (for "My progress")

export type StartedLesson = { resourceId: string; lesson: string; startedAt: string }

export function readStartedLessons(student: string | null): StartedLesson[] {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(student, "startedLessons")) ?? "[]")
  } catch {
    return []
  }
}

/** Remembers that the student opened a lesson (newest first, one entry per lesson). */
export function markLessonStarted(student: string | null, resourceId: string, lesson: string) {
  if (!student) return
  const list = [{ resourceId, lesson, startedAt: new Date().toISOString() }, ...readStartedLessons(student).filter((l) => l.resourceId !== resourceId)]
  try {
    localStorage.setItem(kidsKey(student, "startedLessons"), JSON.stringify(list))
  } catch {
    // storage unavailable
  }
}
