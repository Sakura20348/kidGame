import { useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { GridViewIcon, Search01Icon, TableIcon, UserMultipleIcon, ViewIcon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { EmptyState } from "@/components/resources/section"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { assignments, assignmentGroupFor } from "@/data/assignments"
import { kidsGames } from "@/data/kids-games"
import { classLabel, isStudentId, readAccounts, type Account, classNames } from "@/lib/accounts"
import { dayKey, readActivity } from "@/lib/activity"
import { readAssignmentProgress } from "@/lib/assignment-progress"
import { kidsKey } from "@/lib/kids-storage"
import { lastSeenLabel, ONLINE_WINDOW_MS, readJoined } from "@/lib/presence"
import { readSubmissions } from "@/lib/submissions"
import { classStudents } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"
import { cn } from "@/lib/utils"

// Everything here is read from this device's storage.
// TODO: load student progress from the API so teachers see every device.

type StudentStats = {
  account: Account
  stars: number
  best: Record<string, number>
  gamesPlayed: number
  assignmentsDone: number
  assignmentsTotal: number
  sent: number
  week: number[] // activities per day, oldest first
  lastSeen?: string
}

function readKids(email: string): { stars: number; best: Record<string, number> } {
  try {
    return { stars: 0, best: {}, ...JSON.parse(localStorage.getItem(kidsKey(email, "kids")) ?? "{}") }
  } catch {
    return { stars: 0, best: {} }
  }
}

function loadStudents(teacher: string | null, today: Date): StudentStats[] {
  const joined = readJoined()
  // only the students who joined this teacher's class
  const mine = new Set(classStudents(teacher).map((s) => s.id.toLowerCase()))
  return readAccounts()
    .filter((a) => a.role === "student" && mine.has(a.email.toLowerCase()))
    .map((account) => {
      const kids = readKids(account.email)
      const activity = readActivity(account.email)
      const done = readAssignmentProgress(account.email)
      const group = assignmentGroupFor(account.ageGroup)
      const mine = assignments.filter((a) => !group || a.age === group)
      const week = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - (6 - i))
        const a = activity[dayKey(d)]
        return a ? a.lesson + a.game + a.assignment : 0
      })
      return {
        account,
        stars: kids.stars,
        best: kids.best,
        gamesPlayed: Object.values(activity).reduce((s, d) => s + d.game, 0),
        assignmentsDone: mine.filter((a) => (done[a.id] ?? 0) > 0).length,
        assignmentsTotal: mine.length,
        sent: readSubmissions(account.email).length,
        week,
        lastSeen: joined.find((j) => j.email.toLowerCase() === account.email.toLowerCase())?.lastSeen,
      }
    })
    .sort((a, b) => (b.lastSeen ?? "").localeCompare(a.lastSeen ?? ""))
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?"

const isOnlineNow = (lastSeen?: string) => !!lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS

type View = "cards" | "table"
const VIEW_KEY = "pragmalab.studentView.layout"
function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "cards"
  } catch {
    return "cards"
  }
}

export default function StudentViewPage() {
  const [today] = useState(() => new Date())
  const { email } = useAuth()
  const [students] = useState(() => loadStudents(email, today))
  const [age, setAge] = useState<string>("All")
  const [query, setQuery] = useState("")
  const [view, setView] = useState<View>(readView)

  function changeView(v: View) {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // ignore
    }
  }

  const q = query.trim().toLowerCase()
  const shown = students.filter(
    (s) => (age === "All" || classLabel(s.account) === age) && (!q || `${s.account.name} ${s.account.email}`.toLowerCase().includes(q))
  )

  const tiles = [
    { emoji: "🧒", value: students.length, label: "Students" },
    { emoji: "⭐", value: students.reduce((n, s) => n + s.stars, 0), label: "Game stars earned" },
    { emoji: "🎮", value: students.reduce((n, s) => n + s.gamesPlayed, 0), label: "Games played" },
    { emoji: "🔥", value: students.filter((s) => s.week.some(Boolean)).length, label: "Active this week" },
  ]

  return (
    <div className="w-full">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-tight font-medium text-foreground @min-[700px]:text-[48px]">Student view</h1>
          <p className="mt-1 text-lg text-muted-foreground">How much your students play, learn and finish — even without you.</p>
        </div>
        <Button variant="outline" className="h-11 gap-2 rounded-[12px]" render={<Link to="/student" />} nativeButton={false}>
          <HugeiconsIcon icon={ViewIcon} className="size-5" />
          Preview student workspace
        </Button>
      </Reveal>

      <div className="mt-6 grid grid-cols-2 gap-4 @min-[900px]:grid-cols-4">
        {tiles.map((t, i) => (
          <Reveal key={t.label} delay={i * 70} className="rounded-[22px] border border-border bg-card p-5">
            <p className="text-3xl" aria-hidden>
              {t.emoji}
            </p>
            <p className="mt-3 text-[32px] leading-none font-semibold text-foreground tabular-nums">{t.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.label}</p>
          </Reveal>
        ))}
      </div>

      {/* filters */}
      <Reveal className="mt-6 flex flex-col gap-3 @min-[900px]:flex-row @min-[900px]:items-center @min-[900px]:justify-between">
        <div role="tablist" aria-label="Filter by class" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[12px] border border-border bg-muted/60 p-1">
          {["All", ...classNames].map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={age === a}
              onClick={() => setAge(a)}
              className={cn(
                "flex h-10 items-center gap-2 rounded-[9px] px-4 text-[15px] whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                age === a && "bg-card font-medium text-foreground shadow-sm"
              )}
            >
              {a}
              <span className="text-xs text-muted-foreground">{a === "All" ? students.length : students.filter((s) => classLabel(s.account) === a).length}</span>
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-3 @min-[900px]:max-w-[460px]">
        <div className="relative flex-1">
          <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or ID..."
            aria-label="Search students"
            className="h-11 w-full rounded-[12px] border border-border bg-card pr-3 pl-11 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-link"
          />
        </div>
        {/* cards ↔ table */}
        <div role="radiogroup" aria-label="Layout" className="flex shrink-0 gap-1 rounded-[12px] border border-border bg-muted/60 p-1">
          {([
            { v: "cards", icon: GridViewIcon, label: "Cards" },
            { v: "table", icon: TableIcon, label: "Table" },
          ] as const).map((o) => (
            <button
              key={o.v}
              role="radio"
              aria-checked={view === o.v}
              aria-label={o.label}
              title={o.label}
              onClick={() => changeView(o.v)}
              className={cn(
                "flex size-9 items-center justify-center rounded-[9px] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                view === o.v && "bg-card text-foreground shadow-sm"
              )}
            >
              <HugeiconsIcon icon={o.icon} className="size-5" />
            </button>
          ))}
        </div>
        </div>
      </Reveal>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-border bg-card p-5">
          <EmptyState
            icon={UserMultipleIcon}
            title={students.length ? "No students found" : "No students yet"}
            message={students.length ? "Try another class or search." : "When students join your class with your class code (see Team), their progress shows here."}
          />
        </div>
      ) : view === "table" ? (
        <StudentTable students={shown} />
      ) : (
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,440px),1fr))] gap-6">
          {shown.map((s, i) => (
            <StudentCard key={s.account.email} s={s} today={today} delay={(i % 6) * 60} />
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">ℹ️ Shows students who used LittleReaderLab on this device. Syncing across devices comes with server accounts.</p>
    </div>
  )
}

function StudentTable({ students }: { students: StudentStats[] }) {
  return (
    <Reveal className="mt-6 overflow-hidden rounded-[24px] border border-border bg-card">
      <Table className="min-w-[900px]">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="h-12 pl-5">Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead className="text-center">⭐ Stars</TableHead>
            <TableHead className="text-center">🎮 Games</TableHead>
            <TableHead className="text-center">📚 Tasks</TableHead>
            <TableHead className="text-center">📤 Sent</TableHead>
            <TableHead>This week</TableHead>
            <TableHead className="pr-5">Last seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const online = isOnlineNow(s.lastSeen)
            const max = Math.max(1, ...s.week)
            return (
              <TableRow key={s.account.email}>
                <TableCell className="py-3 pl-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.account.name} online={online} className="size-10 text-xs" />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{s.account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {isStudentId(s.account.email) ? <span className="font-mono tracking-wider">ID {s.account.email}</span> : s.account.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{classLabel(s.account)}</TableCell>
                <TableCell className="text-center font-semibold tabular-nums">{s.stars}</TableCell>
                <TableCell className="text-center font-semibold tabular-nums">{s.gamesPlayed}</TableCell>
                <TableCell className="text-center font-semibold tabular-nums">
                  {s.assignmentsDone}/{s.assignmentsTotal}
                </TableCell>
                <TableCell className="text-center font-semibold tabular-nums">{s.sent}</TableCell>
                <TableCell>
                  <div className="flex h-8 w-28 items-end gap-1" title={`${s.week.reduce((a, b) => a + b, 0)} activities this week`}>
                    {s.week.map((n, i) => (
                      <span key={i} className={cn("flex-1 rounded-[3px]", n ? "bg-[#6C63FF]" : "bg-muted")} style={{ height: n ? `${(n / max) * 100}%` : "4px" }} />
                    ))}
                  </div>
                </TableCell>
                <TableCell className={cn("pr-5 text-sm", online ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                  {online ? "● Online" : s.lastSeen ? lastSeenLabel(s.lastSeen) : "Never"}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Reveal>
  )
}

function Avatar({ name, online, className }: { name: string; online: boolean; className?: string }) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center rounded-full bg-[#F2B46B] font-extrabold text-green-900", className)}>
      {initialsOf(name)}
      <span className={cn("absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card", online ? "bg-emerald-500" : "bg-muted-foreground/40")} />
    </span>
  )
}

function StudentCard({ s, today, delay }: { s: StudentStats; today: Date; delay: number }) {
  const online = isOnlineNow(s.lastSeen)
  const max = Math.max(1, ...s.week)
  const played = kidsGames.filter((g) => (s.best[g.id] ?? 0) > 0)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  return (
    <Reveal delay={delay} className="flex flex-col rounded-[26px] border border-border bg-card p-6 @min-[700px]:p-7">
      {/* who */}
      <div className="flex items-center gap-3">
        <Avatar name={s.account.name} online={online} className="size-14 text-base" />
        <div className="min-w-0 flex-1">
          <p className="text-xl leading-tight font-semibold break-words text-foreground">{s.account.name}</p>
          <p className="mt-1 text-sm break-all text-muted-foreground">
            {isStudentId(s.account.email) ? <span className="font-mono tracking-wider">ID {s.account.email}</span> : s.account.email}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {s.account.ageGroup && <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-foreground">{classLabel(s.account)}</span>}
            <span className={cn(online && "font-semibold text-emerald-600 dark:text-emerald-400")}>{online ? "● Online" : s.lastSeen ? `Seen ${lastSeenLabel(s.lastSeen)}` : "Never signed in"}</span>
          </p>
        </div>
      </div>

      {/* how much */}
      <div className="mt-6 grid grid-cols-4 gap-2.5 text-center">
        {[
          { v: s.stars, l: "Stars", e: "⭐" },
          { v: s.gamesPlayed, l: "Games", e: "🎮" },
          { v: `${s.assignmentsDone}/${s.assignmentsTotal}`, l: "Tasks", e: "📚" },
          { v: s.sent, l: "Sent", e: "📤" },
        ].map((x) => (
          <div key={x.l} className="flex flex-col items-center rounded-[16px] bg-muted/50 px-1 py-3.5">
            <span aria-hidden className="text-xl">
              {x.e}
            </span>
            <p className="mt-1 text-2xl leading-none font-semibold whitespace-nowrap text-foreground tabular-nums">{x.v}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{x.l}</p>
          </div>
        ))}
      </div>

      {/* this week */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-muted-foreground">This week · {s.week.reduce((a, b) => a + b, 0)} activities</p>
        <div className="mt-3 flex h-24 items-end gap-2">
          {s.week.map((n, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${days[i].toLocaleDateString(undefined, { weekday: "long" })}: ${n}`}>
              <div className={cn("w-full rounded-[6px]", n ? "bg-[#6C63FF]" : "bg-muted")} style={{ height: n ? `${(n / max) * 100}%` : "8px" }} />
              <span className="text-xs text-muted-foreground">{days[i].toLocaleDateString(undefined, { weekday: "narrow" })}</span>
            </div>
          ))}
        </div>
      </div>

      {/* games */}
      <div className="mt-6 border-t border-border pt-5">
        <p className="text-sm font-semibold text-muted-foreground">
          Games played · {played.length} of {kidsGames.length}
        </p>
        {played.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {played.map((g) => (
              <li key={g.id} className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-foreground" title={g.title}>
                <span aria-hidden>{g.emoji}</span>
                {g.title}
                <span className="ml-0.5 whitespace-nowrap" aria-label={`${s.best[g.id]} of 3 stars`}>
                  {"⭐".repeat(s.best[g.id])}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No games yet.</p>
        )}
      </div>
    </Reveal>
  )
}
