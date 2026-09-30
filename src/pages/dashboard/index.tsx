import { useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  News01Icon,
  PodcastIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons"

import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap"
import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import type { Resource } from "@/data/resources"
import { initialsOf } from "@/data/team"
import { classFits, classLabel, gradeOf } from "@/lib/accounts"
import { dayKey, readActivity } from "@/lib/activity"
import { readLessonResults, readStartedLessons } from "@/lib/lesson-results"
import { readQuizzes } from "@/lib/live"
import { classSubmissions } from "@/lib/submissions"
import { classOf, classStudents } from "@/lib/classes"
import { lastSeenLabel, ONLINE_WINDOW_MS } from "@/lib/presence"
import { useAuth, useLibrary, useProjects, useSavedCount } from "@/lib/contexts"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1500px]">
      <Reveal>
        <Header />
      </Reveal>
      <div className="mt-6 grid grid-cols-1 gap-4 @min-[640px]:grid-cols-2 @min-[1100px]:grid-cols-4">
        <Stats />
        <Reveal className="@min-[640px]:col-span-2 @min-[1100px]:col-span-4">
          <ActivityHeatmap />
        </Reveal>
        <Analytics className="@min-[640px]:col-span-2" />
        <Reminders />
        <ProjectList className="@min-[1100px]:row-span-2" />
        <Team className="@min-[640px]:col-span-2" />
        <Progress />
      </div>
    </div>
  )
}

/** Dashboard card – slides into place as you scroll. */
function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Reveal as="section" className={cn("rounded-[24px] bg-card p-6", className)}>
      {children}
    </Reveal>
  )
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[22px] font-medium text-foreground">{children}</h2>
}

// =================================================================== header

function Header() {
  const { openNewProject } = useProjects()

  return (
    <div className="flex flex-col gap-5 @min-[900px]:flex-row @min-[900px]:items-start @min-[900px]:justify-between">
      <div>
        <h1 className="text-[40px] leading-tight font-medium text-foreground @min-[700px]:text-[48px]">Dashboard</h1>
        <p className="mt-1 text-lg text-muted-foreground">Plan, prioritize, and teach your lessons with ease.</p>
      </div>
      <div className="flex flex-wrap gap-3 @min-[900px]:mt-2">
        <Button className="h-14 gap-2.5 rounded-full px-7 text-lg font-medium" onClick={openNewProject}>
          <HugeiconsIcon icon={Add01Icon} className="size-5" />
          Add Project
        </Button>
      </div>
    </div>
  )
}

// =================================================================== stats

function Stats() {
  const { resources, projects } = useProjects()
  const savedCount = useSavedCount()

  // TODO: "Assignments" should come from the API
  const stats = [
    { to: "/dashboard/lessons", title: "Total Resources", value: resources.length, chip: projects.length, note: "Added by you" },
    { to: "/profile", title: "My Projects", value: projects.length, note: "Created with New project" },
    { to: "/library", title: "Saved Resources", value: savedCount, note: "In your library" },
    { to: "/assignments", title: "Assignments", value: 6, note: "Waiting for learners" },
  ]

  return stats.map((s, i) => {
    const featured = i === 0
    return (
      <Reveal key={s.title} delay={i * 90} className="flex *:flex-1">
        <Link
          to={s.to}
          className={cn(
            "group rounded-[24px] p-6 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/40",
            featured ? "bg-linear-to-br from-[#1646A0] to-[#2F7BDD] text-white" : "bg-card text-foreground"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[22px] font-medium">{s.title}</h3>
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors",
                featured ? "border-white bg-white text-green-900" : "border-foreground/70 group-hover:bg-foreground group-hover:text-card"
              )}
            >
              <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-5" />
            </span>
          </div>
          <p className="mt-6 text-[64px] leading-none font-medium tracking-tight">{s.value}</p>
          <p className={cn("mt-5 flex items-center gap-2 text-[15px]", featured ? "text-lime" : "text-link")}>
            {s.chip !== undefined && (
              <span className="flex items-center gap-0.5 rounded-md border border-current px-1 text-[11px]">
                {s.chip}
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" />
              </span>
            )}
            {s.note}
          </p>
        </Link>
      </Reveal>
    )
  })
}

// =================================================================== analytics

const striped =
  "bg-[repeating-linear-gradient(135deg,var(--muted-foreground)_0_3px,transparent_3px_9px)] opacity-60"

/** This week (Sunday–Saturday): what the class did each day – lessons, games and writing tasks. */
function useClassWeek() {
  const { email } = useAuth()
  const [data] = useState(() => {
    const students = classStudents(email)
    const now = new Date()
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const days = Array.from({ length: 7 }, (_, i) => new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i))
    const logs = students.map((st) => readActivity(st.id))
    const perDay = days.map((d) => {
      const key = dayKey(d)
      let lessons = 0
      let games = 0
      let tasks = 0
      for (const log of logs) {
        lessons += log[key]?.lesson ?? 0
        games += log[key]?.game ?? 0
        tasks += log[key]?.assignment ?? 0
      }
      return { date: d, lessons, games, tasks, total: lessons + games + tasks }
    })
    const weekStart = sunday.getTime()
    const finished = students.reduce((n, st) => n + readLessonResults(st.id).filter((r) => new Date(r.takenAt).getTime() >= weekStart).length, 0)
    return { students: students.length, perDay, finished, today: now.getDay() }
  })
  return data
}

function Analytics({ className }: { className?: string }) {
  const week = useClassWeek()
  const max = Math.max(1, ...week.perDay.map((d) => d.total))
  const total = week.perDay.reduce((n, d) => n + d.total, 0)
  const busiest = week.perDay.reduce((a, b) => (b.total > a.total ? b : a))
  const dayName = (d: Date, style: "narrow" | "long") => d.toLocaleDateString("en", { weekday: style })

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle>Lesson Analytics</CardTitle>
        <span className="text-sm text-muted-foreground">This week · all students</span>
      </div>
      <div className="mt-5 flex min-h-[190px] flex-1 items-end justify-between gap-3">
        {week.perDay.map((d, i) => {
          const future = i > week.today
          const isToday = i === week.today
          const height = future ? 100 : d.total ? Math.max(12, (d.total / max) * 100) : 6
          return (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={future ? "" : `${dayName(d.date, "long")}: ${d.lessons} lessons · ${d.games} games · ${d.tasks} writing tasks`}>
              <span className={cn("text-xs font-semibold tabular-nums", isToday ? "text-foreground" : "text-muted-foreground")}>{future ? "" : d.total}</span>
              <div className="relative flex w-full max-w-[74px] flex-1 items-end">
                <div
                  className={cn("w-full rounded-full transition-[height] duration-700", future ? cn(striped, "opacity-25") : isToday ? "bg-[#8DBBFF]" : d.total ? "bg-primary dark:bg-[#2F6FD6]" : "bg-muted")}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className={cn("text-base", isToday ? "font-bold text-foreground" : "text-muted-foreground")}>{dayName(d.date, "narrow")}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { value: total, label: "activities this week" },
          { value: week.finished, label: "lessons finished" },
          { value: busiest.total ? dayName(busiest.date, "long") : "–", label: "busiest day" },
        ].map((st) => (
          <div key={st.label} className="rounded-[12px] bg-muted/60 px-2 py-2.5">
            <p className="text-lg font-semibold text-foreground tabular-nums">{st.value}</p>
            <p className="text-xs text-muted-foreground">{st.label}</p>
          </div>
        ))}
      </div>
      {week.students === 0 && <p className="mt-3 text-center text-sm text-muted-foreground">When students join your class, their daily activity shows here.</p>}
    </Card>
  )
}

// =================================================================== to do (was "Reminders")

/** What needs the teacher's attention today – from real class data. */
function Reminders() {
  const { email } = useAuth()
  const { resources, isSent } = useProjects()
  const navigate = useNavigate()
  const [data] = useState(() => {
    const students = classStudents(email)
    const weekDays = Array.from({ length: 7 }, (_, i) => dayKey(new Date(Date.now() - i * 86400000)))
    const inactive = students.filter((st) => {
      const log = readActivity(st.id)
      return !weekDays.some((d) => log[d] && log[d].lesson + log[d].game + log[d].assignment > 0)
    })
    return { students: students.length, toReview: classSubmissions(email).filter((w) => !w.seenAt).length, inactive: inactive.map((st) => st.name), quizzes: readQuizzes(email).length }
  })
  const sent = resources.filter((r) => isSent(r.id))

  const items: { emoji: string; title: string; text: string; action: string; onClick: () => void; alert?: boolean }[] = [
    {
      emoji: "📥",
      title: data.toReview ? `${data.toReview} ${data.toReview === 1 ? "piece" : "pieces"} of work to review` : "No new work",
      text: data.toReview ? "Your students sent work you haven’t opened yet." : "You’ve seen everything students sent.",
      action: "Open inbox",
      onClick: () => window.dispatchEvent(new Event("pragmalab:open-inbox")),
      alert: data.toReview > 0,
    },
    {
      emoji: "😴",
      title: data.inactive.length ? `${data.inactive.length} ${data.inactive.length === 1 ? "student" : "students"} not active this week` : "Everyone was active this week",
      text: data.inactive.length ? data.inactive.slice(0, 3).join(", ") + (data.inactive.length > 3 ? " …" : "") : data.students ? "Great job keeping the class going! 🎉" : "No students yet – share your class code.",
      action: data.students ? "Student view" : "Team",
      onClick: () => navigate(data.students ? "/dashboard/students" : "/dashboard/team"),
      alert: data.inactive.length > 0,
    },
    {
      emoji: "📚",
      title: `${sent.length} ${sent.length === 1 ? "lesson" : "lessons"} sent to your class`,
      text: sent[0] ? `Newest: ${sent[0].title}` : "Send a lesson so your students can start.",
      action: "Lessons",
      onClick: () => navigate("/dashboard/lessons"),
    },
    {
      emoji: "🎯",
      title: data.quizzes ? `${data.quizzes} Lecture questions ${data.quizzes === 1 ? "quiz" : "quizzes"} ready` : "No live quiz yet",
      text: data.quizzes ? "Start one in class and show the code." : "Make a quick Kahoot-style quiz for your next lesson.",
      action: data.quizzes ? "Play" : "Create",
      onClick: () => navigate("/dashboard/live"),
    },
  ]

  return (
    <Card className="flex flex-col">
      <CardTitle>To do</CardTitle>
      <ul className="mt-4 flex flex-1 flex-col gap-2">
        {items.map((it) => (
          <li key={it.emoji} className={cn("rounded-[16px] px-3 py-2.5", it.alert ? "bg-[#FFF1D6] dark:bg-[#FFD166]/12" : "bg-muted/60")}>
            <div className="flex gap-2.5">
              <span aria-hidden className="text-xl leading-6">
                {it.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug font-semibold text-foreground">{it.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{it.text}</p>
                <button
                  type="button"
                  onClick={it.onClick}
                  className="mt-1.5 rounded-md text-[13px] font-bold text-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {it.action} →
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// =================================================================== projects

function formatIcon(format: Resource["format"]) {
  return format === "Article" ? News01Icon : format === "Podcast" ? PodcastIcon : Video01Icon
}

function ProjectList({ className }: { className?: string }) {
  const { resources, openNewProject } = useProjects()
  const { showDetails } = useLibrary()

  return (
    <Card className={className}>
      <div className="flex items-center justify-between">
        <CardTitle>Projects</CardTitle>
        <Button variant="outline" className="h-10 gap-1.5 rounded-full border-foreground/70 px-4 text-[15px] dark:bg-transparent" onClick={openNewProject}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          New
        </Button>
      </div>
      <ul className="mt-5 space-y-1">
        {resources.slice(0, 6).map((r) => (
          <li key={r.id}>
            <button
              className="flex w-full items-center gap-4 rounded-[14px] p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
              onClick={() => showDetails(r)}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-green-900" style={{ backgroundColor: r.color }}>
                <HugeiconsIcon icon={formatIcon(r.format)} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[17px] text-foreground">{r.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  Level {r.level} · {r.topic}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// =================================================================== team

function Team({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { email } = useAuth()
  const [students] = useState(() => classStudents(email))
  const code = classOf(email!).code
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Team Collaboration</CardTitle>
        <Button
          variant="outline"
          className="h-10 gap-1.5 rounded-full border-foreground/70 px-4 text-[15px] dark:bg-transparent"
          onClick={() => navigate("/dashboard/team")}
        >
          View Team
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4" />
        </Button>
      </div>
      {students.length === 0 ? (
        <p className="mt-5 rounded-[14px] bg-muted/50 p-4 text-[15px] text-muted-foreground">
          No students yet. Share your class code <span className="font-mono font-bold tracking-widest text-foreground">{code}</span> so they can join.
        </p>
      ) : (
      <ul className="mt-5 space-y-4">
        {students.slice(0, 4).map((m) => {
          const online = !!m.lastSeen && Date.now() - new Date(m.lastSeen).getTime() < ONLINE_WINDOW_MS
          return (
          <li key={m.id} className="flex items-center gap-4">
            <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-[#F2B46B] text-sm font-bold text-green-900">
              {initialsOf(m.name)}
              <span
                aria-label={online ? "Online" : "Offline"}
                className={cn(
                  "absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-card",
                  online ? "bg-emerald-500" : "bg-muted-foreground/50"
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] text-foreground">{m.name}</p>
              <p className="truncate text-[13px] text-muted-foreground">
                {m.grade !== undefined || m.ageGroup ? classLabel(m) : "Student"} · {online ? "online now" : m.lastSeen ? `seen ${lastSeenLabel(m.lastSeen)}` : "not signed in yet"}
              </p>
            </div>
          </li>
          )
        })}
            </ul>
      )}
    </Card>
  )
}

// =================================================================== progress gauge

/** Every (student × lesson sent) pair: finished, started, or not started yet. */
function useClassProgress() {
  const { email } = useAuth()
  const { resources, isSent } = useProjects()
  const [students] = useState(() => classStudents(email))
  const sent = resources.filter((r) => isSent(r.id))
  let done = 0
  let started = 0
  for (const st of students) {
    const finished = new Set(readLessonResults(st.id).map((r) => r.resourceId))
    const begun = new Set(readStartedLessons(st.id).map((r) => r.resourceId))
    for (const r of sent) {
      // a lesson counts for the students of its class only
      if (!classFits(r.ageGroup, st.grade ?? gradeOf(st.ageGroup))) continue
      if (finished.has(r.id)) done++
      else if (begun.has(r.id)) started++
    }
  }
  const total = students.reduce((n, st) => n + sent.filter((r) => classFits(r.ageGroup, st.grade ?? gradeOf(st.ageGroup))).length, 0)
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
  return { students: students.length, lessons: sent.length, total, done, started, completed: pct(done), inProgress: pct(started) }
}

function Progress() {
  const progress = useClassProgress()
  const pending = 100 - progress.completed - progress.inProgress
  const arc = "M 30 130 A 100 100 0 0 1 230 130"
  const seg = (start: number, length: number) => ({
    strokeDasharray: `${length} 100`,
    strokeDashoffset: -start,
  })

  return (
    <Card className="flex flex-col">
      <CardTitle>Class progress</CardTitle>
      <p className="mt-1 text-sm text-muted-foreground">
        {progress.students} {progress.students === 1 ? "student" : "students"} · {progress.lessons} {progress.lessons === 1 ? "lesson" : "lessons"} sent
      </p>
      {progress.total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-4xl" aria-hidden>
            📈
          </p>
          <p className="mt-2 font-semibold text-foreground">No progress to show yet</p>
          <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">
            {progress.students === 0 ? "When students join your class, their progress shows here." : "Send a lesson to your class to see how many students finish it."}
          </p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-4 w-full max-w-[300px]">
            <svg viewBox="0 0 260 150" className="w-full" role="img" aria-label={`${progress.completed}% of lessons finished`}>
              <defs>
                <pattern id="gauge-stripes" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="3.5" height="9" className="fill-muted-foreground/60" />
                </pattern>
              </defs>
              <path d={arc} pathLength={100} fill="none" stroke="url(#gauge-stripes)" strokeWidth="40" style={seg(progress.completed + progress.inProgress, pending)} />
              {progress.inProgress > 0 && (
                <path d={arc} pathLength={100} fill="none" strokeWidth="40" strokeLinecap="round" className="stroke-[#FFB547]" style={seg(Math.max(0, progress.completed - 2), progress.inProgress + (progress.completed ? 2 : 0))} />
              )}
              {progress.completed > 0 && <path d={arc} pathLength={100} fill="none" strokeWidth="40" strokeLinecap="round" className="stroke-primary dark:stroke-[#8DBBFF]" style={seg(0, progress.completed)} />}
            </svg>
            <p className="absolute inset-x-0 bottom-0 text-center text-[38px] leading-none font-semibold text-foreground tabular-nums">{progress.completed}%</p>
          </div>
          <p className="mt-2 text-center text-sm text-muted-foreground">of lessons finished</p>
          <div className="flex-1" />
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Finished", value: progress.done, dot: "bg-primary dark:bg-[#8DBBFF]" },
              { label: "Started", value: progress.started, dot: "bg-[#FFB547]" },
              { label: "Not started", value: progress.total - progress.done - progress.started, dot: "bg-muted-foreground/40" },
            ].map((l) => (
              <div key={l.label} className="rounded-[12px] bg-muted/60 px-2 py-2">
                <p className="text-xl font-semibold text-foreground tabular-nums">{l.value}</p>
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("size-2.5 shrink-0 rounded-full", l.dot)} />
                  {l.label}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

