// React contexts live here, apart from their providers, so hot-reloading a
// provider file doesn't create a new context and break mounted consumers.
import { createContext, useContext } from "react"

import type { Resource } from "@/data/resources"
import type { Account, Role } from "@/lib/accounts"

type AuthContextValue = {
  email: string | null
  initials: string
  name: string
  role: Role | null
  /** Throws an Error with a user-facing message if sign-in isn't allowed. */
  signIn: (email: string, password: string, role: Role) => Promise<void>
  /** Creates the account and signs in. Returns the sign-in name (students get a new 6-digit ID). */
  signUp: (account: Omit<Account, "createdAt" | "passwordHash"> & { password: string }) => Promise<string>
  signOut: () => void
  /** Account settings – each throws an Error with a user-facing message on failure. */
  updateName: (name: string) => Promise<void>
  changeEmail: (newEmail: string) => Promise<void>
  changePassword: (current: string, next: string) => Promise<void>
}

type LibraryContextValue = {
  saved: Set<string>
  toggleSave: (r: Resource) => void
  startLesson: (r: Resource) => void
  showDetails: (r: Resource) => void
}

type ProjectsContextValue = {
  /** User projects first, then the built-in resources. */
  resources: Resource[]
  projects: Resource[]
  addProject: (r: Omit<Resource, "id" | "custom">) => Resource
  /** Teachers: saves changes to one of their projects (same id, so students keep it). */
  updateProject: (id: string, r: Omit<Resource, "id" | "custom">) => void
  /** Teachers: opens the project form filled in with this project. */
  openEditProject: (r: Resource) => void
  removeProject: (id: string) => void
  openNewProject: () => void
  /** The bin: lessons the teacher deleted, restorable until they expire after 5 days. */
  hiddenLessons: { resource: Resource; deletedAt: string; daysLeft: number }[]
  /** Teachers: moves a lesson to the bin (hidden for them and their class). */
  deleteLesson: (r: Resource) => void
  /** Teachers: empties one lesson from the bin now. */
  deleteForever: (id: string) => void
  restoreLesson: (id: string) => void
  /** Lessons the teacher sent to their class – students only see these. */
  isSent: (id: string) => boolean
  toggleSend: (r: Resource) => void
}

type KidsContextValue = {
  stars: number
  best: Record<string, number>
  /** Adds stars from a finished round and remembers the best score per game
   *  (`best` overrides the 0–3 score shown on the game tile). */
  award: (game: string, stars: number, best?: number) => void
}

type ScrollContextValue = {
  /** Smoothly glides the page's scroll area to an element. */
  scrollTo: (target: HTMLElement, offset?: number) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
export const LibraryContext = createContext<LibraryContextValue | null>(null)
export const ProjectsContext = createContext<ProjectsContextValue | null>(null)
export const KidsContext = createContext<KidsContextValue | null>(null)
export const ScrollContext = createContext<ScrollContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error("useLibrary must be used inside <LibraryProvider>")
  return ctx
}

export function useProjects() {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error("useProjects must be used inside <ProjectsProvider>")
  return ctx
}

export function useKids() {
  const ctx = useContext(KidsContext)
  if (!ctx) throw new Error("useKids must be used inside <KidsProvider>")
  return ctx
}

/** Falls back to native smooth scrolling outside a smooth-scroll area. */
export function useScroller(): ScrollContextValue {
  return (
    useContext(ScrollContext) ?? {
      scrollTo: (el) => el.scrollIntoView({ behavior: "smooth", block: "start" }),
    }
  )
}

/** Saved lessons the user can still see (a lesson the teacher un-sent or deleted doesn't count). */
export function useSavedCount() {
  const { saved } = useLibrary()
  const { resources } = useProjects()
  return resources.filter((r) => saved.has(r.id)).length
}
