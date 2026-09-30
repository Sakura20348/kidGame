import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { LeftToRightListNumberIcon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { findAccount } from "@/lib/accounts"
import { readAssignmentProgress } from "@/lib/assignment-progress"
import { getAvatar } from "@/lib/avatar"
import { studentClass } from "@/lib/classes"
import { useProjects } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { readLessonResults } from "@/lib/lesson-results"
import { cn } from "@/lib/utils"

export type Learner = {
  id: string
  name: string
  photo: string | null
  score: number // overall
  rating: number // average lesson test, out of 10
  live: { games: number; points: number; right: number; questions: number } // Lecture questions
  me: boolean
}

type LiveResult = { score: number; right: number; questions: number }

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback
  } catch {
    return fallback
  }
}

const gameStars = (id: string) => readJson<{ stars?: number }>(kidsKey(id, "kids"), {}).stars ?? 0

/** Points: lesson points ×10, game stars ×100, assignment stars ×200, lecture-question points ÷10. */
function learnerOf(id: string, me: string | null): Learner {
  const results = readLessonResults(id)
  const lessonPoints = results.reduce((n, r) => n + (r.points ?? r.score * 20), 0)
  const taskStars = Object.values(readAssignmentProgress(id)).reduce((n, s) => n + s, 0)
  const games = readJson<LiveResult[]>(kidsKey(id, "liveResults"), [])
  const live = {
    games: games.length,
    points: games.reduce((n, g) => n + g.score, 0),
    right: games.reduce((n, g) => n + g.right, 0),
    questions: games.reduce((n, g) => n + g.questions, 0),
  }
  return {
    id,
    name: findAccount(id)?.name || id,
    photo: getAvatar(id),
    score: lessonPoints * 10 + gameStars(id) * 100 + taskStars * 200 + Math.round(live.points / 10),
    rating: results.length ? (results.reduce((n, r) => n + r.score, 0) / results.length) * 2 : 0,
    live,
    me: !!me && id.toLowerCase() === me.toLowerCase(),
  }
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?"

/** Everyone in my class (and me), from the highest overall score. */
export function classRanking(email: string | null): Learner[] {
  const classmates = studentClass(email)?.students.map((s) => s.id) ?? []
  const ids = email && !classmates.some((c) => c.toLowerCase() === email.toLowerCase()) ? [...classmates, email] : classmates
  return ids.map((id) => learnerOf(id, email)).sort((a, b) => b.score - a.score || b.rating - a.rating)
}

type Tab = "overall" | "live"
const valueOf = (l: Learner, tab: Tab) => (tab === "overall" ? l.score : l.live.points)
const fmt = (n: number) => n.toLocaleString("en-US")

/** Compact class leaderboard: my totals, an Overall / Lecture questions podium and the full list. */
export function Leaderboard({ email }: { email: string | null }) {
  const { resources } = useProjects()
  const [data] = useState(() => {
    const learners = classRanking(email)
    const results = readLessonResults(email)
    return { learners, minutes: results.reduce((n, r) => n + r.minutes, 0), finished: new Set(results.map((r) => r.resourceId)) }
  })
  const [tab, setTab] = useState<Tab>("overall")
  const [listOpen, setListOpen] = useState(false)

  const order = (t: Tab) => [...data.learners].sort((a, b) => valueOf(b, t) - valueOf(a, t) || a.name.localeCompare(b.name))
  const ranked = order(tab)
  const overallRank = order("overall").findIndex((l) => l.me) + 1 // same order as the Overall podium
  const me = ranked.find((l) => l.me)
  const done = resources.filter((r) => data.finished.has(r.id)).length
  const [first, second, third] = ranked

  const stats = [
    { emoji: "⏱️", value: `${Math.floor(data.minutes / 60)}h ${data.minutes % 60}m`, label: "Learning time" },
    { emoji: "📚", value: `${done}/${resources.length}`, label: "Lessons finished" },
    { emoji: "🎯", value: me ? `${fmt(me.live.points)}` : "0", label: `Lecture questions · ${me?.live.games ?? 0} ${me?.live.games === 1 ? "game" : "games"}` },
    { emoji: "🏆", value: me ? fmt(me.score) : "0", label: overallRank > 0 && ranked.length > 1 ? `Total score · #${overallRank} in class` : "Total score" },
  ]

  return (
    <Reveal className="mt-6 rounded-[24px] border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-xl font-bold text-foreground">🏆 Class leaderboard</h2>
        <div role="tablist" aria-label="Ranking" className="flex gap-1 rounded-full bg-muted p-1">
          {(
            [
              ["overall", "Overall"],
              ["live", "🎯 Lecture questions"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "h-8 rounded-full px-3 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                tab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setListOpen(true)}
          aria-label="See everyone’s scores"
          title="See everyone’s scores"
          className="flex size-9 items-center justify-center rounded-[10px] border border-border text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <HugeiconsIcon icon={LeftToRightListNumberIcon} className="size-5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 @min-[800px]:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className="flex items-center gap-2.5 rounded-[14px] bg-muted/60 px-3 py-2.5">
            <span aria-hidden className="text-xl">
              {st.emoji}
            </span>
            <span className="min-w-0">
              <span className="block text-lg leading-tight font-bold text-foreground tabular-nums">{st.value}</span>
              <span className="block truncate text-xs text-muted-foreground">{st.label}</span>
            </span>
          </div>
        ))}
      </div>

      {/* small podium */}
      <div className="mx-auto mt-5 grid max-w-md grid-cols-3 items-end gap-2">
        <Podium learner={second} place={2} tab={tab} />
        <Podium learner={first} place={1} tab={tab} />
        <Podium learner={third} place={3} tab={tab} />
      </div>
      {tab === "live" && ranked.every((l) => l.live.games === 0) && (
        <p className="mt-3 text-center text-sm text-muted-foreground">No Lecture questions games yet — join one when your teacher shows a code.</p>
      )}

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="flex max-h-[85svh] max-w-[calc(100%-2rem)] flex-col rounded-[24px] bg-card p-6 sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{tab === "overall" ? "Class ranking 🏆" : "Lecture questions ranking 🎯"}</DialogTitle>
            <DialogDescription>
              {tab === "overall" ? "Everyone in your class, from the highest total score." : "Everyone in your class, by points from live Lecture questions games."}
            </DialogDescription>
          </DialogHeader>
          <ol className="-mx-2 mt-1 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2 py-1">
            {ranked.map((l, i) => (
              <li key={l.id} className={cn("flex items-center gap-3 rounded-[12px] px-3 py-2", l.me ? "bg-[#FFD166]/25 ring-2 ring-[#FFD166]" : "bg-muted/50")}>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    i === 0 ? "bg-[#FF9A3C] text-white" : i === 1 ? "bg-[#3B8BF5] text-white" : i === 2 ? "bg-[#8A84F5] text-white" : "bg-card text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <Avatar learner={l} className="size-8 text-xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {l.name}
                    {l.me && <span className="ml-1.5 rounded-full bg-[#FFD166] px-1.5 text-[10px] font-bold text-[#2B2140]">YOU</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tab === "overall"
                      ? `★ ${l.rating ? l.rating.toFixed(1) : "–"} lesson tests`
                      : `${l.live.games} ${l.live.games === 1 ? "game" : "games"} · ${l.live.right}/${l.live.questions} right`}
                  </span>
                </span>
                <span className="font-bold text-foreground tabular-nums">{fmt(valueOf(l, tab))}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            {tab === "overall"
              ? "Total = lesson points ×10 + game stars ×100 + writing stars ×200 + lecture-question points ÷10."
              : "Right answers give 500–1000 points – the faster, the more."}
          </p>
        </DialogContent>
      </Dialog>
    </Reveal>
  )
}

function Avatar({ learner, className }: { learner: Learner; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F2B46B] font-bold text-green-900", className)}>
      {learner.photo ? <img src={learner.photo} alt="" className="size-full object-cover" /> : initials(learner.name)}
    </span>
  )
}

const block = {
  1: "h-16 bg-linear-to-b from-[#FFB35C] to-[#FF8A2A]",
  2: "h-12 bg-linear-to-b from-[#4C9BFF] to-[#2574E8]",
  3: "h-9 bg-linear-to-b from-[#9A93FF] to-[#7069E8]",
} as const

function Podium({ learner, place, tab }: { learner?: Learner; place: 1 | 2 | 3; tab: Tab }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      {learner ? (
        <>
          <Avatar learner={learner} className={cn("border-2", place === 1 ? "size-12 text-sm" : "size-10 text-xs", learner.me ? "border-[#FFD166]" : "border-card")} />
          <p className="mt-1 max-w-full truncate px-1 text-center text-xs font-semibold text-foreground">
            {learner.name.split(" ")[0]}
            {learner.me && <span className="ml-1 rounded-full bg-[#FFD166] px-1 text-[9px] font-bold text-[#2B2140]">YOU</span>}
          </p>
          <p className="mb-1.5 text-xs text-muted-foreground tabular-nums">{fmt(valueOf(learner, tab))}</p>
        </>
      ) : (
        <p className="mb-1.5 text-xs text-muted-foreground">—</p>
      )}
      <div className={cn("flex w-full items-center justify-center rounded-t-[10px] text-2xl font-bold text-white/90", block[place])}>{place}</div>
    </div>
  )
}
