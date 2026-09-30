import { SentIcon } from "@hugeicons/core-free-icons"

import { EmptyState } from "@/components/resources/section"

export default function AssignmentsPage() {
  return (
    <EmptyState
      icon={SentIcon}
      title="No assignments yet"
      message="Lessons your teacher assigns to you will appear here."
    />
  )
}
