import { HugeiconsIcon } from "@hugeicons/react"
import { FolderAddIcon } from "@hugeicons/core-free-icons"

import { UserAvatar } from "@/components/brand/account-menu"
import { ResourceCard } from "@/components/resources/resource-card"
import { EmptyState, Eyebrow, ResourceGrid, SectionHeading } from "@/components/resources/section"
import { Button } from "@/components/ui/button"
import { useState } from "react"

import { ClassPlace, TestRanking, testRanking } from "@/components/student/test-ranking"
import { classLabel, findAccount } from "@/lib/accounts"
import { studentClass } from "@/lib/classes"
import { useAuth, useLibrary, useProjects, useSavedCount } from "@/lib/contexts"
import { Reveal } from "@/components/motion/reveal"

export default function ProfilePage() {
  const { name, email, role } = useAuth()
  const teacher = role !== "student" // only teachers create projects
  const { saved } = useLibrary()
  const savedCount = useSavedCount()
  const { projects, openNewProject } = useProjects()
  // students: where they stand in their class
  const [ranking] = useState(() => (teacher ? [] : testRanking(email)))
  const myIndex = ranking.findIndex((l) => l.me)
  const me = ranking[myIndex]
  const account = findAccount(email)
  const room = teacher ? undefined : studentClass(email)
  const teacherName = room ? findAccount(room.teacher)?.name || room.teacher : null

  const stats = teacher
    ? [
        { value: String(projects.length), label: "Projects created" },
        { value: String(saved.size), label: "Lessons in projects" },
      ]
    : [
        { value: me?.average != null ? `#${myIndex + 1}` : "–", label: "Place in class (tests)" },
        { value: me?.average != null ? String(me.average) : "–", label: "Test average / 100" },
        { value: String(savedCount), label: "Saved materials" },
      ]

  return (
    <div className="space-y-12">
      <Reveal as="section" className="flex flex-col gap-6 rounded-[22px] border border-border bg-card p-6 @min-[700px]:flex-row @min-[700px]:items-center @min-[700px]:p-8">
        <UserAvatar className="size-20 text-2xl" />
        <div className="min-w-0 flex-1">
          <Eyebrow>PROFILE</Eyebrow>
          <h1 className="mt-2 truncate font-serif text-[34px] leading-tight text-foreground">{name || email}</h1>
          <p className={teacher ? "mt-1 truncate text-[15px] text-muted-foreground" : "mt-1 text-[15px] text-muted-foreground"}>
            {teacher ? email : `ID ${email}`}
            {!teacher && account && ` · ${classLabel(account)}`}
            {teacherName && ` · Teacher: ${teacherName}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {stats.map((s) => (
            <div key={s.label} className="w-[130px] rounded-[18px] bg-field p-[18px]">
              <p className="font-serif text-[34px] leading-none font-semibold text-logo [font-variant-numeric:oldstyle-nums]">
                {s.value}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {!teacher && <ClassPlace ranking={ranking} />}
      {!teacher && ranking.length > 0 && <TestRanking ranking={ranking} />}

      {teacher && (
      <div>
        <div className="flex flex-col gap-4 @min-[700px]:flex-row @min-[700px]:items-end">
          <div className="flex-1">
            <SectionHeading eyebrow="MY PROJECTS" title={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`} />
          </div>
          <Button className="h-12 gap-2 self-start rounded-[12px] px-5 font-bold" onClick={openNewProject}>
            <HugeiconsIcon icon={FolderAddIcon} className="size-5" />
            New project
          </Button>
        </div>
        <div className="mt-6">
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderAddIcon}
              title="No projects yet"
              message="Create your own learning resource and it will show up here and on Discover."
              actionLabel="Create a project"
              onAction={openNewProject}
            />
          ) : (
            <ResourceGrid>
              {projects.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </ResourceGrid>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

