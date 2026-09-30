import { useNavigate } from "react-router-dom"
import { LibraryIcon } from "@hugeicons/core-free-icons"

import { ResourceCard } from "@/components/resources/resource-card"
import { EmptyState, ResourceGrid, SectionHeading } from "@/components/resources/section"
import { useLibrary } from "@/lib/contexts"
import { useProjects } from "@/lib/contexts"

export default function StudentMaterialsPage() {
  const { saved } = useLibrary()
  const navigate = useNavigate()
  const { resources } = useProjects()
  const items = resources.filter((r) => saved.has(r.id))

  if (items.length === 0) {
    return (
      <EmptyState
        icon={LibraryIcon}
        title="No materials yet"
        message="Resources you save or your teacher shares with you will appear here."
        actionLabel="Browse resources"
        onAction={() => navigate("/discover")}
      />
    )
  }

  return (
    <div>
      <SectionHeading
        eyebrow="MATERIALS"
        title={`${items.length} ${items.length === 1 ? "material" : "materials"}`}
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
