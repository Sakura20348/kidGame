import { assignments, assignmentGroupFor } from "@/data/assignments"
import { findAccount } from "@/lib/accounts"
import { kidsKey } from "@/lib/kids-storage"

/** assignment id → best stars (per account, on this device). */
export type AssignmentProgress = Record<string, number>

export function readAssignmentProgress(email: string | null): AssignmentProgress {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(email, "assignments")) ?? "{}")
  } catch {
    return {}
  }
}

export function saveAssignmentProgress(email: string | null, p: AssignmentProgress) {
  try {
    localStorage.setItem(kidsKey(email, "assignments"), JSON.stringify(p))
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("pragmalab:assignments"))
}

/** Assignments still to do for the student's own age group (all ages if unknown). */
export function pendingAssignments(email: string | null) {
  const age = assignmentGroupFor(findAccount(email)?.ageGroup)
  const done = readAssignmentProgress(email)
  return assignments.filter((a) => (!age || a.age === age) && !(done[a.id] > 0)).length
}

/** Assignments finished (with stars) in the student's age group. */
export function doneAssignments(email: string | null) {
  const age = assignmentGroupFor(findAccount(email)?.ageGroup)
  const done = readAssignmentProgress(email)
  return assignments.filter((a) => (!age || a.age === age) && done[a.id] > 0).length
}
