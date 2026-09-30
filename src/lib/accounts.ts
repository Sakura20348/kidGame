// Account info. The API server (server/, /api/auth) owns accounts and passwords; each browser
// gets the public info of the people in its class as "pragmalab.accounts" (never passwords).

export type Role = "student" | "teacher"

export type Account = {
  email: string
  name: string
  role: Role
  ageGroup?: string // students: their class, e.g. "Class 2" (older accounts: a range like "Class 0–3")
  grade?: number // students: their school class, 0–4
  school?: string // teachers
  createdAt: string // ISO
  passwordHash?: string // only in accounts from the old browser-only app
  verifiedAt?: string // teachers: first time they confirmed their email code
}

const STORAGE_KEY = "pragmalab.accounts"

// ------------------------------------------------------------ school classes

/** The school classes LittleReaderLab is for (0 = preparatory class). Each class is separate. */
export const grades = [0, 1, 2, 3, 4]
export const MAX_GRADE = 4
/** "Class 0" … "Class 4" – what students, lessons and filters use. */
export const classNames = grades.map((g) => `Class ${g}`)

/** An account's / lesson's class label, e.g. 2 → "Class 2". */
export const bandForGrade = (grade: number) => `Class ${grade}`

/** Old sign-ups stored an age group – turn it into the matching class range. */
const oldBands: Record<string, string> = {
  "Age 7–9": "Class 0–3",
  "Age 10–12": "Class 4–6",
  "Age 13–15": "Class 7–9",
  "Age 16–18": "Class 10–11",
}
export const normalizeBand = (band?: string) => (band ? (oldBands[band] ?? band) : band)

/**
 * The class number in a label: "Class 2" → 2. Older range labels count from their first class
 * ("Class 0–3" → 0, "Class 4–6" → 4). Classes above 4 and "Adults" → null (no longer offered).
 */
export function gradeOf(label?: string | null): number | null {
  const m = normalizeBand(label ?? undefined)?.match(/Class (\d+)/)
  if (!m) return null
  const g = Number(m[1])
  return g <= MAX_GRADE ? g : null
}

/** The classes a label covers: "Class 2" → [2]; old ranges like "Class 0–3" → [0, 1, 2, 3]. */
export function classesIn(label?: string | null): number[] {
  const m = normalizeBand(label ?? undefined)?.match(/Class (\d+)(?:–(\d+))?/)
  if (!m) return []
  const from = Number(m[1])
  const to = Math.min(Number(m[2] ?? m[1]), MAX_GRADE)
  return grades.filter((g) => g >= from && g <= to)
}

/** Is a lesson made for `label` right for a student in class `grade`? */
export const classFits = (label: string | undefined, grade: number | null) => grade !== null && classesIn(label).includes(grade)

/** A student's class number (null when they still need to choose one). */
export const studentGrade = (a?: Pick<Account, "grade" | "ageGroup">) =>
  a?.grade !== undefined && a.grade !== null ? (a.grade <= MAX_GRADE ? a.grade : null) : gradeOf(a?.ageGroup)

/** Old accounts from Class 5–11 or "Adults" choose a class 0–4 once. */
export const needsClass = (a?: Account) => a?.role === "student" && studentGrade(a) === null

/** "Class 3" (or "–" when unknown). */
export const classLabel = (a?: Pick<Account, "grade" | "ageGroup">) => {
  const g = studentGrade(a)
  return g === null ? "–" : `Class ${g}`
}

export function readAccounts(): Account[] {
  try {
    const list: Account[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    return list.map((a) => (a.ageGroup ? { ...a, ageGroup: normalizeBand(a.ageGroup) } : a))
  } catch {
    return []
  }
}

export function findAccount(email: string | null) {
  if (!email) return undefined
  const key = email.trim().toLowerCase()
  return readAccounts().find((a) => a.email.toLowerCase() === key)
}

/** Where people land after signing in: students on Discover, teachers on their Dashboard. */
export const homeFor = (role: Role | null) => (role === "student" ? "/discover" : "/dashboard")

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Students sign in with a 6-digit ID instead of an email (kids often have none). */
export const STUDENT_ID_RE = /^\d{6}$/
export const isStudentId = (value: string | null) => !!value && STUDENT_ID_RE.test(value.trim())
