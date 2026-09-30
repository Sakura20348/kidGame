import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Clock01Icon, Delete02Icon, Edit02Icon, PlayIcon, Quiz02Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { EmptyState } from "@/components/resources/section"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAvatar } from "@/lib/avatar"
import { useAuth } from "@/lib/contexts"
import {
  blankQuestion,
  endGame,
  nextStep,
  quizProblem,
  readQuizzes,
  saveQuizzes,
  startGame,
  tiles,
  useLiveGame,
  useTicker,
  type LiveQuiz,
  type LiveState,
} from "@/lib/live"
import { cn } from "@/lib/utils"

const HOST_KEY = "pragmalab.live.host"

/** Teachers: write quizzes and host them live – students join with a code, like Kahoot. */
export default function LectureQuestionsPage() {
  const { email } = useAuth()
  const [quizzes, setQuizzes] = useState(() => readQuizzes(email))
  const [editing, setEditing] = useState<LiveQuiz | null>(null)
  // the running game in this tab (kept, so a reload brings the host screen back)
  const [pin, setPinState] = useState<string | null>(() => sessionStorage.getItem(HOST_KEY))
  const setPin = (p: string | null) => {
    if (p) sessionStorage.setItem(HOST_KEY, p)
    else sessionStorage.removeItem(HOST_KEY)
    setPinState(p)
  }
  const [starting, setStarting] = useState<string | null>(null)

  function store(next: LiveQuiz[]) {
    setQuizzes(next)
    saveQuizzes(email, next)
  }

  async function host(q: LiveQuiz) {
    const problem = quizProblem(q)
    if (problem) return toast.error(problem)
    setStarting(q.id)
    try {
      setPin((await startGame(q)).pin)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setStarting(null)
    }
  }

  if (pin) return <HostScreen pin={pin} onClose={() => setPin(null)} />
  if (editing)
    return (
      <QuizEditor
        quiz={editing}
        onCancel={() => setEditing(null)}
        onSave={(q) => {
          store(quizzes.some((x) => x.id === q.id) ? quizzes.map((x) => (x.id === q.id ? q : x)) : [q, ...quizzes])
          setEditing(null)
          toast.success(`“${q.title}” saved`)
        }}
      />
    )

  return (
    <div className="w-full">
      <Reveal className="flex flex-col gap-4 @min-[800px]:flex-row @min-[800px]:items-end @min-[800px]:justify-between">
        <div>
          <h1 className="text-[40px] leading-tight font-medium text-foreground @min-[700px]:text-[48px]">Lecture questions</h1>
          <p className="mt-1 text-lg text-muted-foreground">Make a quiz, press Start and show the code — your students answer live on their own devices.</p>
        </div>
        <Button className="h-12 gap-2 rounded-[12px] px-5 text-base font-bold" onClick={() => setEditing({ id: `quiz-${Date.now()}`, title: "", questions: [blankQuestion()], updatedAt: new Date().toISOString() })}>
          <HugeiconsIcon icon={Add01Icon} className="size-5" />
          New quiz
        </Button>
      </Reveal>

      <div className="mt-6">
        {quizzes.length === 0 ? (
          <EmptyState icon={Quiz02Icon} title="No quizzes yet" message="Create a quiz with a few questions, then start it live in class." />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {quizzes.map((q, i) => (
              <Reveal key={q.id} delay={i * 60} className="flex flex-col rounded-[22px] border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <span aria-hidden className="grid size-14 shrink-0 grid-cols-2 gap-1 rounded-[14px] bg-[#1F5FBF] p-1.5">
                    {tiles.map((t) => (
                      <span key={t.name} className={cn("rounded-[4px]", t.color)} />
                    ))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-foreground">{q.title || "Untitled quiz"}</p>
                    <p className="text-sm text-muted-foreground">
                      {q.questions.length} {q.questions.length === 1 ? "question" : "questions"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <Button className="h-11 flex-1 gap-2 rounded-[12px] font-bold" disabled={starting === q.id} onClick={() => host(q)}>
                    <HugeiconsIcon icon={PlayIcon} className="size-4" />
                    {starting === q.id ? "Starting…" : "Start live"}
                  </Button>
                  <Button variant="outline" size="icon-lg" aria-label="Edit quiz" className="rounded-[12px] dark:bg-transparent" onClick={() => setEditing(q)}>
                    <HugeiconsIcon icon={Edit02Icon} className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Delete quiz"
                    className="rounded-[12px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      store(quizzes.filter((x) => x.id !== q.id))
                      toast(`“${q.title}” deleted`, { action: { label: "Undo", onClick: () => store(quizzes) } })
                    }}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-5" />
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =================================================================== editor

const field = "h-11 w-full rounded-[10px] border border-border bg-field px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-link"

function QuizEditor({ quiz, onSave, onCancel }: { quiz: LiveQuiz; onSave: (q: LiveQuiz) => void; onCancel: () => void }) {
  const [q, setQ] = useState(quiz)
  const setQuestion = (i: number, patch: Partial<LiveQuiz["questions"][number]>) => setQ((x) => ({ ...x, questions: x.questions.map((y, j) => (j === i ? { ...y, ...patch } : y)) }))

  function save() {
    const problem = quizProblem(q)
    if (problem) return toast.error(problem)
    onSave({ ...q, title: q.title.trim(), updatedAt: new Date().toISOString() })
  }

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-[36px] font-medium text-foreground">{quiz.title ? "Edit quiz" : "New quiz"}</h1>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">Quiz name</span>
        <input value={q.title} onChange={(e) => setQ({ ...q, title: e.target.value })} placeholder="e.g. Animals – Unit 3" className={cn(field, "h-12 text-lg font-semibold")} />
      </label>

      <ol className="mt-6 space-y-4">
        {q.questions.map((x, i) => (
          <li key={i} className="rounded-[20px] border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1F5FBF] text-sm font-bold text-white">{i + 1}</span>
              <input value={x.text} onChange={(e) => setQuestion(i, { text: e.target.value })} placeholder="Type your question" aria-label={`Question ${i + 1}`} className={cn(field, "font-semibold")} />
              <TimeSelect value={x.seconds} onChange={(seconds) => setQuestion(i, { seconds })} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove question"
                disabled={q.questions.length <= 1}
                onClick={() => setQ({ ...q, questions: q.questions.filter((_, j) => j !== i) })}
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-4" />
              </Button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {x.options.map((o, k) => (
                <div key={k} className={cn("flex items-center gap-2 rounded-[12px] p-1.5 pr-3 text-white", tiles[k].color)}>
                  <span aria-hidden className="w-7 text-center text-lg">
                    {tiles[k].shape}
                  </span>
                  <input
                    value={o}
                    onChange={(e) => setQuestion(i, { options: x.options.map((y, m) => (m === k ? e.target.value : y)) })}
                    placeholder={k < 2 ? `Answer ${k + 1}` : `Answer ${k + 1} (optional)`}
                    aria-label={`Answer ${k + 1}`}
                    className="h-10 min-w-0 flex-1 rounded-[8px] bg-white/95 px-3 text-[15px] text-[#1F1F1F] outline-none placeholder:text-[#8A8A8A]"
                  />
                  <button
                    type="button"
                    role="radio"
                    aria-checked={x.answer === k}
                    aria-label="Right answer"
                    title="Right answer"
                    onClick={() => setQuestion(i, { answer: k })}
                    className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-white text-sm font-bold outline-none", x.answer === k ? "bg-white text-[#26890C]" : "bg-transparent")}
                  >
                    {x.answer === k ? "✓" : ""}
                  </button>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {q.questions.length < 50 && (
        <Button variant="outline" className="mt-4 gap-2 rounded-[12px] dark:bg-transparent" onClick={() => setQ({ ...q, questions: [...q.questions, blankQuestion()] })}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          Add question
        </Button>
      )}
      <div className="mt-8 flex justify-end gap-2 border-t border-border pt-6">
        <Button variant="ghost" className="rounded-[12px]" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="rounded-[12px] px-6 font-bold" onClick={save}>
          Save quiz
        </Button>
      </div>
    </div>
  )
}

/** How long students get for a question – styled like the app's other dropdowns. */
const TIMES = [5, 10, 20, 30, 60, 90, 120]
const timeLabel = (s: number) => (s < 60 ? `${s} sec` : s === 60 ? "1 min" : `${s / 60} min`)

function TimeSelect({ value, onChange }: { value: number; onChange: (seconds: number) => void }) {
  const items = TIMES.map((t) => ({ value: String(t), label: timeLabel(t) }))
  return (
    <Select items={items} value={String(value)} onValueChange={(v) => v && onChange(Number(v))}>
      <SelectTrigger aria-label="Time to answer" title="Time to answer" className="h-11! w-[118px] shrink-0 gap-2 rounded-[10px] border-border bg-field px-3 text-[15px] font-semibold text-foreground">
        <HugeiconsIcon icon={Clock01Icon} className="size-4 text-link" />
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
  )
}

// =================================================================== host screen (for the class screen / projector)

function HostScreen({ pin, onClose }: { pin: string; onClose: () => void }) {
  const { state, error, update, secondsLeft } = useLiveGame(pin)
  const [busy, setBusy] = useState(false)
  useTicker(state?.phase === "question")

  // full screen for the classroom TV / projector
  const screen = useRef<HTMLDivElement>(null)
  const [full, setFull] = useState(false)
  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === screen.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : screen.current?.requestFullscreen())?.catch(() => {})

  async function go(action: (pin: string) => Promise<LiveState>) {
    setBusy(true)
    try {
      update(await action(pin))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const s = state
  const last = s ? s.index + 1 >= s.total : false
  const nextLabel = !s ? "" : s.phase === "lobby" ? "Start ▶" : s.phase === "question" ? "Skip ⏭" : s.phase === "reveal" ? "Leaderboard →" : s.phase === "board" ? (last ? "Show winners 🏆" : "Next question →") : ""

  return (
    <div
      ref={screen}
      className={cn("@container flex flex-col overflow-y-auto sky-panel p-6 text-white sm:p-10", full ? "h-screen w-screen" : "-mx-2 min-h-[calc(100svh-140px)] rounded-[28px]")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xl font-semibold opacity-90 sm:text-2xl">
          {s?.title} {s && s.phase !== "lobby" && s.phase !== "end" && <span className="opacity-70">· {Math.min(s.index + 1, s.total)} / {s.total}</span>}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" className="rounded-[10px] text-white hover:bg-white/15 hover:text-white" onClick={toggleFull}>
            {full ? "⤡ Exit full screen" : "⛶ Full screen"}
          </Button>
          {s && s.phase !== "end" && (
            <Button variant="ghost" className="rounded-[10px] text-white hover:bg-white/15 hover:text-white" disabled={busy} onClick={() => go(endGame)}>
              End game
            </Button>
          )}
          <Button variant="ghost" className="rounded-[10px] text-white hover:bg-white/15 hover:text-white" onClick={onClose}>
            ✕ Close
          </Button>
        </div>
      </div>

      {error && !s && <p className="mt-10 text-center text-xl">{error}</p>}

      {s?.phase === "lobby" && (
        <div className="mt-8 text-center">
          <p className="text-xl opacity-90">Students: open LittleReaderLab → Lecture questions and enter the code</p>
          <p className="mx-auto mt-4 w-fit rounded-[24px] bg-white px-10 py-4 font-mono text-7xl font-bold tracking-[0.2em] text-[#173A6B] shadow-[0_8px_0_rgba(0,0,0,0.25)]">{s.pin}</p>
          <p className="mt-10 text-4xl font-bold">
            {s.players} {s.players === 1 ? "player" : "players"} joined
          </p>
          <div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-center gap-4">
            {(s.names ?? []).map((n) => (
              <span key={n} className="flex min-h-20 min-w-48 animate-kid-pop items-center justify-center rounded-[20px] bg-white/20 px-8 py-4 text-4xl font-bold shadow-[0_6px_0_rgba(0,0,0,0.15)]">
                {n}
              </span>
            ))}
            {s.players === 0 && <span className="animate-pulse text-2xl opacity-70">Waiting for players…</span>}
          </div>
        </div>
      )}

      {s?.question && (s.phase === "question" || s.phase === "reveal") && (
        <div className="mt-6 flex flex-1 flex-col">
          {/* big enough to read from the back of the classroom */}
          <p className="flex min-h-[clamp(7rem,20vh,14rem)] items-center justify-center rounded-[24px] bg-white px-8 py-6 text-center text-4xl leading-tight font-bold text-[#1F1F1F] shadow-[0_8px_0_rgba(0,0,0,0.18)] sm:text-5xl @min-[1100px]:text-6xl">
            {s.question.text}
          </p>
          <div className="mt-6 flex items-center justify-between gap-4">
            {s.phase === "question" ? (
              <span className="flex size-28 shrink-0 items-center justify-center rounded-full bg-white text-6xl font-bold text-[#1F5FBF] tabular-nums shadow-[0_6px_0_rgba(0,0,0,0.18)]">{secondsLeft()}</span>
            ) : (
              <span />
            )}
            <span className="shrink-0 text-center">
              <span className="block text-6xl font-bold tabular-nums">{s.answered ?? 0}</span>
              <span className="text-lg opacity-85">of {s.players} answered</span>
            </span>
          </div>
          <div className="mt-6 grid flex-1 auto-rows-fr gap-5 sm:grid-cols-2">
            {s.question.options.map((o, k) => {
              const right = s.phase === "reveal" && k === s.correct
              const dim = s.phase === "reveal" && k !== s.correct
              const count = s.counts?.[k] ?? 0
              return (
                <div
                  key={k}
                  className={cn(
                    "relative flex min-h-[clamp(8rem,20vh,16rem)] items-center gap-6 overflow-hidden rounded-[22px] px-7 py-6 text-4xl leading-tight font-bold transition-opacity @min-[1100px]:text-5xl",
                    tiles[k].color,
                    tiles[k].shadow,
                    dim && "opacity-35"
                  )}
                >
                  <span aria-hidden className="text-6xl @min-[1100px]:text-7xl">
                    {tiles[k].shape}
                  </span>
                  <span className="flex-1 break-words">{o}</span>
                  {s.phase === "reveal" && (
                    <span className="flex items-center gap-2 rounded-full bg-black/20 px-5 py-2 text-4xl tabular-nums">
                      {right && "✓"} {count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {s?.phase === "board" && <Board rows={s.leaderboard ?? []} title="Leaderboard" />}

      {s?.phase === "end" && <Podium rows={s.leaderboard ?? []} />}

      {s && nextLabel && (
        <div className="mt-8 flex justify-end">
          <Button className="h-16 rounded-[16px] bg-white px-10 text-xl font-bold text-[#1F5FBF] hover:bg-white/90" disabled={busy} onClick={() => go(nextStep)}>
            {nextLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

function Board({ rows, title }: { rows: NonNullable<LiveState["leaderboard"]>; title: string }) {
  return (
    <div className="mx-auto mt-8 w-full max-w-4xl">
      <p className="text-center text-5xl font-bold">{title}</p>
      <ol className="mt-6 space-y-3">
        {rows.slice(0, 5).map((r, i) => (
          <li key={r.id} className="flex animate-kid-pop items-center gap-5 rounded-[18px] bg-white px-6 py-5 text-[#1F1F1F]" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="w-10 text-4xl font-bold text-[#1F5FBF]">{i + 1}</span>
            <span className="flex-1 truncate text-3xl font-bold">{r.name}</span>
            {r.lastPoints > 0 && <span className="text-xl font-semibold text-[#26890C]">+{r.lastPoints}</span>}
            <span className="text-4xl font-bold tabular-nums">{r.score}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-center text-lg opacity-80">Nobody joined this game.</li>}
      </ol>
    </div>
  )
}

function Podium({ rows }: { rows: NonNullable<LiveState["leaderboard"]> }) {
  const order = [1, 0, 2] // 2nd, 1st, 3rd
  const height = ["h-[clamp(12rem,30vh,20rem)]", "h-[clamp(9rem,22vh,15rem)]", "h-[clamp(7rem,16vh,11rem)]"]
  const color = ["bg-[#F2B400]", "bg-[#AEB6C2]", "bg-[#C0703A]"]
  const ring = ["ring-[#FFC933]", "ring-[#E2E8F0]", "ring-[#E6A06A]"]
  const medal = ["🥇", "🥈", "🥉"]
  return (
    <div className="mt-4 flex flex-1 flex-col text-center">
      <p className="text-5xl font-bold @min-[1100px]:text-6xl">🏆 Winners</p>
      <div className="mx-auto mt-auto grid w-full max-w-5xl grid-cols-3 items-end gap-4 pt-10">
        {order.map((pos) => {
          const r = rows[pos]
          return (
            <div key={pos} className="flex min-w-0 flex-col items-center">
              {r ? (
                <div className="mb-4 flex w-full animate-kid-pop flex-col items-center" style={{ animationDelay: `${(2 - pos) * 250}ms` }}>
                  <span className={cn("relative", pos === 0 && "mt-14")}>
                    <WinnerPhoto id={r.id} name={r.name} className={cn("ring-8", ring[pos], pos === 0 ? "size-44 text-8xl" : "size-28 text-6xl @min-[1100px]:size-32")} />
                    {pos === 0 && <Crown className="absolute -top-[58px] left-1/2 w-28 -translate-x-1/2 -rotate-6 drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)]" />}
                    <span aria-hidden className={cn("absolute -right-1 -bottom-1 flex items-center justify-center rounded-full bg-white shadow-md", pos === 0 ? "size-14 text-4xl" : "size-11 text-3xl")}>
                      {medal[pos]}
                    </span>
                  </span>
                  <p className={cn("mt-4 w-full truncate font-bold", pos === 0 ? "text-5xl" : "text-3xl @min-[1100px]:text-4xl")}>{r.name}</p>
                  <p className="mt-1 text-2xl font-semibold opacity-90 tabular-nums">{r.score} points</p>
                </div>
              ) : (
                <p className="mb-4 text-3xl opacity-40">—</p>
              )}
              <div className={cn("flex w-full items-start justify-center rounded-t-[22px] pt-4 text-8xl font-bold shadow-[inset_0_-10px_0_rgba(0,0,0,0.12)]", height[pos], color[pos])}>{pos + 1}</div>
            </div>
          )
        })}
      </div>
      {rows.length > 3 && (
        <ol start={4} className="mx-auto mt-6 w-full max-w-2xl space-y-2 text-left text-2xl">
          {rows.slice(3, 10).map((r, i) => (
            <li key={r.id} className="flex items-center gap-4 rounded-[14px] bg-white/12 px-5 py-3">
              <span className="w-8 font-bold opacity-80">{i + 4}</span>
              <WinnerPhoto id={r.id} name={r.name} className="size-11 text-base" />
              <span className="flex-1 truncate font-semibold">{r.name}</span>
              <span className="font-bold tabular-nums">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// players without a photo get a friendly animal – always the same one for the same student
const animals = [
  { emoji: "🦁", bg: "from-[#FFE08A] to-[#FFB347]" },
  { emoji: "🐼", bg: "from-[#E0F2FE] to-[#93C5FD]" },
  { emoji: "🦊", bg: "from-[#FFE4CC] to-[#FF9F68]" },
  { emoji: "🐸", bg: "from-[#DCFCE7] to-[#86EFAC]" },
  { emoji: "🐨", bg: "from-[#F1F5F9] to-[#CBD5E1]" },
  { emoji: "🐯", bg: "from-[#FFEDD5] to-[#FDBA74]" },
  { emoji: "🐰", bg: "from-[#FCE7F3] to-[#F9A8D4]" },
  { emoji: "🐧", bg: "from-[#E0E7FF] to-[#A5B4FC]" },
  { emoji: "🐻", bg: "from-[#FDE68A] to-[#D6A15E]" },
  { emoji: "🦄", bg: "from-[#F3E8FF] to-[#D8B4FE]" },
]
const animalFor = (id: string) => animals[[...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % animals.length]

/** A player's profile photo, or their own animal on a bright circle. */
function WinnerPhoto({ id, name, className }: { id: string; name: string; className?: string }) {
  const photo = useAvatar(id)
  const animal = animalFor(id)
  return (
    <span
      role="img"
      aria-label={name}
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br shadow-[0_10px_24px_rgba(0,0,0,0.28)]", animal.bg, className)}
    >
      {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <span className="leading-none">{animal.emoji}</span>}
    </span>
  )
}

/** A gold crown with gems for the winner. */
function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" aria-hidden className={className}>
      <defs>
        <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE27A" />
          <stop offset="1" stopColor="#F2A900" />
        </linearGradient>
      </defs>
      <path d="M10 64 L6 18 L34 42 L60 8 L86 42 L114 18 L110 64 Z" fill="url(#crown-gold)" stroke="#C98500" strokeWidth="3" strokeLinejoin="round" />
      <rect x="8" y="60" width="104" height="14" rx="5" fill="#F2A900" stroke="#C98500" strokeWidth="3" />
      <circle cx="6" cy="16" r="6" fill="#FFE27A" stroke="#C98500" strokeWidth="2.5" />
      <circle cx="60" cy="7" r="7" fill="#FFE27A" stroke="#C98500" strokeWidth="2.5" />
      <circle cx="114" cy="16" r="6" fill="#FFE27A" stroke="#C98500" strokeWidth="2.5" />
      <circle cx="34" cy="67" r="4.5" fill="#E5484D" />
      <circle cx="60" cy="67" r="5" fill="#2F7BDD" />
      <circle cx="86" cy="67" r="4.5" fill="#1F9D6B" />
      <path d="M52 40 L60 30 L68 40 L60 50 Z" fill="#E5484D" stroke="#B42318" strokeWidth="2" />
      <path d="M20 30 L24 52" stroke="#FFF6D0" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}
