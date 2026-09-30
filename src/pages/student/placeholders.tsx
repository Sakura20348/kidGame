import { BookOpen01Icon, ChartColumnIcon, FileUploadIcon } from "@hugeicons/core-free-icons"

import { EmptyState } from "@/components/resources/section"

// TODO: replace these with the real screens once the API is ready.

export function StudentAssignmentsPage() {
  return (
    <EmptyState
      icon={BookOpen01Icon}
      title="My assignments"
      message="Lessons your teacher assigns to you will appear here."
    />
  )
}

export function StudentProgressPage() {
  return (
    <EmptyState
      icon={ChartColumnIcon}
      title="No progress yet"
      message="Complete a lesson to see your scores and progress here."
    />
  )
}

export function StudentSubmitPage() {
  return (
    <EmptyState
      icon={FileUploadIcon}
      title="Submit work"
      message="Upload your finished exercises for your teacher to review."
    />
  )
}
