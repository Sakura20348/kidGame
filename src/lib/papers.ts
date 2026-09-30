// Test papers: a teacher uploads a file (PDF, Word, picture…) and sends it to the whole class.
// Students download it from Settings → Privacy & security → Downloads.
// TODO: store files on the server (e.g. POST /classes/:code/papers) instead of in localStorage.

import { classStudents, studentClass } from "@/lib/classes"
import { kidsKey } from "@/lib/kids-storage"

export type TestPaper = {
  id: string
  title: string
  note: string
  file: { name: string; size: number; type: string; dataUrl: string }
  sentAt: string // ISO
}

/** Files are kept inside the browser (and synced), so they must stay small. */
export const MAX_PAPER_BYTES = 2 * 1024 * 1024

const read = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback
  } catch {
    return fallback
  }
}

export const readPapers = (teacher: string | null) => (teacher ? read<TestPaper[]>(kidsKey(teacher, "papers"), []) : [])

/** Saves the teacher's papers. Returns false when the browser storage is full. */
export function savePapers(teacher: string, list: TestPaper[]) {
  try {
    localStorage.setItem(kidsKey(teacher, "papers"), JSON.stringify(list))
    window.dispatchEvent(new Event("pragmalab:papers"))
    return true
  } catch {
    return false
  }
}

/** The papers a student's teacher has sent, newest first. */
export function papersForStudent(student: string | null) {
  const room = studentClass(student)
  return room ? readPapers(room.teacher).sort((a, b) => b.sentAt.localeCompare(a.sentAt)) : []
}

// ------------------------------------------------------------ who downloaded what

export const readDownloaded = (student: string | null) => read<string[]>(kidsKey(student, "papersDownloaded"), [])

export function markDownloaded(student: string | null, paperId: string) {
  const list = readDownloaded(student)
  if (!student || list.includes(paperId)) return
  try {
    localStorage.setItem(kidsKey(student, "papersDownloaded"), JSON.stringify([...list, paperId]))
  } catch {
    // ignore
  }
}

/** Teacher view: how many students in the class downloaded a paper. */
export function downloadCount(teacher: string | null, paperId: string) {
  return classStudents(teacher).filter((s) => readDownloaded(s.id).includes(paperId)).length
}

/** Saves the file to the user's computer. */
export function downloadPaper(p: TestPaper) {
  const a = document.createElement("a")
  a.href = p.file.dataUrl
  a.download = p.file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export const fileKind = (type: string, name: string) =>
  type === "application/pdf" || name.toLowerCase().endsWith(".pdf")
    ? { emoji: "📕", label: "PDF" }
    : type.startsWith("image/")
      ? { emoji: "🖼️", label: "Picture" }
      : /\.(docx?|odt|rtf)$/i.test(name)
        ? { emoji: "📘", label: "Word" }
        : /\.(pptx?|odp)$/i.test(name)
          ? { emoji: "📙", label: "Slides" }
          : /\.(xlsx?|ods|csv)$/i.test(name)
            ? { emoji: "📗", label: "Sheet" }
            : { emoji: "📄", label: "File" }
