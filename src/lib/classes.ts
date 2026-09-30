// Classes: a teacher gets a class code, and students join with that code.
// Students only get in through their teacher's class. The server keeps the classes
// (/api/classes) and sends each user their own class as "pragmalab.classes".

import { findAccount, homeFor, needsClass, type Role } from "@/lib/accounts"
import { api } from "@/lib/api"
import { readJoined } from "@/lib/presence"
import { syncNow } from "@/lib/sync"
import { isVerifiedSession, isVerifiedTeacher } from "@/lib/verify"

export type ClassRoom = {
  code: string // 6 letters/numbers, e.g. "K7M2QX"
  teacher: string // teacher's email
  students: { id: string; joinedAt: string }[] // student IDs (or older student emails)
  createdAt: string
}

const STORAGE_KEY = "pragmalab.classes"
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function read(): ClassRoom[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

export const cleanCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)

/** The teacher's class. The server makes it at sign-up; until the first sync it shows "······". */
export function classOf(teacher: string): ClassRoom {
  return read().find((c) => same(c.teacher, teacher)) ?? { code: "······", teacher, students: [], createdAt: new Date().toISOString() }
}

/** The class a student has joined, if any. */
export function studentClass(student: string | null) {
  if (!student) return undefined
  return read().find((c) => c.students.some((s) => same(s.id, student)))
}

/** Puts the signed-in student in the class with this code (checked on the server). Throws a friendly message if it can't. */
export async function joinClass(rawCode: string) {
  const code = cleanCode(rawCode)
  if (code.length !== 6) throw new Error("A class code has 6 letters and numbers.")
  const res = await api<{ code: string; teacher: { email: string; name: string } }>("/api/classes/join", { body: { code } })
  await syncNow() // the class, teacher and lessons arrive
  window.dispatchEvent(new Event("pragmalab:classes"))
  return res
}

/** Teachers: takes a student out of the class (on the server). */
export async function removeStudent(student: string) {
  await api(`/api/classes/students/${encodeURIComponent(student)}`, { method: "DELETE" })
  await syncNow()
  window.dispatchEvent(new Event("pragmalab:classes"))
}

/** Teachers confirm each sign-in with an email code; students need to be in a teacher's class. */
export function hasAccess(email: string | null, role: Role | null) {
  if (!email) return false
  if (role === "student") {
    const room = studentClass(email)
    return !!room && isVerifiedTeacher(room.teacher)
  }
  return isVerifiedSession(email)
}

/** Where to go right after signing in / signing up. */
export function afterAuthPath(email: string, role: Role | null, from?: string) {
  if (role === "student" && needsClass(findAccount(email))) return "/choose-class" // older accounts pick a class 0–4 first
  if (hasAccess(email, role)) return from ?? homeFor(role)
  return role === "student" ? "/join" : "/verify"
}

export type ClassStudent = { id: string; name: string; ageGroup?: string; grade?: number; joinedAt: string; lastSeen?: string }

/** The students in a teacher's class, with names and last-seen times. */
export function classStudents(teacher: string | null): ClassStudent[] {
  if (!teacher) return []
  const room = read().find((c) => same(c.teacher, teacher))
  if (!room) return []
  const seen = readJoined()
  return room.students
    .map((s) => {
      const account = findAccount(s.id)
      return {
        id: s.id,
        name: account?.name || s.id,
        ageGroup: account?.ageGroup,
        grade: account?.grade,
        joinedAt: s.joinedAt,
        lastSeen: seen.find((j) => same(j.email, s.id))?.lastSeen,
      }
    })
    .sort((a, b) => (b.lastSeen ?? b.joinedAt).localeCompare(a.lastSeen ?? a.joinedAt))
}

/** Re-renders when classes change (join / remove). */
export function onClassesChange(cb: () => void) {
  window.addEventListener("pragmalab:classes", cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener("pragmalab:classes", cb)
    window.removeEventListener("storage", cb)
  }
}
