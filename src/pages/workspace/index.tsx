import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ArrowRight02Icon, Quiz02Icon, ChartColumnIcon, GridViewIcon, Upload04Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { Eyebrow } from "@/components/resources/section"
import { Leaderboard } from "@/components/student/leaderboard"
import { kidsGames } from "@/data/kids-games"
import { MAX_SCORE } from "@/data/library-results"
import { guideFor, isYoungAge } from "@/data/lesson-guides"
import { classLabel, findAccount } from "@/lib/accounts"
import { dayKey, readActivity } from "@/lib/activity"
import { studentClass } from "@/lib/classes"
import { useAuth, useProjects } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { readLessonResults, readStartedLessons } from "@/lib/lesson-results"
import { readSubmissions } from "@/lib/submissions"
import { cn } from "@/lib/utils"
import { GameIcon } from "@/components/kids/game-icon"

const shortcuts: { to: string; icon: IconSvgElement; title: string; text: string }[] = [
  { to: "/live", icon: Quiz02Icon, title: "Lecture questions", text: "Join your teacher’s live quiz" },
  { to: "/discover", icon: GridViewIcon, title: "Discover", text: "Lessons from your teacher" },
  { to: "/student/progress", icon: ChartColumnIcon, title: "My progress", text: "Scores and ranking" },
  { to: "/student/submit", icon: Upload04Icon, title: "Send work", text: "Hand in to your teacher" },
]

// a few games that fit each class band
const gamePicks = (young: boolean) =>
  (young ? ["reading", "math", "words", "climb"] : ["climb", "reading", "crossmath", "chess"])
    .map((id) => kidsGames.find((g) => g.id === id))
    .filter((g) => g !== undefined)

function readKids(email: string | null): { stars: number; best: Record<string, number> } {
  try {
    return { stars: 0, best: {}, ...JSON.parse(localStorage.getItem(kidsKey(email, "kids")) ?? "{}") }
  } catch {
    return { stars: 0, best: {} }
  }
}

const weekday = new Intl.DateTimeFormat("en", { weekday: "short" })

/** The student's home base: their class, what's next, how the week went. */
export default function WorkspacePage() {
  const { name, email } = useAuth()
  const { resources } = useProjects() // students only get the lessons their teacher sent
  const [today] = useState(() => new Date())
  const [data] = useState(() => {
    const account = findAccount(email)
    const room = studentClass(email)
    return {
      account,
      teacher: room ? findAccount(room.teacher)?.name || room.teacher : null,
      classmates: room?.students.length ?? 0,
      results: readLessonResults(email),
      started: readStartedLessons(email),
      activity: readActivity(email),
      sent: readSubmissions(email).length,
      kids: readKids(email),
    }
  })

  const firstName = name.split(" ")[0]
  const young = isYoungAge(data.account?.ageGroup)
  const finished = new Set(data.results.map((r) => r.resourceId))
  const startedIds = new Set(data.started.map((s) => s.resourceId))
  const doneCount = resources.filter((r) => finished.has(r.id)).length
  const upNext = resources
    .filter((r) => !finished.has(r.id))
    .sort((a, b) => Number(startedIds.has(b.id)) - Number(startedIds.has(a.id)))
    .slice(0, 5)
  const average = data.results.length ? Math.round((data.results.reduce((n, r) => n + r.score, 0) / data.results.length / MAX_SCORE) * 100) : null

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const a = data.activity[dayKey(d)]
    return { d, total: a ? a.lesson + a.game + a.assignment : 0 }
  })
  const weekMax = Math.max(1, ...week.map((w) => w.total))
  const weekTotal = week.reduce((n, w) => n + w.total, 0)
  let streak = 0
  for (let i = week.length - 1; i >= 0 && week[i].total > 0; i--) streak++

  const stats = [
    { emoji: "🎓", value: String(finished.size), label: "Lessons finished" },
    { emoji: "🎯", value: average === null ? "–" : `${average}%`, label: "Average test score" },
    { emoji: "⭐", value: String(data.kids.stars), label: "Game stars" },
    { emoji: "📤", value: String(data.sent), label: "Work sent to teacher" },
  ]

  return (
    <div>
      {/* ---------------------------------------------------------------- hero */}
      <Reveal className="sidebar-glass relative overflow-hidden rounded-[28px] p-6 text-white @min-[700px]:p-10">
        <span aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-[#D9F99D]/10 blur-2xl" />
        <div className="relative flex flex-col gap-8 @min-[900px]:flex-row @min-[900px]:items-center @min-[900px]:justify-between">
          <div className="min-w-0">
            <Eyebrow className="text-[#D9F99D]">MY WORKSPACE</Eyebrow>
            <h1 className="mt-3 font-serif text-[36px] leading-[1.1] @min-[700px]:text-[48px]">
              Hi{firstName ? `, ${firstName}` : ""} 👋
            </h1>
            <p className="mt-2 max-w-xl text-[17px] text-white/75">
              {upNext.length
                ? `You have ${upNext.length} ${upNext.length === 1 ? "lesson" : "lessons"} waiting. Let’s keep going!`
                : resources.length
                  ? "You finished every lesson your teacher sent. Amazing work! 🎉"
                  : "Your teacher hasn’t sent any lessons yet — play a game while you wait."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
              <Chip>🏫 {classLabel(data.account) || "My class"}</Chip>
              {data.teacher && <Chip>👩‍🏫 {data.teacher}</Chip>}
              {data.classmates > 1 && <Chip>👥 {data.classmates} in class</Chip>}
              <Chip className={streak > 0 ? "bg-[#FFB547]/25 text-[#FFE2B0]" : undefined}>🔥 {streak} day streak</Chip>
            </div>
          </div>
          <ProgressRing done={doneCount} total={resources.length} />
        </div>
      </Reveal>

      {/* ---------------------------------------------------------------- stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 @min-[900px]:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 70} className="rounded-[22px] border border-border bg-card p-5 @min-[700px]:p-6">
            <span aria-hidden className="flex size-12 items-center justify-center rounded-[14px] bg-[#E4F5C9] text-2xl dark:bg-lime/15">
              {s.emoji}
            </span>
            <p className="mt-5 font-serif text-[34px] leading-none font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.label}</p>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 grid gap-6 @min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @min-[1100px]:items-stretch">
        {/* ---------------------------------------------------------------- up next */}
        <Reveal as="section" className="flex flex-col rounded-[26px] border border-border bg-card p-6 @min-[700px]:p-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <Eyebrow>UP NEXT</Eyebrow>
              <h2 className="mt-2 font-serif text-[26px] leading-tight text-foreground">From your teacher</h2>
            </div>
            <Link to="/discover" className="text-sm font-bold text-link hover:underline">
              All lessons
            </Link>
          </div>

          {upNext.length === 0 ? (
            <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-[18px] border border-dashed border-border px-6 py-10 text-center">
              <p className="text-4xl" aria-hidden>
                {resources.length ? "🏆" : "📭"}
              </p>
              <p className="mt-3 font-semibold text-foreground">{resources.length ? "All lessons finished!" : "No lessons yet"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {resources.length ? "Try a harder game or check your ranking." : "When your teacher sends a lesson, it shows up here."}
              </p>
            </div>
          ) : (
            <ul className="mt-5 flex flex-col gap-3">
              {upNext.map((r) => {
                const inProgress = startedIds.has(r.id)
                return (
                  <li key={r.id}>
                    <Link
                      to={`/lesson/${r.id}`}
                      className="group flex items-center gap-4 rounded-[18px] border border-border bg-[#F7F8F4] p-3.5 outline-none transition-colors hover:border-link/40 focus-visible:border-link dark:bg-field"
                    >
                      <span
                        aria-hidden
                        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-3xl"
                        style={{ background: r.color }}
                      >
                        {r.image ? <img src={r.image} alt="" className="size-full object-cover" /> : guideFor(r).emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-[18px] font-bold text-foreground">{r.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {r.format} · {r.level} · {r.tasks} {r.tasks === 1 ? "task" : "tasks"}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "hidden shrink-0 rounded-full px-3 py-1 text-xs font-bold @min-[600px]:inline",
                          inProgress ? "bg-[#FFF1D6] text-[#7A4E00]" : "bg-[#E4F5C9] text-green-900 dark:bg-lime/15 dark:text-lime"
                        )}
                      >
                        {inProgress ? "In progress" : "New"}
                      </span>
                      <span className="flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors group-hover:bg-primary/90">
                        {inProgress ? "Continue" : "Start"}
                        <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Reveal>

        <div className="flex flex-col gap-6">
          {/* ---------------------------------------------------------------- week */}
          <Reveal as="section" className="rounded-[26px] border border-border bg-card p-6 @min-[700px]:p-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <Eyebrow>THIS WEEK</Eyebrow>
                <h2 className="mt-2 font-serif text-[26px] leading-tight text-foreground">
                  {weekTotal} {weekTotal === 1 ? "activity" : "activities"}
                </h2>
              </div>
              <span className="text-sm text-muted-foreground">lessons · games · tasks</span>
            </div>
            <div className="mt-6 flex h-36 items-end gap-2" role="img" aria-label={`Activity in the last 7 days: ${week.map((w) => w.total).join(", ")}`}>
              {week.map((w, i) => {
                const isToday = i === week.length - 1
                return (
                  <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-xs font-bold text-foreground tabular-nums">{w.total || ""}</span>
                    <span
                      className={cn("w-full max-w-10 rounded-[10px] transition-[height] duration-700", w.total ? (isToday ? "bg-primary" : "bg-[#9BD27A] dark:bg-lime/60") : "bg-muted")}
                      style={{ height: `${Math.max(8, (w.total / weekMax) * 100)}%` }}
                    />
                    <span className={cn("text-xs", isToday ? "font-bold text-foreground" : "text-muted-foreground")}>{isToday ? "Today" : weekday.format(w.d)}</span>
                  </div>
                )
              })}
            </div>
          </Reveal>

          {/* ---------------------------------------------------------------- shortcuts */}
          <Reveal as="section" className="grid grid-cols-2 gap-3">
            {shortcuts.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="group rounded-[20px] border border-border bg-card p-4 outline-none transition-colors hover:border-link/40 focus-visible:border-link"
              >
                <span className="flex size-10 items-center justify-center rounded-[12px] bg-[#E4F5C9] text-green-900 dark:bg-lime/15 dark:text-lime">
                  <HugeiconsIcon icon={s.icon} className="size-5" />
                </span>
                <p className="mt-3 font-serif text-[17px] font-bold text-foreground">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.text}</p>
              </Link>
            ))}
          </Reveal>
        </div>
      </div>

      {/* ---------------------------------------------------------------- games */}
      <Reveal as="section" className="mt-6 rounded-[26px] border border-border bg-card p-6 @min-[700px]:p-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Eyebrow>PLAY &amp; LEARN</Eyebrow>
            <h2 className="mt-2 font-serif text-[26px] leading-tight text-foreground">Games for {classLabel(data.account) || "you"}</h2>
          </div>
          <Link to="/kids" className="text-sm font-bold text-link hover:underline">
            All games
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 @min-[900px]:grid-cols-4">
          {gamePicks(young).map((g, i) => {
            const best = data.kids.best[g.id] ?? 0
            return (
              <Link
                key={g.id}
                to={g.path}
                className={cn(
                  "group relative flex min-h-[250px] flex-col overflow-hidden rounded-[28px] bg-linear-to-br p-5 font-kids text-white shadow-[0_7px_0_rgba(0,0,0,0.16)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-ring/40 active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,0.16)]",
                  g.tile
                )}
              >
                {/* decorative bubbles, like the Kids games cards */}
                <span aria-hidden className="absolute -top-10 -right-10 size-36 rounded-full bg-white/15" />
                <span aria-hidden className="absolute -bottom-12 -left-8 size-28 rounded-full bg-white/10" />

                <span className="relative w-fit rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">{g.skill}</span>
                <span
                  aria-hidden
                  className={cn(
                    "relative my-3 self-center text-[76px] leading-none drop-shadow-[0_6px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110",
                    i % 2 ? "group-hover:rotate-6" : "group-hover:-rotate-6"
                  )}
                >
                  <GameIcon game={g} imageClassName="h-[84px] w-[104px] shadow-[0_6px_0_rgba(0,0,0,0.15)]" />
                </span>
                <span className="relative mt-auto text-xl leading-tight font-semibold">{g.title}</span>
                <span className="relative mt-2 flex gap-1 text-lg" aria-label={`Best: ${best} of 3 stars`}>
                  {[1, 2, 3].map((n) => (
                    <span key={n} aria-hidden className={n <= best ? "" : "opacity-35 grayscale"}>
                      ⭐
                    </span>
                  ))}
                </span>
              </Link>
            )
          })}
        </div>
      </Reveal>

      <Leaderboard email={email} />
    </div>
  )
}

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("rounded-full bg-white/12 px-3.5 py-1.5 backdrop-blur-sm", className)}>{children}</span>
}

/** Lessons finished out of the ones the teacher sent. */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total ? done / total : 0
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="flex shrink-0 items-center gap-5">
      <div className="relative size-36">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#D9F99D"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className="transition-[stroke-dashoffset] duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-[34px] leading-none font-bold tabular-nums">{Math.round(pct * 100)}%</span>
        </span>
      </div>
      <div>
        <p className="font-serif text-[26px] leading-none font-bold tabular-nums">
          {done}
          <span className="text-white/50">/{total}</span>
        </p>
        <p className="mt-1.5 text-sm text-white/70">lessons finished</p>
      </div>
    </div>
  )
}
