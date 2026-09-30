import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import type { Resource } from "@/data/resources"
import { ResourceDetailsDialog } from "@/components/resources/resource-details-dialog"
import { LibraryContext } from "@/lib/contexts"

const STORAGE_KEY = "pragmalab.saved"

function readSaved() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"))
  } catch {
    return new Set<string>()
  }
}

/** Saved resources + lesson actions shared by every page inside the app shell. */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState(readSaved)
  const [details, setDetails] = useState<Resource | null>(null)
  const navigate = useNavigate()

  function toggleSave(r: Resource) {
    setSaved((prev) => {
      const next = new Set(prev)
      if (!next.delete(r.id)) next.add(r.id)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // ignore
      }
      return next
    })
  }

  // the lesson is logged as activity when the student finishes the test
  function startLesson(r: Resource) {
    navigate(`/lesson/${r.id}`)
  }

  return (
    <LibraryContext.Provider
      value={{ saved, toggleSave, startLesson, showDetails: setDetails }}
    >
      {children}
      <ResourceDetailsDialog
        resource={details}
        onClose={() => setDetails(null)}
        onStart={(r) => {
          setDetails(null)
          startLesson(r)
        }}
      />
    </LibraryContext.Provider>
  )
}
