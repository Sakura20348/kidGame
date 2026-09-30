// Teacher → student messages, shown in the student's 🔔 notifications.
// A teacher writes to the whole class or to one student; students mark them as read.
// TODO: send these through the API (e.g. POST /classes/:code/messages) and push them live.

import { classStudents, studentClass } from "@/lib/classes"
import { kidsKey } from "@/lib/kids-storage"
import { papersForStudent } from "@/lib/papers"

export type TeacherMessage = {
  id: string
  text: string
  to: "all" | string // "all" = the whole class, otherwise one student's ID
  sentAt: string // ISO
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

const read = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback
  } catch {
    return fallback
  }
}

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full – ignore
  }
  window.dispatchEvent(new Event("pragmalab:messages"))
}

// ------------------------------------------------------------ teacher side

export const readSentMessages = (teacher: string | null) => (teacher ? read<TeacherMessage[]>(kidsKey(teacher, "messages"), []) : [])

export function sendMessage(teacher: string, text: string, to: "all" | string) {
  const message: TeacherMessage = { id: `msg-${Date.now()}`, text: text.trim(), to, sentAt: new Date().toISOString() }
  write(kidsKey(teacher, "messages"), [message, ...readSentMessages(teacher)])
  return message
}

export function deleteMessage(teacher: string, id: string) {
  write(kidsKey(teacher, "messages"), readSentMessages(teacher).filter((m) => m.id !== id))
}

/** How many of the message's students have read it. */
export function readCount(teacher: string | null, m: TeacherMessage) {
  const students = classStudents(teacher).filter((s) => m.to === "all" || same(s.id, m.to))
  return { read: students.filter((s) => readIds(s.id).includes(m.id)).length, total: students.length }
}

// ------------------------------------------------------------ student side

export type Notice = {
  id: string
  kind: "message" | "paper"
  title: string
  text: string
  at: string // ISO
  personal?: boolean // written to this student only
  link?: string
}

const readIds = (student: string | null) => read<string[]>(kidsKey(student, "messagesRead"), [])

/** Everything for a student's 🔔: teacher messages and new test papers, newest first. */
export function noticesFor(student: string | null): Notice[] {
  const room = studentClass(student)
  if (!room || !student) return []
  const teacher = room.teacher
  const messages: Notice[] = readSentMessages(teacher)
    .filter((m) => m.to === "all" || same(m.to, student))
    .map((m) => ({ id: m.id, kind: "message", title: m.to === "all" ? "Message to your class" : "Message to you", text: m.text, at: m.sentAt, personal: m.to !== "all" }))
  const papers: Notice[] = papersForStudent(student).map((p) => ({
    id: p.id,
    kind: "paper",
    title: "New test paper",
    text: p.title,
    at: p.sentAt,
    link: "/settings?tab=privacy",
  }))
  return [...messages, ...papers].sort((a, b) => b.at.localeCompare(a.at))
}

export const unreadCount = (student: string | null) => {
  const seen = readIds(student)
  return noticesFor(student).filter((n) => !seen.includes(n.id)).length
}

export const isRead = (student: string | null, id: string) => readIds(student).includes(id)

export function markAllRead(student: string | null) {
  if (!student) return
  const ids = noticesFor(student).map((n) => n.id)
  const seen = readIds(student)
  if (ids.every((id) => seen.includes(id))) return
  write(kidsKey(student, "messagesRead"), [...new Set([...seen, ...ids])])
}
