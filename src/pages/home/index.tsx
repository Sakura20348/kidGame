import { useRef, useState } from "react"
import { toast } from "sonner"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  MailOpen01Icon,
  Delete02Icon,
  RefreshIcon,
  Search01Icon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { ResourceCard } from "@/components/resources/resource-card"
import {
  EmptyState,
  Eyebrow,
  Pagination,
  ResourceGrid,
  SectionHeading,
} from "@/components/resources/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resourceFilters } from "@/data/resources"
import { useAuth, useProjects, useScroller } from "@/lib/contexts"
import { TRASH_DAYS } from "@/lib/projects"
import { classFits, findAccount, gradeOf } from "@/lib/accounts"
import { isYoungAge } from "@/data/lesson-guides"
import { KidDiscover } from "@/components/resources/kid-discover"
import { readLessonResults } from "@/lib/lesson-results"
import { classStudents } from "@/lib/classes"

const PER_PAGE = 9

type FilterKey = "level" | "age" | "format" | "topic"

const filterDefs: { key: FilterKey; label: string; allLabel: string; options: string[] }[] = [
  { key: "level", label: "Level", allLabel: "All levels", options: resourceFilters.levels },
  { key: "age", label: "Class", allLabel: "All classes", options: resourceFilters.ageGroups },
  { key: "format", label: "Format", allLabel: "All formats", options: resourceFilters.formats },
  { key: "topic", label: "Topic", allLabel: "All topics", options: resourceFilters.topics },
]

export default function HomePage() {
  const [params, setParams] = useSearchParams()
  const { resources, openNewProject, isSent } = useProjects()
  const { role, email } = useAuth()
  // students see only the lessons their teacher sent (see ProjectsProvider)
  const student = role === "student"
  const q = params.get("q") ?? ""
  // filters are for teachers only – students just see what their teacher sent
  const level = student ? null : params.get("level")
  const age = student ? null : params.get("age")
  const format = student ? null : params.get("format")
  const topic = student ? null : params.get("topic")

  const hasFilters = q.trim() !== "" || !!level || !!age || !!format || !!topic

  /** Update one or more query params; any change resets to page 1. */
  function update(changes: Record<string, string | null>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(changes)) {
          if (v) next.set(k, v)
          else next.delete(k)
        }
        if (!("page" in changes)) next.delete("page")
        return next
      },
      { replace: true }
    )
  }

  const query = q.trim().toLowerCase()
  const items = resources.filter((r) => {
    if (level && r.level !== level) return false
    if (age && !classFits(r.ageGroup, gradeOf(age))) return false
    if (format && r.format !== format) return false
    if (topic && r.topic !== topic) return false
    if (!query) return true
    return [r.title, r.description, r.speaker, r.source, r.topic, ...r.skills]
      .join(" ")
      .toLowerCase()
      .includes(query)
  })

  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE))
  const page = Math.min(Math.max(Number(params.get("page") ?? 1) - 1, 0), pageCount - 1)
  const pageItems = items.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  const clearFilters = () =>
    update({ q: null, level: null, age: null, format: null, topic: null })

  const values: Record<FilterKey, string | null> = { level, age, format, topic }
  const resultsRef = useRef<HTMLDivElement>(null)
  const { scrollTo } = useScroller()

  function goToPage(i: number) {
    update({ page: i > 0 ? String(i + 1) : null })
    // glide up to the results instead of jumping
    if (resultsRef.current) scrollTo(resultsRef.current)
  }

  // young students (7–12) get the colourful kids version
  if (student && isYoungAge(findAccount(email)?.ageGroup)) return <KidDiscover />

  return (
    <div className="flex flex-col">
      <Reveal>
        <Hero stats={student ? studentStats(email, resources.map((r) => r.id)) : teacherStats(email, resources.length, resources.filter((r) => isSent(r.id)).length)} />
      </Reveal>

      {/* The panel overlaps the hero by 48px */}
      <div className="relative -mt-12 mb-12 px-3 @min-[700px]:px-7">
        <Reveal delay={120}>
          <div className="@container rounded-[22px] border border-border bg-card p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] @min-[700px]:p-6">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="pointer-events-none absolute top-1/2 left-4 size-[26px] -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={q}
                onChange={(e) => update({ q: e.target.value || null })}
                placeholder="Search topic, source, skill or keyword…"
                aria-label="Search resources"
                className="h-16 rounded-[12px] border border-border bg-card pr-12 pl-14 text-base placeholder:text-hint focus-visible:border-link focus-visible:ring-0 dark:bg-card"
              />
              {q && (
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => update({ q: null })}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
                </Button>
              )}
            </div>

            {student && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-link/10 px-4 py-1.5 text-sm font-semibold text-link">
                📬 Lessons from your teacher
              </p>
            )}
            {!student && (
            <div className="mt-5 grid grid-cols-1 gap-x-3 gap-y-4 @min-[520px]:grid-cols-2 @min-[900px]:grid-cols-4">
              {filterDefs.map((f) => (
                <FilterSelect
                  key={f.key}
                  label={f.label}
                  allLabel={f.allLabel}
                  options={f.options}
                  value={values[f.key]}
                  onChange={(v) => update({ [f.key]: v })}
                />
              ))}
            </div>
            )}

            {hasFilters && (
              <div className="mt-2 flex justify-end">
                <Button variant="ghost" className="gap-2 rounded-[12px] font-bold text-link" onClick={clearFilters}>
                  <HugeiconsIcon icon={RefreshIcon} className="size-5" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      <div ref={resultsRef}>
        <SectionHeading
          eyebrow="EXPLORE THE COLLECTION"
          title={`${items.length} learning resources`}
          trailing={`Page ${page + 1} of ${pageCount}`}
        />
        {!student && <DeletedLessons />}
      </div>
      <div className="mt-6">
        {student && resources.length === 0 ? (
          <EmptyState
            icon={MailOpen01Icon}
            title="No lessons yet"
            message="When your teacher sends you lessons, they’ll show up here. Meanwhile, try the Kids games! 🎮"
          />
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={SearchRemoveIcon}
            title="No resources match"
            message={
              student
                ? "Try a different keyword, or clear the filters to see every resource."
                : "Can’t find the right lesson? Create your own with New project, or clear the filters to see every resource."
            }
            actionLabel={student ? "Clear filters" : "New project"}
            onAction={student ? clearFilters : openNewProject}
            secondaryLabel={student ? undefined : "Clear filters"}
            onSecondary={student ? undefined : clearFilters}
          />
        ) : (
          // new key per page so the cards slide in again
          <ResourceGrid key={page}>
            {pageItems.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </ResourceGrid>
        )}
      </div>
      {pageCount > 1 && (
        <Pagination
          page={page}
          count={pageCount}
          onChange={goToPage}
        />
      )}
    </div>
  )
}

// ====================================================================== hero

/** Teachers see their own numbers: lessons they can use, lessons sent to the class, students in the class. */
function teacherStats(email: string | null, lessons: number, sent: number) {
  const students = classStudents(email).length
  return [
    [String(lessons), lessons === 1 ? "lesson in library" : "lessons in library"],
    [String(sent), "sent to my class"],
    [String(students), students === 1 ? "student in class" : "students in class"],
  ]
}

/** Students see their own numbers: lessons from their teacher, how many they finished, their average points. */
function studentStats(email: string | null, sent: string[]) {
  const results = readLessonResults(email).filter((r) => sent.includes(r.resourceId))
  const finished = new Set(results.map((r) => r.resourceId)).size
  // study lessons score 0–100; kid lessons score 0–5 quiz answers (×20)
  const average = results.length ? Math.round(results.reduce((n, r) => n + (r.points ?? r.score * 20), 0) / results.length) : null
  return [
    [String(sent.length), sent.length === 1 ? "lesson from teacher" : "lessons from teacher"],
    [`${finished}/${sent.length}`, "lessons finished"],
    [average === null ? "–" : String(average), "my points / 100"],
  ]
}

function Hero({ stats }: { stats: string[][] }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-black/4 bg-linear-to-br from-hero-start to-hero-end dark:border-white/6">
      <div className="absolute -top-[180px] -right-[140px] size-[460px] rounded-full bg-white/25 dark:bg-white/3" />
      <div className="absolute -top-[120px] -right-10 size-[300px] rounded-full bg-white/20 dark:bg-white/3" />

      <div className="relative flex flex-col gap-7 p-[22px] pb-[70px] @min-[700px]:p-14 @min-[700px]:pb-26 @min-[1100px]:flex-row @min-[1100px]:items-center @min-[1100px]:gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="size-2 shrink-0 rounded-full bg-link" />
            <Eyebrow className="text-link">READ · EXPLORE · GROW</Eyebrow>
          </div>
          <h1 className="mt-5 font-serif text-[34px] leading-[1.1] tracking-[-0.5px] text-foreground @min-[700px]:text-[52px]">
            Read. Explore. Grow.
          </h1>
          <p className="mt-[18px] max-w-[760px] text-[17px] leading-[1.6] text-muted-foreground">
            Interactive reading adventures for young English learners.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {stats.map(([value, label]) => (
            <div key={label} className="w-[130px] rounded-[18px] bg-card p-[18px]">
              <p className="font-serif text-[38px] leading-none font-semibold text-logo [font-variant-numeric:oldstyle-nums]">
                {value}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =================================================================== filters

function FilterSelect({
  label,
  allLabel,
  options,
  value,
  onChange,
}: {
  label: string
  allLabel: string
  options: string[]
  value: string | null
  onChange: (value: string | null) => void
}) {
  const items = [{ label: allLabel, value: "all" }, ...options.map((o) => ({ label: o, value: o }))]

  return (
    <div>
      <Eyebrow className="mb-2 text-[11px]">{label.toUpperCase()}</Eyebrow>
      <Select
        items={items}
        value={value ?? "all"}
        onValueChange={(v) => onChange(v === "all" ? null : (v as string | null))}
      >
        <SelectTrigger
          aria-label={label}
          className="h-[50px]! w-full rounded-[10px] border-border bg-field px-3.5 text-[15px] text-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-[12px]">
          {items.map((it) => (
            <SelectItem key={it.value} value={it.value} className="rounded-lg text-[15px]">
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// =================================================================== deleted lessons (teachers)

function DeletedLessons() {
  const { hiddenLessons, restoreLesson, deleteForever } = useProjects()
  const [open, setOpen] = useState(false)
  if (hiddenLessons.length === 0) return null

  const closeIfLast = () => hiddenLessons.length === 1 && setOpen(false)

  return (
    <>
      <Button variant="outline" className="mt-4 h-10 gap-2 rounded-full px-4 text-[15px] dark:bg-transparent" onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={Delete02Icon} className="size-4.5" />
        Deleted lessons ({hiddenLessons.length})
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85svh] max-w-[calc(100%-2rem)] flex-col rounded-[24px] bg-card p-6 sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Deleted lessons</DialogTitle>
            <DialogDescription>
              You and your students don’t see these. They’re deleted for good after {TRASH_DAYS} days — restore one to bring it back.
            </DialogDescription>
          </DialogHeader>
          <ul className="-mx-1 mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-1">
            {hiddenLessons.map(({ resource: r, daysLeft }) => (
              <li key={r.id} className="flex items-center gap-3 rounded-[14px] bg-muted/50 px-4 py-3">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{r.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.level} · {r.ageGroup} ·{" "}
                    <span className={daysLeft <= 1 ? "font-semibold text-destructive" : ""}>
                      {daysLeft <= 1 ? "Deletes today" : `Deletes in ${daysLeft} days`}
                    </span>
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  title="Delete for good now"
                  className="rounded-[10px] border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:bg-transparent"
                  onClick={() => {
                    deleteForever(r.id)
                    toast(`“${r.title}” was deleted for good`)
                    closeIfLast()
                  }}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  className="rounded-[10px]"
                  onClick={() => {
                    restoreLesson(r.id)
                    toast.success(`“${r.title}” is back`)
                    closeIfLast()
                  }}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}
