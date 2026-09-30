import { useEffect, useState } from "react"
import { Navigate, useParams } from "react-router-dom"

import { isYoungAge } from "@/data/lesson-guides"
import { findAccount } from "@/lib/accounts"
import { logActivity } from "@/lib/activity"
import { useAuth, useProjects } from "@/lib/contexts"
import { markLessonStarted, saveLessonResult } from "@/lib/lesson-results"
import { KidLesson } from "@/pages/lesson/kid-lesson"
import { StudyLesson } from "@/pages/lesson/study-lesson"
import { TaskLesson } from "@/pages/lesson/task-lesson"
import { StudyTaskLesson } from "@/pages/lesson/study-task-lesson"
import { audienceFor, isKidTask } from "@/data/lesson-tasks"

/** Opens a lesson in the style that fits the student: kid style for 7–12, study style for 13+. */
export default function LessonPage() {
  const { id } = useParams()
  const { resources } = useProjects()
  const { email } = useAuth()
  const [startedAt] = useState(() => Date.now())
  const resource = resources.find((r) => r.id === id)

  // shows up as "In progress" on My progress until it's finished
  useEffect(() => {
    if (resource) markLessonStarted(email, resource.id, resource.title)
  }, [email, resource])

  if (!resource) return <Navigate to="/discover" replace />

  const age = findAccount(email)?.ageGroup ?? resource.ageGroup

  function finish(score: number, points?: number) {
    saveLessonResult(email, {
      resourceId: resource!.id,
      lesson: resource!.title,
      level: resource!.level,
      takenAt: new Date().toISOString(),
      minutes: Math.max(1, Math.round((Date.now() - startedAt) / 60_000)),
      score,
      points,
    })
    logActivity(email, "lesson")
  }

  // projects with teacher-made tasks play those tasks
  // (kid picture designs in the blue kids screen for Class 0–3, Class 4 in the study style)
  if (resource.taskList?.length) {
    const tasks = resource.taskList
    const done = (right: number, total: number) => finish(Math.round((right / total) * 5), Math.round((right / total) * 100))
    return audienceFor(resource.ageGroup) === "kid" && tasks.every(isKidTask) ? (
      <TaskLesson key={resource.id} tasks={tasks} onFinish={done} />
    ) : (
      <StudyTaskLesson key={resource.id} resource={resource} tasks={tasks} onFinish={done} />
    )
  }

  return isYoungAge(age) ? (
    <KidLesson key={resource.id} resource={resource} onFinish={(score) => finish(score)} />
  ) : (
    <StudyLesson key={resource.id} resource={resource} onFinish={finish} />
  )
}
