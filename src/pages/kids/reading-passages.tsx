import { useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon } from "@hugeicons/core-free-icons"

import { ReadAloud } from "@/components/kids/read-aloud"
import { Reveal } from "@/components/motion/reveal"
import { kidsGames, shuffle, starsFor } from "@/data/kids-games"
import { passages, readLevels, wordCount, type Passage, type QKind, type ReadLevel } from "@/data/reading-passages"
import { useAuth, useKids } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { cn } from "@/lib/utils"
import { GameShell, KidButton, ResultScreen } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "reading")!

type Level = Exclude<ReadLevel, "kids">
/** Best result per text: passage id → { score, wpm }. */
type Best = Record<string, { score: number; wpm: number }>

const kindColor: Record<QKind, string> = {
  Detail: "bg-[#E4F1FF] text-[#1F4E8C]",
  Vocabulary: "bg-[#FFF1D6] text-[#7A4E00]",
  "Main idea": "bg-[#E6F8EF] text-[#17603F]",
  Inference: "bg-[#F1E8FF] text-[#5B2E9E]",
  Sequence: "bg-[#FFE6EC] text-[#8C1F3F]",
}

const choiceClass =
  "bg-[#F6F3FF] text-[#2B2140] shadow-[0_5px_0_#DDD5FF] dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`

/** Longer texts for Class 4 (~200 words). */
export function PassageReading({ level, header }: { level: Level; header: ReactNode }) {
  const { email } = useAuth()
  const key = kidsKey(email, `reading.${level}`)
  const [best, setBest] = useState<Best>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "{}")
    } catch {
      return {}
    }
  })
  const list = passages[level]
  // "&text=<id>" opens one text straight away
  const [params] = useSearchParams()
  const [open, setOpen] = useState<number | null>(() => {
    const i = list.findIndex((p) => p.id === params.get("text"))
    return i >= 0 ? i : null
  })
  const [session, setSession] = useState(0)
  const info = readLevels.find((l) => l.id === level)!

  function save(id: string, score: number, wpm: number) {
    const prev = best[id]
    if (prev && prev.score > score) return
    const next = { ...best, [id]: { score, wpm: prev && prev.score === score ? Math.max(prev.wpm, wpm) : wpm } }
    setBest(next)
    localStorage.setItem(key, JSON.stringify(next))
  }

  if (open !== null)
    return (
      <PassageGame
        key={`${open}-${session}`}
        passage={list[open]}
        position={`${open + 1} of ${list.length}`}
        onDone={(score, wpm) => save(list[open].id, score, wpm)}
        onNext={() => {
          setOpen((open + 1) % list.length)
          setSession((s) => s + 1)
        }}
        onExit={() => setOpen(null)}
      />
    )

  const done = list.filter((p) => best[p.id]).length
  return (
    <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
      {header}
      <Reveal>
        <h2 className="text-3xl font-semibold sm:text-4xl">
          {info.emoji} {info.name} · {info.classes}
        </h2>
        <p className="mt-2 text-lg opacity-75">
          Texts of about {info.words} words. Read carefully, then answer 5 questions. We time your reading, too! ⏱️ · {done} of {list.length} read
        </p>
      </Reveal>
      <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
        {list.map((p, i) => {
          const b = best[p.id]
          const words = wordCount(p.text)
          return (
            <Reveal key={p.id} delay={i * 60} className="flex *:flex-1">
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group flex flex-col rounded-[28px] bg-white p-5 text-left shadow-[0_6px_0_rgba(43,33,64,0.08)] outline-none transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/5"
              >
                <span className="flex items-start justify-between gap-2">
                  <span aria-hidden className={cn("flex size-16 items-center justify-center rounded-[20px] bg-linear-to-br text-4xl transition-transform group-hover:scale-110", info.tile)}>
                    {p.emoji}
                  </span>
                  {b ? (
                    <span className="rounded-full bg-[#E6F8EF] px-3 py-1 text-sm font-bold text-[#17603F]">✅ {b.score}/5</span>
                  ) : (
                    <span className="rounded-full bg-[#F1ECFF] px-3 py-1 text-sm font-semibold text-[#4B3F8F] dark:bg-white/10 dark:text-white">New</span>
                  )}
                </span>
                <span className="mt-4 text-sm font-semibold tracking-wide uppercase opacity-60">{p.topic}</span>
                <span className="mt-0.5 text-2xl leading-tight font-semibold">{p.title}</span>
                <span className="mt-auto flex flex-wrap gap-x-3 pt-4 text-sm font-medium opacity-70">
                  <span>📝 {words} words</span>
                  <span>⏱️ ~{Math.max(1, Math.round(words / 120))} min</span>
                  {b && <span>⚡ {b.wpm} wpm</span>}
                </span>
              </button>
            </Reveal>
          )
        })}
      </div>
    </GameShell>
  )
}

// ------------------------------------------------------------------ one text

function PassageGame({
  passage,
  position,
  onDone,
  onNext,
  onExit,
}: {
  passage: Passage
  position: string
  onDone: (score: number, wpm: number) => void
  onNext: () => void
  onExit: () => void
}) {
  const { award } = useKids()
  const words = wordCount(passage.text)
  const [questions] = useState(() => passage.questions.map((q) => ({ ...q, answer: q.options[0], options: shuffle([...q.options]) })))
  const [phase, setPhase] = useState<"read" | "questions" | "done">("read")
  const [startedAt] = useState(() => Date.now())
  const [seconds, setSeconds] = useState(0)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const total = questions.length
  const q = questions[index]
  const wpm = seconds > 0 ? Math.round(words / (seconds / 60)) : 0

  function finishReading() {
    setSeconds(Math.max(1, (Date.now() - startedAt) / 1000))
    setPhase("questions")
  }

  function choose(option: string) {
    if (picked) return
    const correct = option === q.answer
    setPicked(option)
    if (correct) setScore((s) => s + 1)
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1)
      setPicked(null)
      return
    }
    award(game.id, starsFor(score, total))
    onDone(score, wpm)
    setPhase("done")
  }

  const back = (
    <div className="mt-5 flex justify-center">
      <button
        type="button"
        onClick={onExit}
        className="rounded-full px-4 py-2 text-lg font-medium opacity-70 outline-none hover:opacity-100 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
      >
        ← Choose another text
      </button>
    </div>
  )

  if (phase === "done")
    return (
      <GameShell game={game} round={total} total={total} score={score}>
        <ResultScreen
          game={game}
          stars={starsFor(score, total)}
          message={`“${passage.title}”: ${score} of ${total} correct. You read ${words} words in ${clock(seconds)} — about ${wpm} words per minute.`}
          onReplay={onNext}
        />
        <p className="mt-4 text-center text-base opacity-70">“Play again” opens the next text. {speedTip(wpm)}</p>
        {back}
      </GameShell>
    )

  if (phase === "read")
    return (
      <GameShell game={game} round={0} total={total} score={0} hideProgress>
        <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="rounded-full bg-[#F1ECFF] px-3 py-1 text-[#4B3F8F] dark:bg-white/10 dark:text-white">{passage.topic}</span>
            <span className="rounded-full bg-[#FFF1D6] px-3 py-1 text-[#7A4E00]">📝 {words} words</span>
            <span className="opacity-60">Text {position} · ⏱️ the timer is running</span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            <span aria-hidden>{passage.emoji}</span> {passage.title}
          </h2>

          <div className="mt-5 rounded-[22px] bg-[#FFF8EA] p-4 dark:bg-white/5">
            <p className="text-base font-bold">📚 Words to know</p>
            <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-2">
              {passage.glossary.map((g) => (
                <div key={g.word}>
                  <dt className="inline font-semibold">{g.word}</dt> <dd className="inline opacity-75">— {g.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>

          <ReadAloud text={passage.text} size="md" className="mt-6" />

          <div className="mt-8 flex justify-center">
            <KidButton onClick={finishReading} className={cn("gap-2 bg-linear-to-br text-white", game.tile)}>
              I’ve finished reading
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-6" />
            </KidButton>
          </div>
        </div>
        {back}
      </GameShell>
    )

  return (
    <GameShell game={game} round={index} total={total} score={score}>
      <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
        <details className="rounded-[20px] bg-[#FFF8EA] px-5 py-3 dark:bg-white/5">
          <summary className="cursor-pointer text-lg font-semibold">
            {passage.emoji} Look back at “{passage.title}”
          </summary>
          <p className="mt-3 text-base leading-relaxed whitespace-pre-line">{passage.text}</p>
        </details>

        <span className={cn("mt-6 inline-block rounded-full px-3 py-1 text-sm font-bold", kindColor[q.kind])}>{q.kind}</span>
        <p className="mt-2 text-2xl leading-snug font-semibold sm:text-3xl">{q.q}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {q.options.map((o) => (
            <KidButton
              key={o}
              onClick={() => choose(o)}
              disabled={picked !== null}
              state={!picked ? "idle" : o === q.answer ? "right" : o === picked ? "wrong" : "dim"}
              className={cn("h-auto min-h-16 px-5 py-3 text-left text-lg leading-snug sm:text-xl", choiceClass)}
            >
              {o}
            </KidButton>
          ))}
        </div>

        <div className="mt-5 flex min-h-14 flex-wrap items-center justify-between gap-3" aria-live="polite">
          <p className="text-xl font-semibold">{!picked ? "" : picked === q.answer ? "🎉 Correct!" : `Not quite — the answer is “${q.answer}”.`}</p>
          {picked && (
            <KidButton onClick={next} className="h-14 gap-2 bg-[#6C63FF] px-6 text-lg text-white shadow-[0_5px_0_#4B42D6]">
              {index + 1 < total ? "Next question" : "See my result"}
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
            </KidButton>
          )}
        </div>
      </div>
    </GameShell>
  )
}

function speedTip(wpm: number) {
  if (wpm > 350) return "Wow, that was fast — make sure you really understood every part! 🚀"
  if (wpm >= 150) return "Great reading speed! 💪"
  if (wpm >= 90) return "Good, steady reading. 👍"
  return "Take your time — speed grows with practice. 🌱"
}
