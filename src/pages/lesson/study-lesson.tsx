import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  FloppyDiskIcon,
  LinkSquare02Icon,
  News01Icon,
  PodcastIcon,
  Target02Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { MAX_SCORE, scoreInfo } from "@/data/library-results"
import { guideFor } from "@/data/lesson-guides"
import { quizFor, type QuizQuestion } from "@/data/lesson-quizzes"
import type { Resource } from "@/data/resources"
import { useAuth } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { cn } from "@/lib/utils"

// Points (out of 100): Prepare 15 · Explore 10 · Check 50 · Communicate 25
const QUICK_RIGHT = 15
const QUICK_WRONG = 5
const EXPLORE_POINTS = 10
const NOTE_WORDS = 10
const RESPONSE_WORDS = 40

type Saved = {
  step: number
  quick: number | null
  notes: string
  questions: QuizQuestion[]
  answers: (number | null)[]
  response: string
}

const steps = [
  { title: "Prepare", sub: "Set your purpose" },
  { title: "Explore", sub: "Use the authentic source" },
  { title: "Check", sub: "Capture evidence" },
  { title: "Communicate", sub: "Create your response" },
]

const formatIcon: Record<Resource["format"], IconSvgElement> = { Video: Video01Icon, Article: News01Icon, Podcast: PodcastIcon }
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

/** "focused on X." → X, used for the learning purpose. */
function focusOf(r: Resource) {
  const m = r.description.match(/focused on (.+?)\.?$/)
  return m ? m[1] : "the main message and the evidence behind it"
}

function quickCheck(r: Resource) {
  const focus = focusOf(r)
  const verb = r.format === "Video" ? "watch" : r.format === "Podcast" ? "listen to" : "read"
  const right = focus[0].toUpperCase() + focus.slice(1)
  const wrong = [
    "Collect isolated words without connecting them to the source message",
    "Focus only on colours, layout or background details",
    "Try to memorise every sentence without checking the speaker’s purpose",
  ]
  // put the right answer in a different (but stable) place for each lesson
  const at = [...r.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 4
  const choices = [...wrong.slice(0, at), right, ...wrong.slice(at)]
  return { q: `Before you ${verb} “${r.title}”, which focus will produce the strongest evidence?`, choices, answer: at }
}

/** Study lesson for ages 13+: Prepare → Explore → Check → Communicate, scored out of 100. */
export function StudyLesson({ resource: r, onFinish }: { resource: Resource; onFinish: (score: number, points: number) => void }) {
  const { email } = useAuth()
  const guide = guideFor(r)
  const saveKey = kidsKey(email, `lesson.${r.id}`)
  const fresh = (): Saved => ({ step: 0, quick: null, notes: "", questions: quizFor(r), answers: Array(5).fill(null), response: "" })
  const [s, setS] = useState<Saved>(() => {
    try {
      const saved = localStorage.getItem(saveKey)
      return saved ? (JSON.parse(saved) as Saved) : fresh()
    } catch {
      return fresh()
    }
  })
  const [done, setDone] = useState(false)
  const update = (patch: Partial<Saved>) => setS((prev) => ({ ...prev, ...patch }))

  const quick = quickCheck(r)
  const noteWords = countWords(s.notes)
  const responseWords = countWords(s.response)
  const usedWords = guide.words.filter((w) => s.response.toLowerCase().includes(w.word.toLowerCase()))
  const quizRight = s.answers.filter((a, i) => a !== null && a === s.questions[i].answer).length

  const points = {
    prepare: s.quick === null ? 0 : s.quick === quick.answer ? QUICK_RIGHT : QUICK_WRONG,
    explore: noteWords >= NOTE_WORDS ? EXPLORE_POINTS : 0,
    check: quizRight * 10,
    communicate: Math.round(Math.min(1, responseWords / RESPONSE_WORDS) * 15) + Math.min(2, usedWords.length) * 5,
  }
  const total = points.prepare + points.explore + points.check + points.communicate
  const tasksDone = (s.quick !== null ? 1 : 0) + (noteWords >= NOTE_WORDS ? 1 : 0) + s.answers.filter((a) => a !== null).length + (responseWords >= 20 ? 1 : 0)
  const progress = done ? 100 : Math.round((tasksDone / 8) * 100)
  const canNext = [s.quick !== null, noteWords >= NOTE_WORDS, s.answers.every((a) => a !== null), responseWords >= 20][s.step]

  function save() {
    try {
      localStorage.setItem(saveKey, JSON.stringify(s))
      toast.success("Progress saved — you can continue later")
    } catch {
      toast("Couldn’t save on this device")
    }
  }

  function finish() {
    onFinish(quizRight, total)
    try {
      localStorage.removeItem(saveKey)
    } catch {
      // ignore
    }
    setDone(true)
  }

  function restart() {
    setS(fresh())
    setDone(false)
  }

  return (
    <div className="grid items-start gap-6 @min-[1100px]:grid-cols-[360px_1fr]">
      {/* ---------------------------------------------------- side panel */}
      <aside className="rounded-[28px] sidebar-glass p-7 text-white @min-[1100px]:sticky @min-[1100px]:top-0">
        <p className="flex items-center gap-2 text-sm font-bold tracking-[0.14em] text-white/85 uppercase">
          <HugeiconsIcon icon={formatIcon[r.format]} className="size-5" />
          {r.format} · {r.source} · {r.speaker}
        </p>
        <h1 className="mt-5 font-serif text-[34px] leading-[1.15]">{r.title}</h1>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="rounded-[10px] border border-white/15 bg-white/8 px-3 py-2">{r.level}</span>
          <span className="rounded-[10px] border border-white/15 bg-white/8 px-3 py-2">{r.ageGroup}</span>
          <span className="flex items-center gap-1.5 rounded-[10px] border border-white/15 bg-white/8 px-3 py-2">
            <HugeiconsIcon icon={Clock01Icon} className="size-4" />
            30 min
          </span>
        </div>

        <div className="mt-7 flex items-center justify-between text-[15px] font-semibold">
          <span>Lesson progress</span>
          <span className="text-lime">{progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>

        <ol className="mt-6 space-y-2">
          {steps.map((st, i) => {
            const active = !done && s.step === i
            const complete = done || s.step > i
            return (
              <li key={st.title}>
                <button
                  type="button"
                  disabled={!complete && !active}
                  onClick={() => !done && update({ step: i })}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-[16px] px-4 py-3 text-left transition-colors",
                    active ? "bg-white text-[#173F33]" : "text-white hover:bg-white/6 disabled:hover:bg-transparent"
                  )}
                >
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold", active ? "border-transparent bg-lime text-green-900" : complete ? "border-transparent bg-lime/90 text-green-900" : "border-white/25")}>
                    {complete && !active ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" /> : i + 1}
                  </span>
                  <span>
                    <span className="block text-[17px] font-semibold">{st.title}</span>
                    <span className={cn("text-sm", active ? "text-[#173F33]/70" : "text-white/65")}>{st.sub}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-6 rounded-[20px] bg-black/20 p-5">
          <p className="text-sm font-bold tracking-[0.14em] text-white/80">LIVE SCORE</p>
          <p className="mt-2 font-serif text-5xl leading-none font-bold">
            {total}
            <span className="text-lg font-normal text-white/70">/100</span>
          </p>
          <p className="mt-2 text-sm text-white/70">Built from completed evidence, language and communication tasks.</p>
        </div>
      </aside>

      {/* ---------------------------------------------------- step content */}
      <section className="@container min-w-0">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-muted-foreground">{done ? "FINISHED" : `STEP ${s.step + 1} OF 4`}</p>
            <h2 className="font-serif text-[30px] leading-tight text-foreground">{done ? "Your result" : steps[s.step].title}</h2>
          </div>
          {!done && (
            <Button variant="outline" className="h-12 gap-2 rounded-[14px] px-5 text-[15px] font-bold dark:bg-transparent" onClick={save}>
              <HugeiconsIcon icon={FloppyDiskIcon} className="size-5" />
              Save progress
            </Button>
          )}
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 sm:p-9">
          {done ? (
            <Result total={total} quizRight={quizRight} onRestart={restart} />
          ) : s.step === 0 ? (
            <>
              <Purpose title="Know what to look for before you begin." text="Authentic sources become easier when you read, watch or listen with a clear purpose." />
              <div className="mt-8 grid gap-4 @min-[640px]:grid-cols-3">
                {[
                  `Understand ${focusOf(r)}.`,
                  `Use ${guide.words.map((w) => w.word).join(", ")} accurately in context.`,
                  `Complete a meaningful response based only on “${r.title}”.`,
                ].map((g, i) => (
                  <div key={i} className="rounded-[18px] border border-border bg-muted/40 p-5">
                    <p className="text-sm font-bold text-primary dark:text-link">0{i + 1}</p>
                    <p className="mt-3 text-[16px] leading-relaxed text-foreground">{g}</p>
                  </div>
                ))}
              </div>
              <Question
                label={`QUICK CHECK · ${QUICK_RIGHT} POINTS`}
                q={quick}
                picked={s.quick}
                onPick={(i) => update({ quick: i })}
                feedback={s.quick === null ? null : s.quick === quick.answer ? "right" : "This may help a little, but the evidence-focused option will build stronger comprehension."}
              />
            </>
          ) : s.step === 1 ? (
            <>
              <Purpose title={`${r.format === "Video" ? "Watch" : r.format === "Podcast" ? "Listen to" : "Read"} the source with your purpose in mind.`} text="Use the key ideas as a map, and write down the evidence you notice." />
              {r.source === "TED" && (
                <Button className="mt-6 h-12 gap-2 rounded-[14px] px-5 text-base font-bold" render={<a href={`https://www.ted.com/search?q=${encodeURIComponent(r.title)}`} target="_blank" rel="noreferrer" />} nativeButton={false}>
                  <HugeiconsIcon icon={LinkSquare02Icon} className="size-5" />
                  Open the talk on TED
                </Button>
              )}
              <h3 className="mt-8 text-sm font-bold tracking-[0.14em] text-muted-foreground">KEY IDEAS</h3>
              <ol className="mt-3 space-y-3">
                {guide.ideas.map((idea, i) => (
                  <li key={i} className="flex gap-4 rounded-[16px] bg-muted/40 p-4 text-[16px] leading-relaxed text-foreground">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary dark:text-link">{i + 1}</span>
                    {idea}
                  </li>
                ))}
              </ol>
              <h3 className="mt-8 text-sm font-bold tracking-[0.14em] text-muted-foreground">KEY LANGUAGE</h3>
              <div className="mt-3 grid gap-3 @min-[640px]:grid-cols-3">
                {guide.words.map((w) => (
                  <div key={w.word} className="rounded-[16px] border border-border p-4">
                    <p className="font-semibold text-foreground">
                      {w.emoji} {w.word}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{w.meaning}</p>
                  </div>
                ))}
              </div>
              <label className="mt-8 block">
                <span className="text-sm font-bold tracking-[0.14em] text-muted-foreground">YOUR EVIDENCE · {EXPLORE_POINTS} POINTS</span>
                <textarea
                  value={s.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                  rows={4}
                  placeholder="Write two things you noticed in the source…"
                  className="mt-3 w-full resize-y rounded-[16px] border border-border bg-field p-4 text-[16px] text-foreground outline-none focus-visible:border-link"
                />
              </label>
              <p className={cn("mt-2 text-sm", noteWords >= NOTE_WORDS ? "text-primary dark:text-link" : "text-muted-foreground")}>
                {noteWords}/{NOTE_WORDS} words {noteWords >= NOTE_WORDS && "✓"}
              </p>
            </>
          ) : s.step === 2 ? (
            <>
              <Purpose title="Check what you understood." text="Five questions about the source — 10 points each." />
              {s.questions.map((q, i) => (
                <Question
                  key={i}
                  label={`QUESTION ${i + 1} · 10 POINTS`}
                  q={q}
                  picked={s.answers[i]}
                  onPick={(c) => update({ answers: s.answers.map((a, j) => (j === i ? c : a)) })}
                  feedback={s.answers[i] === null ? null : s.answers[i] === q.answer ? "right" : `The answer is: ${q.choices[q.answer]}`}
                />
              ))}
            </>
          ) : (
            <>
              <Purpose title="Communicate your ideas." text={`Write at least ${RESPONSE_WORDS} words and use two of the key words.`} />
              <p className="mt-6 rounded-[18px] bg-muted/40 p-5 text-lg leading-relaxed font-medium text-foreground">{guide.prompt}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {guide.words.map((w) => {
                  const used = usedWords.includes(w)
                  return (
                    <span key={w.word} className={cn("rounded-full border px-3 py-1 text-sm font-semibold", used ? "border-primary/40 bg-primary/10 text-primary dark:text-link" : "border-border text-muted-foreground")}>
                      {used ? "✓ " : ""}
                      {w.word}
                    </span>
                  )
                })}
              </div>
              <textarea
                value={s.response}
                onChange={(e) => update({ response: e.target.value })}
                rows={8}
                placeholder="Write your response here…"
                className="mt-4 w-full resize-y rounded-[16px] border border-border bg-field p-4 text-[16px] leading-relaxed text-foreground outline-none focus-visible:border-link"
              />
              <p className={cn("mt-2 text-sm", responseWords >= RESPONSE_WORDS ? "text-primary dark:text-link" : "text-muted-foreground")}>
                {responseWords}/{RESPONSE_WORDS} words · {Math.min(2, usedWords.length)}/2 key words · {points.communicate}/25 points
              </p>
            </>
          )}

          {!done && (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
              <Button variant="ghost" className="h-12 gap-2 rounded-[14px] px-4 font-bold" disabled={s.step === 0} onClick={() => update({ step: s.step - 1 })}>
                <HugeiconsIcon icon={ArrowLeft02Icon} className="size-5" />
                Back
              </Button>
              <Button className="h-12 gap-2 rounded-[14px] px-6 text-base font-bold" disabled={!canNext} onClick={() => (s.step < 3 ? update({ step: s.step + 1 }) : finish())}>
                {s.step < 3 ? `Continue to ${steps[s.step + 1].title}` : "Finish lesson"}
                <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Purpose({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-5 border-b border-border pb-7">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-[16px] bg-lime/60 text-green-900">
        <HugeiconsIcon icon={Target02Icon} className="size-7" />
      </span>
      <div>
        <p className="text-sm font-bold tracking-[0.14em] text-muted-foreground">LEARNING PURPOSE</p>
        <p className="mt-1 font-serif text-[28px] leading-tight text-foreground @min-[700px]:text-[34px]">{title}</p>
        <p className="mt-2 text-[16px] text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

function Question({
  label,
  q,
  picked,
  onPick,
  feedback,
}: {
  label: string
  q: { q: string; choices: string[]; answer: number }
  picked: number | null
  onPick: (i: number) => void
  feedback: "right" | string | null
}) {
  return (
    <div className="mt-8 rounded-[22px] border border-border p-6">
      <p className="text-sm font-bold tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-[24px] leading-snug font-semibold text-foreground">{q.q}</p>
      <div className="mt-5 space-y-3">
        {q.choices.map((c, i) => {
          const chosen = picked === i
          const right = picked !== null && i === q.answer
          return (
            <button
              key={c}
              type="button"
              disabled={picked !== null}
              onClick={() => onPick(i)}
              className={cn(
                "flex w-full items-center gap-4 rounded-[16px] border px-5 py-4 text-left text-[16px] font-semibold text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                picked === null && "border-border hover:border-link hover:bg-link/5",
                right && "border-primary/50 bg-primary/8",
                chosen && !right && "border-amber-400/60 bg-amber-400/10",
                picked !== null && !right && !chosen && "border-border opacity-60"
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-sm font-bold">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{c}</span>
              {right && <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-primary dark:text-link" />}
            </button>
          )
        })}
      </div>
      {feedback && (
        <p className={cn("mt-4 rounded-[14px] px-4 py-3 text-[15px]", feedback === "right" ? "bg-primary/10 text-primary dark:text-link" : "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200")}>
          {feedback === "right" ? "✓ Correct — that’s the strongest choice." : feedback}
        </p>
      )}
    </div>
  )
}

function Result({ total, quizRight, onRestart }: { total: number; quizRight: number; onRestart: () => void }): ReactNode {
  const info = scoreInfo(quizRight)
  return (
    <div className="py-6 text-center">
      <p className="text-7xl" aria-hidden>
        {info.emoji}
      </p>
      <p className="mt-4 font-serif text-6xl font-bold text-foreground">
        {total}
        <span className="text-2xl font-normal text-muted-foreground">/100</span>
      </p>
      <p className="mt-2 text-lg text-foreground">
        Quiz: {quizRight}/{MAX_SCORE} · {info.label}
      </p>
      <p className="mt-2 text-muted-foreground">Your teacher can see this result in their Student’s library.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="outline" className="h-12 rounded-[14px] px-6 text-base font-bold dark:bg-transparent" onClick={onRestart}>
          Try again
        </Button>
        <Button className="h-12 gap-2 rounded-[14px] px-6 text-base font-bold" render={<Link to="/discover" />} nativeButton={false}>
          More lessons
          <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
        </Button>
      </div>
    </div>
  )
}
