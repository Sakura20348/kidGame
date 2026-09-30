import { useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  LibraryIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { EmptyState } from "@/components/resources/section"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MAX_SCORE, scoreInfo, scoreScale } from "@/data/library-results"
import { isStudentId } from "@/lib/accounts"
import { useAuth } from "@/lib/contexts"
import { classLessonResults } from "@/lib/lesson-results"
import { initialsOf } from "@/data/team"
import { formatDate, pageList } from "@/lib/format"
import { cn } from "@/lib/utils"

const PER_PAGE = 8

/** Colors for the score pill, from red (0) to green (5). */
const scoreTone = [
  "bg-red-500/12 text-red-600 dark:text-red-400",
  "bg-orange-500/12 text-orange-600 dark:text-orange-400",
  "bg-amber-500/14 text-amber-700 dark:text-amber-400",
  "bg-yellow-500/14 text-yellow-700 dark:text-yellow-300",
  "bg-lime-500/14 text-lime-700 dark:text-lime-300",
  "bg-emerald-500/14 text-emerald-700 dark:text-emerald-400",
]

export default function StudentsLibraryPage() {
  const { email } = useAuth()
  // real test results from the students in this teacher's class
  const [results] = useState(() => classLessonResults(email))
  const [filter, setFilter] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const q = query.trim().toLowerCase()
  const filtered = results.filter(
    (r) =>
      (filter === null || r.score === filter) &&
      (!q || [r.student.name, r.student.id, r.lesson, r.level].join(" ").toLowerCase().includes(q))
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, pageCount)
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  const count = (score: number) => results.filter((r) => r.score === score).length
  const average = results.reduce((sum, r) => sum + r.score, 0) / (results.length || 1)

  function choose(score: number | null) {
    setFilter(score)
    setPage(1)
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 @min-[900px]:flex-row @min-[900px]:items-end @min-[900px]:justify-between">
        <Reveal>
          <h1 className="text-[40px] leading-tight font-medium text-foreground @min-[700px]:text-[48px]">
            Student’s library
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">Every student’s lessons and their test scores out of {MAX_SCORE}.</p>
        </Reveal>
        <Reveal delay={120} className="flex items-center gap-4 rounded-[20px] border border-border bg-card px-5 py-3">
          <span aria-hidden className="text-4xl">
            {results.length ? scoreInfo(Math.round(average)).emoji : "📭"}
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Class average</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {results.length ? average.toFixed(1) : "–"} / {MAX_SCORE}
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal as="section" delay={160} className="mt-6 overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Emoji score filters + search */}
        <div className="flex flex-col gap-4 p-5 @min-[1100px]:flex-row @min-[1100px]:items-center @min-[1100px]:justify-between">
          <div role="toolbar" aria-label="Filter by score" className="flex flex-wrap gap-2">
            <FilterButton active={filter === null} onClick={() => choose(null)}>
              <span className="font-medium">All</span>
              <span className="text-xs text-muted-foreground">{results.length}</span>
            </FilterButton>
            {[...scoreScale].reverse().map((s) => (
              <FilterButton
                key={s.score}
                active={filter === s.score}
                onClick={() => choose(filter === s.score ? null : s.score)}
                label={`${s.label}: ${s.score} out of ${MAX_SCORE}`}
              >
                <span aria-hidden className="text-2xl leading-none">
                  {s.emoji}
                </span>
                <span className="font-medium tabular-nums">
                  {s.score}/{MAX_SCORE}
                </span>
                <span className="text-xs text-muted-foreground">{count(s.score)}</span>
              </FilterButton>
            ))}
          </div>

          <div className="relative w-full @min-[1100px]:max-w-[360px]">
            <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search student or lesson..."
              aria-label="Search student or lesson"
              className="h-11 w-full rounded-[12px] border border-border bg-card pr-3 pl-11 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-link"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="border-t border-border p-5">
            <EmptyState
              icon={LibraryIcon}
              title={results.length ? "No results" : "No finished lessons yet"}
              message={results.length ? "Try another score or a different search." : "When your students finish a lesson test, their score out of 5 shows up here."}
            />
          </div>
        ) : (
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                {["Student", "Lesson", "Level", "Taken", "Time", "Score", "Result"].map((h, i) => (
                  <TableHead key={h} className={cn("h-12 text-sm font-medium text-foreground", i === 0 && "pl-5")}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const info = scoreInfo(r.score)
                return (
                  <Reveal as={TableRow} key={r.id} delay={i * 45} className="text-[15px] text-muted-foreground">
                    <TableCell className="py-4 pl-5">
                      <div className="flex items-center gap-3.5">
                        <span
                          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#F2B46B] text-sm font-bold text-green-900"
                        >
                          {initialsOf(r.student.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{r.student.name}</p>
                          <p>{isStudentId(r.student.id) ? <span className="font-mono tracking-wider">ID {r.student.id}</span> : r.student.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-foreground" title={r.lesson}>
                      {r.lesson}
                    </TableCell>
                    <TableCell>{r.level}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(r.takenAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.minutes} min</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3" aria-label={`${r.score} out of ${MAX_SCORE}`}>
                        <span aria-hidden className="text-[32px] leading-none">
                          {info.emoji}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground tabular-nums">
                            {r.score}/{MAX_SCORE}
                          </p>
                          <div aria-hidden className="mt-1 flex gap-1">
                            {Array.from({ length: MAX_SCORE }, (_, i) => (
                              <span
                                key={i}
                                className={cn("h-1.5 w-3 rounded-full", i < r.score ? "bg-primary dark:bg-link" : "bg-muted")}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap", scoreTone[r.score])}>
                        {info.label}
                      </span>
                    </TableCell>
                  </Reveal>
                )
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 border-t border-border p-5">
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[10px] px-4 text-[15px] dark:bg-transparent"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="size-5" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <nav aria-label="Pages" className="flex items-center gap-1">
            {pageList(pageCount, current).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-2 text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  aria-current={p === current ? "page" : undefined}
                  onClick={() => setPage(p)}
                  className={cn(
                    "size-11 rounded-[10px] text-[15px] text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40",
                    p === current && "border border-border bg-muted/60 font-medium"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </nav>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-[10px] px-4 text-[15px] dark:bg-transparent"
            disabled={current >= pageCount}
            onClick={() => setPage(current + 1)}
          >
            <span className="hidden sm:inline">Next</span>
            <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
          </Button>
        </div>
      </Reveal>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center gap-2 rounded-[14px] border px-3.5 text-[15px] text-foreground outline-none transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40",
        active ? "border-primary bg-primary/10 dark:border-link dark:bg-link/10" : "border-border bg-card"
      )}
    >
      {children}
    </button>
  )
}
