import { useState } from "react"
import { Link } from "react-router-dom"

import { Reveal } from "@/components/motion/reveal"
import { Leaderboard } from "@/components/student/leaderboard"
import { assignments, assignmentGroupFor } from "@/data/assignments"
import { kidsGames } from "@/data/kids-games"
import { classLabel, findAccount } from "@/lib/accounts"
import { dayKey, readActivity } from "@/lib/activity"
import { readAssignmentProgress } from "@/lib/assignment-progress"
import { useAuth, useProjects } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { readSubmissions } from "@/lib/submissions"
import { MAX_SCORE } from "@/data/library-results"
import { starsFor } from "@/data/kids-games"
import { guideFor } from "@/data/lesson-guides"
import { sampleResources } from "@/data/resources"
import { readLessonResults, readStartedLessons } from "@/lib/lesson-results"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

function readKids(email: string | null): { stars: number; best: Record<string, number> } {
  try {
    return { stars: 0, best: {}, ...JSON.parse(localStorage.getItem(kidsKey(email, "kids")) ?? "{}") }
  } catch {
    return { stars: 0, best: {} }
  }
}

const Stars = ({ n }: { n: number }) => (
  <span className="whitespace-nowrap" aria-label={`${n} of 3 stars`}>
    {[1, 2, 3].map((k) => (
      <span key={k} aria-hidden className={k <= n ? "" : "opacity-25 grayscale"}>
        ⭐
      </span>
    ))}
  </span>
)

export default function MyProgressPage() {
  const { email } = useAuth()
  const { resources } = useProjects()
  const [today] = useState(() => new Date())
  const [data] = useState(() => ({
    age: assignmentGroupFor(findAccount(email)?.ageGroup),
    myClass: classLabel(findAccount(email)),
    done: readAssignmentProgress(email),
    kids: readKids(email),
    activity: readActivity(email),
    sent: readSubmissions(email).length,
    results: readLessonResults(email),
    started: readStartedLessons(email),
  }))

  // lessons: best result per lesson, and started ones that aren't finished yet –
  // only lessons the student still has (a lesson the teacher deleted or took back disappears)
  const available = new Set(resources.map((r) => r.id))
  const bestByLesson = new Map<string, (typeof data.results)[number]>()
  for (const r of data.results.filter((x) => available.has(x.resourceId))) {
    const prev = bestByLesson.get(r.resourceId)
    if (!prev || r.score > prev.score || (r.score === prev.score && (r.points ?? 0) > (prev.points ?? 0))) bestByLesson.set(r.resourceId, r)
  }
  const finishedLessons = [...bestByLesson.values()].sort((a, b) => b.takenAt.localeCompare(a.takenAt))
  const inProgress = data.started.filter((l) => available.has(l.resourceId) && !bestByLesson.has(l.resourceId))
  const emojiOf = (id: string) => {
    const r = sampleResources.find((x) => x.id === id)
    return r ? guideFor(r).emoji : "📘"
  }

  const mine = assignments.filter((a) => !data.age || a.age === data.age)
  const finished = mine.filter((a) => (data.done[a.id] ?? 0) > 0)
  const avgStars = finished.length ? finished.reduce((s, a) => s + data.done[a.id], 0) / finished.length : 0

  // last 7 days
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const a = data.activity[dayKey(d)] ?? { lesson: 0, game: 0, assignment: 0 }
    return { d, ...a, total: a.lesson + a.game + a.assignment }
  })
  const weekMax = Math.max(1, ...week.map((w) => w.total))

  let streak = 0
  for (let i = 0; ; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const a = data.activity[dayKey(d)]
    if (!a || a.lesson + a.game + a.assignment === 0) break
    streak++
  }

  const tiles = [
    { emoji: "🎓", value: String(finishedLessons.length), label: "Lessons done" },
    { emoji: "📚", value: `${finished.length}/${mine.length}`, label: "Assignments done" },
    { emoji: "⭐", value: avgStars ? avgStars.toFixed(1) : "–", label: "Average stars" },
    { emoji: "🎮", value: String(data.kids.stars), label: "Game stars" },
    { emoji: "🔥", value: `${streak} ${streak === 1 ? "day" : "days"}`, label: "Current streak" },
  ]

  return (
    <div>
      <Reveal>
        <h1 className="font-serif text-[36px] leading-[1.15] text-foreground">My progress</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          How you’re doing{data.age ? ` in ${data.myClass}` : ""} — keep going, every step counts! 💪
        </p>
      </Reveal>

      <div className="mt-6 grid grid-cols-2 gap-4 @min-[700px]:grid-cols-3 @min-[1100px]:grid-cols-5">
        {tiles.map((t, i) => (
          <Reveal key={t.label} delay={i * 70} className="rounded-[22px] border border-border bg-card p-5">
            <p className="text-3xl" aria-hidden>
              {t.emoji}
            </p>
            <p className="mt-3 font-serif text-[32px] leading-none font-bold text-foreground tabular-nums">{t.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.label}</p>
          </Reveal>
        ))}
      </div>

      <Leaderboard email={email} />

      {/* this week and assignments each use the full width */}
      <div className="mt-6 grid gap-6">
        {/* ---------------- this week */}
        <Reveal className="rounded-[22px] border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">This week</h2>
            <span className="text-sm text-muted-foreground">{week.reduce((s, w) => s + w.total, 0)} activities</span>
          </div>
          <div className="mt-5 flex h-44 items-end gap-3 @min-[900px]:gap-6">
            {week.map((w) => (
              <div key={dayKey(w.d)} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-muted-foreground">{w.total || ""}</span>
                <div
                  className="flex w-full max-w-20 flex-col-reverse overflow-hidden rounded-t-[10px] bg-muted"
                  style={{ height: `${Math.max(4, (w.total / weekMax) * 100)}%` }}
                  title={`${w.lesson} lessons · ${w.game} games · ${w.assignment} assignments`}
                >
                  {(["lesson", "game", "assignment"] as const).map((k) =>
                    w[k] ? <span key={k} className={cn(k === "lesson" ? "bg-[#2F7BDD]" : k === "game" ? "bg-[#6C63FF]" : "bg-[#F2A30F]")} style={{ height: `${(w[k] / w.total) * 100}%` }} /> : null
                  )}
                </div>
                <span className={cn("text-xs", dayKey(w.d) === dayKey(today) ? "font-bold text-foreground" : "text-muted-foreground")}>
                  {w.d.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
          {week.every((w) => w.total === 0) && (
            <p className="mt-3 text-sm text-muted-foreground">No activity yet this week — start a lesson or play a game to fill the bars! 🌱</p>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#2F7BDD]" /> Lessons</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#6C63FF]" /> Games</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-[#F2A30F]" /> Assignments</span>
          </div>
        </Reveal>

        {/* ---------------- assignments */}
        <Reveal delay={80} className="rounded-[22px] border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              Assignments{" "}
              <span className="text-base font-normal text-muted-foreground">
                {finished.length}/{mine.length} done
              </span>
            </h2>
            <Link to="/student/assignments" className="text-sm font-semibold text-link hover:underline">
              Open →
            </Link>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted" aria-label={`${finished.length} of ${mine.length} done`}>
            <div className="h-full rounded-full bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8]" style={{ width: `${(finished.length / Math.max(1, mine.length)) * 100}%` }} />
          </div>
          <ul className="mt-4 grid gap-2 @min-[700px]:grid-cols-2 @min-[1200px]:grid-cols-3">
            {mine.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-[14px] bg-muted/50 px-3 py-2.5">
                <span className="text-2xl" aria-hidden>
                  {a.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{a.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {a.age} · {a.level}
                  </span>
                </span>
                {(data.done[a.id] ?? 0) > 0 ? <Stars n={data.done[a.id]} /> : <span className="text-xs font-semibold text-muted-foreground">Not started</span>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">📤 Work sent to your teacher: {data.sent}</p>
        </Reveal>
      </div>

      {/* ---------------- lessons */}
      <Reveal className="mt-6 rounded-[22px] border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Lessons</h2>
          <Link to="/discover" className="text-sm font-semibold text-link hover:underline">
            Find lessons →
          </Link>
        </div>
        {inProgress.length === 0 && finishedLessons.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No lessons yet — press “Start lesson” on any card in Discover and it will show up here. 📘</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {inProgress.map((l) => (
              <li key={l.resourceId} className="flex items-center gap-3 rounded-[14px] bg-muted/50 px-3 py-2.5">
                <span className="text-2xl" aria-hidden>
                  {emojiOf(l.resourceId)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{l.lesson}</span>
                  <span className="text-xs text-muted-foreground">Started {formatDate(l.startedAt)}</span>
                </span>
                <span className="hidden rounded-full bg-amber-500/14 px-2.5 py-0.5 text-xs font-semibold text-amber-700 sm:inline dark:text-amber-400">In progress</span>
                <Link to={`/lesson/${l.resourceId}`} className="rounded-[10px] bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Continue
                </Link>
              </li>
            ))}
            {finishedLessons.map((r) => (
              <li key={r.resourceId} className="flex items-center gap-3 rounded-[14px] bg-muted/50 px-3 py-2.5">
                <span className="text-2xl" aria-hidden>
                  {emojiOf(r.resourceId)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{r.lesson}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.takenAt)} · Quiz {r.score}/{MAX_SCORE}
                    {r.points !== undefined && ` · ${r.points}/100 points`}
                  </span>
                </span>
                <Stars n={starsFor(r.score, MAX_SCORE)} />
                <Link to={`/lesson/${r.resourceId}`} className="hidden rounded-[10px] border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted sm:inline">
                  Again
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      {/* ---------------- games */}
      <Reveal className="mt-6 rounded-[22px] border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Kids games</h2>
          <Link to="/kids" className="text-sm font-semibold text-link hover:underline">
            Play →
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
          {kidsGames.map((g) => (
            <li key={g.id} className="flex items-center gap-3 rounded-[14px] bg-muted/50 px-3 py-2.5">
              <span className="text-2xl" aria-hidden>
                {g.emoji}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{g.title}</span>
              <Stars n={data.kids.best[g.id] ?? 0} />
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  )
}
