import { useEffect, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Delete02Icon, Search01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { EmptyState } from "@/components/resources/section"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { initialsOf } from "@/data/team"
import { classLabel, isStudentId } from "@/lib/accounts"
import { rankByTests } from "@/components/student/test-ranking"
import { classOf, classStudents, onClassesChange, removeStudent, type ClassStudent } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"
import { formatDate } from "@/lib/format"
import { lastSeenLabel, ONLINE_WINDOW_MS } from "@/lib/presence"
import { cn } from "@/lib/utils"

const isOnline = (s: ClassStudent) => !!s.lastSeen && Date.now() - new Date(s.lastSeen).getTime() < ONLINE_WINDOW_MS

/** Only the teacher's own class: students who joined with the class code. */
export default function TeamPage() {
  const { email } = useAuth()
  const code = classOf(email!).code
  const [students, setStudents] = useState(() => classStudents(email))
  const [query, setQuery] = useState("")

  // refresh when someone joins/leaves, and every 30s for "online"
  useEffect(() => {
    const refresh = () => setStudents(classStudents(email))
    const id = setInterval(refresh, 30_000)
    const off = onClassesChange(refresh)
    return () => {
      clearInterval(id)
      off()
    }
  }, [email])

  const q = query.trim().toLowerCase()
  // class ranking by lesson tests: best average first, students without tests at the end
  const ranking = rankByTests(students.map((s) => s.id))
  const rankOf = new Map(ranking.map((l, i) => [l.id, { ...l, place: l.average === null ? null : i + 1 }]))
  const rows = students
    .filter((s) => !q || `${s.name} ${s.id} ${classLabel(s)}`.toLowerCase().includes(q))
    .sort((a, b) => ranking.findIndex((l) => l.id === a.id) - ranking.findIndex((l) => l.id === b.id))
  const online = students.filter(isOnline).length

  async function remove(s: ClassStudent) {
    try {
      await removeStudent(s.id)
      setStudents(classStudents(email))
      toast(`${s.name} was removed from your class`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  function copy() {
    navigator.clipboard?.writeText(code).then(
      () => toast.success("Class code copied"),
      () => toast(code)
    )
  }

  return (
    <div className="w-full">
      <Reveal>
        <h1 className="text-[40px] leading-tight font-medium text-foreground @min-[700px]:text-[48px]">Team</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-lg text-muted-foreground">
          The students in your class.
          <span className="inline-flex items-center gap-1.5 text-base text-emerald-600 dark:text-emerald-400">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            {online} online now
          </span>
        </p>
      </Reveal>

      {/* class code */}
      <Reveal delay={80} className="mt-6 flex flex-col gap-5 rounded-[24px] sidebar-glass p-6 text-white @min-[800px]:flex-row @min-[800px]:items-center @min-[800px]:justify-between @min-[800px]:p-8">
        <div>
          <p className="text-sm font-bold tracking-[0.14em] text-lime">YOUR CLASS CODE</p>
          <p className="mt-2 font-mono text-5xl font-bold tracking-[0.25em] tabular-nums">{code}</p>
          <p className="mt-3 max-w-lg text-white/80">
            Students sign up with their student ID, then type this code to join. Your plan covers them — students never pay, and nobody else can get in.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <p className="text-right">
            <span className="block text-4xl font-semibold tabular-nums">{students.length}</span>
            <span className="text-sm text-white/75">{students.length === 1 ? "student" : "students"}</span>
          </p>
          <Button className="h-12 gap-2 rounded-[12px] bg-lime px-5 text-base font-bold text-green-900 hover:bg-lime/90" onClick={copy}>
            <HugeiconsIcon icon={Copy01Icon} className="size-5" />
            Copy code
          </Button>
        </div>
      </Reveal>

      <Reveal as="section" delay={140} className="mt-6 overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-4 p-5">
          <p className="text-lg font-semibold text-foreground">Students</p>
          <div className="relative w-full max-w-[420px]">
            <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ID..."
              aria-label="Search students"
              className="h-11 w-full rounded-[12px] border border-border bg-card pr-3 pl-11 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-link"
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="border-t border-border p-5">
            <EmptyState
              icon={UserMultipleIcon}
              title={students.length ? "No students found" : "No students yet"}
              message={students.length ? "Try a different search." : `Share your class code ${code} with your students.`}
            />
          </div>
        ) : (
          <Table className="min-w-[980px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="h-12 w-16 pl-5">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Tests</TableHead>
                <TableHead>Test average</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-5">
                    <RankBadge place={rankOf.get(s.id)?.place ?? null} />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F2B46B] text-xs font-extrabold text-green-900">
                        {initialsOf(s.name)}
                        <span className={cn("absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card", isOnline(s) ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{isStudentId(s.id) ? <span className="font-mono tracking-wider">ID {s.id}</span> : s.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{classLabel(s)}</TableCell>
                  <TableCell className="text-right tabular-nums">{rankOf.get(s.id)?.tests ?? 0}</TableCell>
                  <TableCell>
                    <TestAverage value={rankOf.get(s.id)?.average ?? null} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(s.joinedAt)}</TableCell>
                  <TableCell className={cn("text-sm", isOnline(s) ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                    {isOnline(s) ? "● Online" : s.lastSeen ? lastSeenLabel(s.lastSeen) : "Never"}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button variant="ghost" size="sm" className="gap-1.5 rounded-[8px] text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(s)}>
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Reveal>
    </div>
  )
}

function RankBadge({ place }: { place: number | null }) {
  if (place === null) return <span className="pl-3 text-muted-foreground">–</span>
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full text-sm font-bold",
        place === 1 ? "bg-[#FF9A3C] text-white" : place === 2 ? "bg-[#3B8BF5] text-white" : place === 3 ? "bg-[#8A84F5] text-white" : "bg-muted text-foreground"
      )}
    >
      {place}
    </span>
  )
}

/** Average test score out of 100, with a small bar. */
function TestAverage({ value }: { value: number | null }) {
  if (value === null) return <span className="text-sm text-muted-foreground">No tests yet</span>
  return (
    <span className="flex items-center gap-2.5">
      <span className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-amber-400" : "bg-rose-400")} style={{ width: `${value}%` }} />
      </span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </span>
  )
}
