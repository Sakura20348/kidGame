import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, ArrowRight01Icon, ArrowRight02Icon, BookOpen01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { ageGroups, assignments, fixesOf, parse, wordCount, type Assignment, type Segment, assignmentGroupFor } from "@/data/assignments"
import { shuffle, starsFor } from "@/data/kids-games"
import { findAccount } from "@/lib/accounts"
import { logActivity } from "@/lib/activity"
import { readAssignmentProgress, saveAssignmentProgress, type AssignmentProgress } from "@/lib/assignment-progress"
import { useAuth } from "@/lib/contexts"
import { cn } from "@/lib/utils"

export default function StudentAssignmentsPage() {
  const { email } = useAuth()
  const myAge = assignmentGroupFor(findAccount(email)?.ageGroup)
  const [age, setAge] = useState<string>(myAge && ageGroups.includes(myAge) ? myAge : "all")
  const [progress, setProgress] = useState<AssignmentProgress>(() => readAssignmentProgress(email))
  const [open, setOpen] = useState<Assignment | null>(null)

  function finish(a: Assignment, stars: number) {
    logActivity(email, "assignment")
    const next = { ...progress, [a.id]: Math.max(progress[a.id] ?? 0, stars) }
    setProgress(next)
    saveAssignmentProgress(email, next)
  }

  if (open) {
    const list = assignments.filter((a) => age === "all" || a.age === age)
    const next = list[list.indexOf(open) + 1]
    return <Lesson key={open.id} a={open} best={progress[open.id] ?? 0} onFinish={finish} onBack={() => setOpen(null)} onNext={next ? () => setOpen(next) : undefined} />
  }

  const list = assignments.filter((a) => age === "all" || a.age === age)

  return (
    <div>
      <Reveal>
        <h1 className="font-serif text-[36px] leading-[1.15] text-foreground">My assignments</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          Choose your class, open a text and learn from the corrections — then try fixing it yourself.
        </p>
      </Reveal>

      <div role="radiogroup" aria-label="Class" className="mt-6 flex flex-wrap gap-2">
        {["all", ...ageGroups].map((g) => {
          const count = g === "all" ? assignments.length : assignments.filter((a) => a.age === g).length
          return (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={age === g}
              onClick={() => setAge(g)}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                age === g
                  ? "border-transparent bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8] text-white shadow-[0_4px_12px_-4px_rgba(47,123,221,0.6)]"
                  : "border-border bg-card text-foreground hover:bg-[#3B8BE8]/10"
              )}
            >
              {g === "all" ? "All classes" : g}
              {g === myAge && <span aria-label="your class">⭐</span>}
              <span className={cn("text-xs", age === g ? "text-white/80" : "text-muted-foreground")}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {list.map((a, i) => {
          const stars = progress[a.id] ?? 0
          return (
            <Reveal key={a.id} delay={(i % 3) * 80} as="article" className="flex flex-col overflow-hidden rounded-[22px] border border-border bg-card">
              <div className="relative flex h-36 items-center justify-center" style={{ backgroundColor: a.color }}>
                <div className="absolute inset-0 hidden bg-black/50 dark:block" />
                <span className="relative text-6xl" aria-hidden>
                  {a.emoji}
                </span>
                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-[#2B2140]">{a.age}</span>
                <span className="absolute top-3 right-3 rounded-full bg-green-900 px-3 py-1 text-sm font-bold text-white">{a.level}</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-serif text-[22px] leading-tight text-foreground">{a.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.topic} · ✏️ {fixesOf(a).length} corrections · {wordCount(a)} words
                </p>
                <div className="flex-1" />
                <div className="mt-4 flex items-center justify-between gap-3">
                  {stars > 0 ? (
                    <span className="text-lg" aria-label={`Done: ${stars} of 3 stars`}>
                      {"⭐".repeat(stars)}
                      <span className="opacity-30 grayscale">{"⭐".repeat(3 - stars)}</span>
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#FFF1D6] px-3 py-1 text-sm font-semibold text-[#8B5A2B] dark:bg-white/10 dark:text-[#FFD166]">New</span>
                  )}
                  <Button onClick={() => setOpen(a)} className="h-11 gap-2 rounded-[12px] px-5 font-semibold">
                    {stars > 0 ? "Open again" : "Start lesson"} <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                  </Button>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

// =================================================================== lesson

type Fix = Extract<Segment, { k: "fix" }>
type Mode = "review" | "practice"

function Lesson({
  a,
  best,
  onFinish,
  onBack,
  onNext,
}: {
  a: Assignment
  best: number
  onFinish: (a: Assignment, stars: number) => void
  onBack: () => void
  onNext?: () => void
}) {
  const segments = useMemo(() => parse(a.raw), [a])
  const fixes = segments.filter((s): s is Fix => s.k === "fix" && s.wrong !== s.right)
  const quizItems = segments.filter((s): s is Fix => s.k === "fix")
  const [mode, setMode] = useState<Mode>("review")
  const [selected, setSelected] = useState<number | null>(fixes[0]?.id ?? null)
  const textRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  // practice state
  const [solved, setSolved] = useState<Set<number>>(new Set())
  const [missed, setMissed] = useState<Set<number>>(new Set())
  const [shake, setShake] = useState<string | null>(null)
  const [stars, setStars] = useState<number | null>(null)
  const [options] = useState(() =>
    Object.fromEntries(
      quizItems.map((f) => [f.id, shuffle([...new Set([f.wrong, f.right, f.alt])])])
    ) as Record<number, string[]>
  )

  function select(id: number, from: "text" | "card") {
    setSelected(id)
    const target = from === "text" ? cardsRef.current?.querySelector(`[data-card="${id}"]`) : textRef.current?.querySelector(`[data-fix="${id}"]`)
    target?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  function answer(f: Fix, choice: string) {
    if (solved.has(f.id)) return
    if (choice === f.right) {
      const next = new Set(solved).add(f.id)
      setSolved(next)
      const nextIndex = quizItems.find((q) => !next.has(q.id))
      setSelected(nextIndex?.id ?? null)
      if (next.size === quizItems.length) {
        const s = starsFor(quizItems.length - missed.size, quizItems.length)
        setStars(s)
        onFinish(a, Math.max(1, s))
      }
    } else {
      setMissed((m) => new Set(m).add(f.id))
      setShake(`${f.id}-${choice}`)
      setTimeout(() => setShake(null), 500)
    }
  }

  function restartPractice() {
    setSolved(new Set())
    setMissed(new Set())
    setStars(null)
    setSelected(quizItems[0]?.id ?? null)
  }

  const label = (s: string) => (s === "" ? "✂️ leave it out" : s)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center gap-2 rounded-full bg-card px-4 text-[15px] font-semibold shadow-[0_3px_0_rgba(0,0,0,0.06)] outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          My assignments
        </button>
        <h1 className="font-serif text-3xl text-foreground">
          {a.emoji} {a.title}
        </h1>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{a.age}</span>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">{a.level} · {a.topic}</span>
        {best > 0 && <span aria-label={`Best: ${best} stars`}>{"⭐".repeat(best)}</span>}
      </div>

      {/* mode switch */}
      <div role="tablist" aria-label="Lesson mode" className="mb-5 inline-grid grid-cols-2 gap-1 rounded-[14px] bg-muted p-1">
        {(
          [
            ["review", "📖 Review corrections", BookOpen01Icon],
            ["practice", "✍️ Fix it yourself", PencilEdit02Icon],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              if (id === mode) return
              // peeking at the answers in the middle of the practice starts it again
              const peeked = id === "review" && stars === null && (solved.size > 0 || missed.size > 0)
              if (peeked) restartPractice()
              setMode(id)
              setSelected(id === "review" ? (fixes[0]?.id ?? null) : peeked ? (quizItems[0]?.id ?? null) : (quizItems.find((q) => !solved.has(q.id))?.id ?? null))
            }}
            className={cn(
              "h-11 rounded-[11px] px-5 text-[15px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
              mode === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {text}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        {/* ---------------- the text */}
        <div ref={textRef} className="rounded-[22px] border border-border bg-card p-6 text-[18px] leading-[2.1] text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-9">
          {mode === "practice" && (
            <div className="mb-5">
              <div className="flex items-start justify-between gap-4 text-sm font-medium text-muted-foreground">
                <span>Tap each yellow spot and choose the correct version.</span>
                <span className="shrink-0 whitespace-nowrap tabular-nums">
                  {solved.size}/{quizItems.length}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8] transition-[width] duration-500" style={{ width: `${(solved.size / Math.max(1, quizItems.length)) * 100}%` }} />
              </div>
              {stars === null && (
                <p className="mt-2 text-xs text-muted-foreground">⚠️ Opening “Review corrections” before you finish starts this practice again from 0.</p>
              )}
            </div>
          )}

          <div className="whitespace-pre-line">
            {segments.map((s, i) => {
              if (s.k === "text") return <span key={i}>{s.text}</span>
              const isFix = s.wrong !== s.right

              if (mode === "review") {
                if (!isFix) return <span key={i}>{s.right}</span>
                return (
                  <button
                    key={i}
                    type="button"
                    data-fix={s.id}
                    onClick={() => select(s.id, "text")}
                    className={cn("rounded-md text-left outline-none transition-shadow", selected === s.id && "ring-2 ring-[#2F7BDD] ring-offset-2 ring-offset-card")}
                  >
                    {s.wrong && <span className="rounded bg-[#F9CFA9] px-1 text-[#6B3A12] line-through decoration-2 dark:bg-[#8A4B22]/60 dark:text-[#FFD9B8]">{s.wrong}</span>}
                    {s.wrong && s.right && " "}
                    {s.right && <span className="rounded bg-[#F9D99A] px-1 font-medium text-[#3F2A07] dark:bg-[#8A6A1E]/60 dark:text-[#FFE7AE]">{s.right}</span>}
                  </button>
                )
              }

              // practice
              const done = solved.has(s.id)
              if (done)
                return (
                  <span key={i} className={cn("animate-kid-pop rounded bg-[#CFF1DF] px-1 font-medium text-[#16664A] dark:bg-[#2BC0A4]/25 dark:text-[#8BF0CF]", !s.right && "hidden")}>
                    {s.right}
                  </span>
                )
              return (
                <span key={i} data-fix={s.id} className="inline">
                  <button
                    type="button"
                    onClick={() => setSelected(s.id)}
                    className={cn(
                      "rounded-md border-2 border-dashed px-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                      selected === s.id ? "border-[#2F7BDD] bg-[#FFF1D6] dark:bg-[#8A6A1E]/40" : "border-[#E0A800] bg-[#FFF8E6] dark:bg-white/10"
                    )}
                  >
                    {s.wrong || "＿＿"}
                  </button>
                  {selected === s.id && (
                    <span className="mx-1 inline-flex flex-wrap gap-1 align-middle">
                      {options[s.id].map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => answer(s, o)}
                          className={cn(
                            "animate-bubble-in rounded-full border border-border bg-card px-3 py-0.5 text-[15px] leading-7 font-semibold shadow-sm outline-none hover:border-[#2F7BDD] hover:bg-[#3B8BE8]/10 focus-visible:ring-2 focus-visible:ring-ring/40",
                            shake === `${s.id}-${o}` && "animate-kid-shake border-destructive text-destructive"
                          )}
                        >
                          {label(o)}
                        </button>
                      ))}
                    </span>
                  )}
                </span>
              )
            })}
          </div>

          {mode === "practice" && stars !== null && (
            <div className="mt-6 animate-kid-pop rounded-[18px] bg-[#DDF7EF] p-5 text-center text-[#16664A] dark:bg-[#2BC0A4]/20 dark:text-[#8BF0CF]">
              <p className="text-2xl font-semibold">🎉 All fixed!</p>
              <p className="mt-1">
                {quizItems.length - missed.size} of {quizItems.length} right on the first try.
              </p>
              <p className="mt-2 text-3xl" aria-label={`${stars} of 3 stars`}>
                {"⭐".repeat(stars)}
                <span className="opacity-30 grayscale">{"⭐".repeat(3 - stars)}</span>
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button variant="outline" className="rounded-[10px] dark:bg-transparent" onClick={restartPractice}>
                  Try again
                </Button>
                {onNext && (
                  <Button className="gap-2 rounded-[10px]" onClick={onNext}>
                    Next assignment <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---------------- correction cards */}
        <div
          ref={cardsRef}
          className="space-y-4 lg:sticky lg:top-4 lg:-ml-5 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto lg:py-3 lg:pr-2 lg:pl-5"
          data-lenis-prevent
        >
          {(mode === "review" ? fixes : quizItems.filter((f) => missed.has(f.id) || (solved.has(f.id) && f.wrong !== f.right))).map((f) => (
            <button
              key={f.id}
              type="button"
              data-card={f.id}
              onClick={() => (mode === "review" ? select(f.id, "card") : setSelected(f.id))}
              className={cn(
                "block min-h-28 w-full rounded-[20px] border bg-card px-5 py-5 text-left outline-none transition-[transform,box-shadow,border-color] duration-300 focus-visible:ring-2 focus-visible:ring-ring/40",
                selected === f.id
                  ? "border-[#2F7BDD]/50 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] lg:-translate-x-3"
                  : "border-border hover:border-[#2F7BDD]/30"
              )}
            >
              <span className="flex flex-wrap items-center gap-2.5 text-[17px]">
                <span className="text-muted-foreground">{f.wrong || "(missing word)"}</span>
                <span aria-hidden className="text-muted-foreground">
                  →
                </span>
                <span className="rounded-lg bg-[#2F7BDD] px-2.5 py-1 font-semibold text-white">{f.right || "(remove it)"}</span>
              </span>
              <span className="mt-3 block text-[15px] leading-relaxed text-muted-foreground">{f.why}</span>
            </button>
          ))}
          {mode === "practice" && missed.size === 0 && solved.size === 0 && (
            <p className="rounded-[18px] border border-dashed border-border p-5 text-sm text-muted-foreground">
              Explanations appear here as you fix the text. Some yellow spots are already correct — choose the same word to keep them!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

