import { useNavigate } from "react-router-dom"
import { Bookmark01Icon, FolderAddIcon } from "@hugeicons/core-free-icons"

import { ResourceCard } from "@/components/resources/resource-card"
import { EmptyState, ResourceGrid, SectionHeading } from "@/components/resources/section"
import { useAuth, useLibrary } from "@/lib/contexts"
import { useProjects } from "@/lib/contexts"

export default function LibraryPage() {
  const { saved } = useLibrary()
  const navigate = useNavigate()
  const { resources } = useProjects()
  const items = resources.filter((r) => saved.has(r.id))
  const teacher = useAuth().role !== "student" // teachers call this "My projects"

  if (items.length === 0) {
    return (
      <EmptyState
        icon={teacher ? FolderAddIcon : Bookmark01Icon}
        title={teacher ? "No projects yet" : "Nothing saved yet"}
        message={teacher ? "Tap the folder icon on any lesson to add it to your projects." : "Tap the bookmark on any resource to keep it here."}
        actionLabel="Browse resources"
        onAction={() => navigate(teacher ? "/dashboard/lessons" : "/discover")}
      />
    )
  }

  return (
    <div>
      <SectionHeading
        eyebrow={teacher ? "MY PROJECTS" : "MATERIALS"}
        title={teacher ? `${items.length} ${items.length === 1 ? "lesson" : "lessons"} in your projects` : `${items.length} saved ${items.length === 1 ? "resource" : "resources"}`}
      />
      <div className="mt-6">
        <ResourceGrid>
          {items.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </ResourceGrid>
      </div>
    </div>
  )
}
