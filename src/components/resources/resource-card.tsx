import type { ReactNode } from "react"
import { toast } from "sonner"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Bookmark01Icon,
  BookmarkCheck01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  PencilEdit02Icon,
  SentIcon,
  News01Icon,
  PlayIcon,
  PodcastIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons"

import type { Resource } from "@/data/resources"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth, useLibrary, useProjects } from "@/lib/contexts"
import { cn } from "@/lib/utils"

function formatIcon(format: Resource["format"]): IconSvgElement {
  switch (format) {
    case "Article":
      return News01Icon
    case "Podcast":
      return PodcastIcon
    default:
      return Video01Icon
  }
}

export function ResourceCard({ resource: r }: { resource: Resource }) {
  const { saved, toggleSave, startLesson, showDetails } = useLibrary()
  const isSaved = saved.has(r.id)
  // teachers plan with lessons (projects); only students start them
  const teacher = useAuth().role !== "student"
  const { deleteLesson, restoreLesson, isSent, toggleSend, openEditProject } = useProjects()
  const sent = isSent(r.id)
  const saveLabel = isSaved ? "Remove from library" : "Save to library"
  const icon = formatIcon(r.format)

  function remove() {
    deleteLesson(r)
    toast(`“${r.title}” was deleted`, {
      description: "Your students won’t see it. You can restore it for 5 days.",
      action: { label: "Undo", onClick: () => restoreLesson(r.id) },
    })
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border border-border bg-card">
      {/* Colored header */}
      <div className="relative h-[180px] shrink-0 overflow-hidden" style={{ backgroundColor: r.color }}>
        {r.image ? (
          // the teacher's cover picture
          <img src={r.image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            {/* darkens the pastel header in dark mode */}
            <div className="absolute inset-0 hidden bg-black/55 dark:block" />
            <div className="absolute -top-[90px] -right-[70px] size-60 rounded-full border border-white/40" />
            <HugeiconsIcon
              icon={icon}
              className="absolute top-1/2 left-1/2 size-14 -translate-1/2 text-black/30 dark:text-white/35"
            />
          </>
        )}
        <Pill icon={icon} label={r.format} className="absolute top-3.5 left-3.5" />
        <span className="absolute top-4 right-4 rounded-full bg-green-900 px-3.5 py-2 text-sm font-extrabold text-white">
          {r.tasks} tasks
        </span>
        <Pill icon={Clock01Icon} label={`${r.source} Talk`} className="absolute right-3 bottom-3" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-5 pt-[18px] pb-2">
        <div className="flex flex-wrap gap-1.5">
          <Tag highlight>{r.level}</Tag>
          <Tag>{r.ageGroup}</Tag>
          <Tag>{r.topic}</Tag>
        </div>
        <h3 className="mt-3.5 font-serif text-[25px] leading-[1.2] text-foreground [font-variant-numeric:oldstyle-nums]">
          {r.title}
        </h3>
        <p className="mt-2.5 text-[15.5px] leading-[1.65] text-muted-foreground">
          {r.description}
        </p>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {r.skills.map((s) => (
            <Tag key={s} outlined>
              {s}
            </Tag>
          ))}
        </div>

        <div className="flex-1" />
        <div className="mt-5 flex gap-3">
          {teacher ? (
            <>
              <Button
                variant={sent ? "outline" : "default"}
                className={cn("h-13 flex-1 gap-2 rounded-[12px] text-base font-bold", sent && "border-primary/40 text-primary dark:bg-transparent dark:text-link")}
                title={sent ? `Students in ${r.ageGroup} can see this lesson. Click to take it back.` : `Students in ${r.ageGroup} will see this lesson on Discover.`}
                onClick={() => {
                  toggleSend(r)
                  toast(sent ? `“${r.title}” was taken back` : `“${r.title}” was sent to your students 📬`, {
                    description: sent ? undefined : `Only students in ${r.ageGroup} will see it.`,
                  })
                }}
              >
                <HugeiconsIcon icon={sent ? CheckmarkCircle02Icon : SentIcon} className="size-5" />
                {sent ? "Sent to students" : "Send to students"}
              </Button>
              <Button
                variant="outline"
                className="h-13 rounded-[12px] px-[22px] text-base font-bold dark:bg-transparent"
                onClick={() => showDetails(r)}
              >
                Details
              </Button>
            </>
          ) : (
            <>
              <Button
                className="h-13 flex-1 gap-2 rounded-[12px] text-base font-bold"
                onClick={() => startLesson(r)}
              >
                <HugeiconsIcon icon={PlayIcon} className="size-[22px]" />
                Start lesson
              </Button>
              <Button
                variant="outline"
                className="h-13 rounded-[12px] px-[22px] text-base font-bold dark:bg-transparent"
                onClick={() => showDetails(r)}
              >
                Details
              </Button>
            </>
          )}
        </div>

        <Separator className="mt-4 mb-1" />
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[12.5px]">
            <span className="text-muted-foreground">Source: </span>
            <span className="font-semibold text-foreground">
              {r.source} · {r.speaker}
            </span>
          </p>
          {teacher ? (
            <>
              {/* only the teacher's own projects can be edited; built-in lessons can only be deleted */}
              {r.custom && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Edit project"
                  title="Edit project"
                  className="text-muted-foreground hover:bg-link/10 hover:text-link"
                  onClick={() => openEditProject(r)}
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} className="size-6" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-lg"
                aria-label="Delete lesson"
                title="Delete lesson"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={remove}
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-6" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={saveLabel}
              title={saveLabel}
              className={isSaved ? "text-link" : "text-muted-foreground"}
              onClick={() => toggleSave(r)}
            >
              <HugeiconsIcon icon={isSaved ? BookmarkCheck01Icon : Bookmark01Icon} className="size-6" />
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function Pill({
  icon,
  label,
  className,
}: {
  icon: IconSvgElement
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-[13px] font-bold text-foreground",
        className
      )}
    >
      <HugeiconsIcon icon={icon} className="size-[18px]" />
      {label}
    </span>
  )
}

export function Tag({
  children,
  highlight,
  outlined,
}: {
  children: ReactNode
  highlight?: boolean
  outlined?: boolean
}) {
  return (
    <span
      className={cn(
        "rounded-md px-[9px] py-[5px] text-xs font-bold",
        highlight
          ? "bg-lime text-green-900"
          : outlined
            ? "border border-border text-foreground"
            : "bg-field text-foreground"
      )}
    >
      {children}
    </span>
  )
}
