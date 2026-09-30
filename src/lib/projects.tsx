import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { NewProjectDialog } from "@/components/resources/new-project-dialog"
import { normalizeTopic, sampleResources, type Resource } from "@/data/resources"
import { findAccount, normalizeBand, classFits, studentGrade } from "@/lib/accounts"
import { studentClass } from "@/lib/classes"
import { ProjectsContext, useAuth } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"

const STORAGE_KEY = "pragmalab.projects"

function readProjects(): Resource[] {
  try {
    const list: Resource[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    return list.map((r) => ({ ...r, level: "A1", ageGroup: normalizeBand(r.ageGroup) ?? r.ageGroup, topic: normalizeTopic(r.topic) }))
  } catch {
    return []
  }
}

function persist(list: Resource[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // storage full (usually too many uploaded pictures) – projects stay in memory only
    toast.error("Couldn’t save your projects on this device", { description: "Storage is full — try emojis or fewer pictures in your tasks." })
  }
}

/** A per-teacher list of lesson ids ("hiddenLessons" = deleted, "sentLessons" = sent to the class). */
function readList(teacher: string | null | undefined, name: string): string[] {
  if (!teacher) return []
  try {
    return JSON.parse(localStorage.getItem(kidsKey(teacher, name)) ?? "[]")
  } catch {
    return []
  }
}

function writeList(teacher: string | null | undefined, name: string, list: string[]) {
  if (!teacher) return
  try {
    localStorage.setItem(kidsKey(teacher, name), JSON.stringify(list))
  } catch {
    // ignore
  }
}

const same = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase()

/** Deleted lessons wait in the bin this long, then they are gone for good. */
export const TRASH_DAYS = 5
const DAY_MS = 24 * 60 * 60 * 1000

type Trashed = { id: string; deletedAt: string }

function readTrash(teacher: string | null | undefined): Trashed[] {
  if (!teacher) return []
  try {
    const raw: (string | Trashed)[] = JSON.parse(localStorage.getItem(kidsKey(teacher, "hiddenLessons")) ?? "[]")
    // older lists only stored ids – start their 5 days now
    return raw.map((t) => (typeof t === "string" ? { id: t, deletedAt: new Date().toISOString() } : t))
  } catch {
    return []
  }
}

function writeTrash(teacher: string | null | undefined, list: Trashed[]) {
  if (!teacher) return
  try {
    localStorage.setItem(kidsKey(teacher, "hiddenLessons"), JSON.stringify(list))
  } catch {
    // ignore
  }
}

/** Empties lessons that have been in the bin for more than 5 days. Returns what's still in it. */
export function emptyExpired(teacher: string | null | undefined): Trashed[] {
  const trash = readTrash(teacher)
  const now = Date.now()
  const expired = trash.filter((t) => now - new Date(t.deletedAt).getTime() > TRASH_DAYS * DAY_MS)
  if (!teacher || expired.length === 0) return trash
  const ids = new Set(expired.map((t) => t.id))
  // teacher-made projects are removed; built-in lessons stay hidden for good
  persist(readProjects().filter((p) => !ids.has(p.id)))
  writeList(teacher, "goneLessons", [...readList(teacher, "goneLessons"), ...[...ids].filter((id) => !id.startsWith("p-"))])
  const rest = trash.filter((t) => !ids.has(t.id))
  writeTrash(teacher, rest)
  return rest
}

// TODO: save projects through your API instead of localStorage.
export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { email, role } = useAuth()
  const student = role === "student" // only teachers create projects
  // the teacher whose choices apply: yourself, or a student's class teacher
  const owner = student ? studentClass(email)?.teacher : email
  const studentClassNo = student ? studentGrade(findAccount(email)) : null
  const [trash, setTrash] = useState(() => emptyExpired(owner)) // runs first so expired projects are gone
  const [gone, setGone] = useState(() => readList(owner, "goneLessons"))
  const [projects, setProjects] = useState(readProjects)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null) // the project open in the form, or null for a new one
  const [sent, setSent] = useState(() => readList(owner, "sentLessons"))

  // another window or device changed lessons (sync server) – read them again
  useEffect(() => {
    const reload = (e: Event) => {
      const keys = (e as CustomEvent<string[]>).detail ?? []
      if (!keys.some((k) => k.includes("projects") || k.includes("Lessons"))) return
      setProjects(readProjects())
      setTrash(readTrash(owner))
      setGone(readList(owner, "goneLessons"))
      setSent(readList(owner, "sentLessons"))
    }
    window.addEventListener("pragmalab:sync", reload)
    return () => window.removeEventListener("pragmalab:sync", reload)
  }, [owner])

  function saveTrash(next: Trashed[]) {
    setTrash(next)
    writeTrash(owner, next)
  }

  function saveSent(next: string[]) {
    setSent(next)
    writeList(owner, "sentLessons", next)
  }

  /** Teachers: send a lesson to the class, or take it back. */
  function toggleSend(r: Resource) {
    if (student) return
    saveSent(sent.includes(r.id) ? sent.filter((id) => id !== r.id) : [...sent, r.id])
  }

  // projects belong to the teacher who made them (older ones without an owner are shared)
  const mine = projects.filter((p) => !p.owner || same(p.owner, owner))
  const hiddenIds = new Set([...trash.map((t) => t.id), ...gone])
  const all = [...mine, ...sampleResources].filter((r) => !hiddenIds.has(r.id))

  /** Moves a lesson to the bin (restorable for 5 days). */
  function deleteLesson(r: Resource) {
    if (student || trash.some((t) => t.id === r.id)) return
    saveTrash([...trash, { id: r.id, deletedAt: new Date().toISOString() }])
  }

  /** Empties one lesson from the bin right away. */
  function deleteForever(id: string) {
    if (student) return
    const next = trash.filter((t) => t.id !== id)
    if (id.startsWith("p-")) {
      removeProject(id)
      saveSent(sent.filter((s) => s !== id))
    } else {
      // built-in lessons stay hidden for good – update state too so it doesn't come back
      const nextGone = [...gone, id]
      setGone(nextGone)
      writeList(owner, "goneLessons", nextGone)
    }
    saveTrash(next)
  }

  function addProject(data: Omit<Resource, "id" | "custom">) {
    const project: Resource = { ...data, id: `p-${Date.now()}`, custom: true, owner: email ?? undefined }
    setProjects((prev) => {
      const next = [project, ...prev]
      persist(next)
      return next
    })
    saveSent([...sent, project.id]) // a new project goes straight to the teacher's students
    return project
  }

  function updateProject(id: string, data: Omit<Resource, "id" | "custom">) {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...data, id, custom: true, owner: p.owner ?? email ?? undefined } : p))
      persist(next)
      return next
    })
  }

  function removeProject(id: string) {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id)
      persist(next)
      return next
    })
  }

  const binned = trash
    .map((t) => {
      const resource = [...mine, ...sampleResources].find((r) => r.id === t.id)
      const left = TRASH_DAYS * DAY_MS - (Date.now() - new Date(t.deletedAt).getTime())
      return resource ? { resource, deletedAt: t.deletedAt, daysLeft: Math.max(1, Math.ceil(left / DAY_MS)) } : null
    })
    .filter((x) => x !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <ProjectsContext.Provider
      value={{
        // students only see what their teacher sent them – and only for their own age group
        resources: student ? all.filter((r) => sent.includes(r.id) && (studentClassNo === null || classFits(r.ageGroup, studentClassNo))) : all,
        isSent: (id) => sent.includes(id),
        toggleSend,
        hiddenLessons: binned,
        deleteLesson,
        deleteForever,
        restoreLesson: (id) => saveTrash(trash.filter((t) => t.id !== id)),
        projects: mine,
        addProject,
        removeProject,
        updateProject,
        openNewProject: () => {
          if (student) return
          setEditing(null)
          setDialogOpen(true)
        },
        openEditProject: (r) => {
          if (student || !r.custom) return
          setEditing(r)
          setDialogOpen(true)
        },
      }}
    >
      {children}
      {!student && (
        // a new key per project, so the form starts from that project's details
        <NewProjectDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          edit={editing ?? undefined}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditing(null)
          }}
        />
      )}
    </ProjectsContext.Provider>
  )
}
