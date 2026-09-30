import { useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, ArrowRight02Icon, LockIcon, Search01Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { helpers, helperStars, type CluePic, type Helper, type Puzzle } from "@/data/helpers"
import { kidsGames, shuffle } from "@/data/kids-games"
import { useAuth, useKids } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { cn } from "@/lib/utils"
import { GameShell, KidButton } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "helpers")!

type Progress = Record<number, number> // helper id → best stars

function readProgress(email: string | null): Progress {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(email, "helpers")) ?? "{}")
  } catch {
    return {}
  }
}

export default function TownHelpersPage() {
  const { email } = useAuth()
  const { award } = useKids()
  const [progress, setProgress] = useState(() => readProgress(email))
  const [current, setCurrent] = useState<Helper | null>(null)
  const [run, setRun] = useState(0)

  function finish(h: Helper, stars: number) {
    const old = progress[h.id] ?? 0
    const next = { ...progress, [h.id]: Math.max(old, stars) }
    setProgress(next)
    try {
      localStorage.setItem(kidsKey(email, "helpers"), JSON.stringify(next))
    } catch {
      // ignore
    }
    const total = Object.values(next).reduce((a, b) => a + b, 0)
    award(game.id, Math.max(0, stars - old), Math.floor(total / helpers.length))
  }

  return (
    <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
      {current ? (
        <Job
          key={`${current.id}-${run}`}
          helper={current}
          onFinish={finish}
          onAgain={() => setRun((r) => r + 1)}
          onNext={() => {
            const next = helpers.find((h) => h.id === current.id + 1)
            if (next) setCurrent(next)
          }}
          onMap={() => setCurrent(null)}
        />
      ) : (
        <HelperPicker progress={progress} onPick={setCurrent} />
      )}
    </GameShell>
  )
}

// =================================================================== picker

function HelperPicker({ progress, onPick }: { progress: Progress; onPick: (h: Helper) => void }) {
  const open = (h: Helper) => h.id === 1 || (progress[h.id - 1] ?? 0) > 0
  return (
    <div>
      <Reveal>
        <h2 className="text-4xl font-semibold">Who needs your help today?</h2>
        <p className="mt-2 text-lg opacity-75">
          Every job is a thinking puzzle. Help one neighbour to unlock the next!
        </p>
      </Reveal>
      <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {helpers.map((h, i) => {
          const unlocked = open(h)
          const stars = progress[h.id] ?? 0
          return (
            <Reveal key={h.id} delay={(i % 4) * 80} className="flex *:flex-1">
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => onPick(h)}
                className={cn(
                  "group relative flex min-h-[440px] flex-col overflow-hidden rounded-[34px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.16)] outline-none transition-transform focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50",
                  h.tile,
                  unlocked ? "hover:-translate-y-1.5 active:translate-y-1" : "cursor-not-allowed opacity-55 grayscale-[40%]"
                )}
              >
                {/* scene + bubbles */}
                <span aria-hidden className="absolute -top-6 -right-6 text-[150px] leading-none opacity-20">
                  {h.scene}
                </span>
                <span aria-hidden className="absolute -bottom-14 -left-10 size-44 rounded-full bg-white/10" />

                <span className="relative flex items-center justify-between">
                  <span className="rounded-full bg-white/25 px-4 py-1.5 text-base font-semibold">
                    {h.id}/{helpers.length} · {h.puzzles.length} jobs
                  </span>
                  {!unlocked && (
                    <span className="flex size-11 items-center justify-center rounded-full bg-white/80 text-[#2B2140]">
                      <HugeiconsIcon icon={LockIcon} className="size-6" />
                    </span>
                  )}
                </span>

                <span
                  aria-hidden
                  className="relative my-6 self-center text-[120px] leading-none drop-shadow-[0_8px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                >
                  {h.face}
                </span>

                <span className="relative mt-auto rounded-[22px] bg-white/90 px-5 py-4 text-[#2B2140] shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                  <span className="block text-3xl leading-tight font-semibold whitespace-nowrap">{h.name}</span>
                  <span className="mt-1 block text-base font-medium opacity-75">{h.job}</span>
                  <span className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <span className="rounded-full bg-[#2B2140]/8 px-3 py-1 text-[15px] font-semibold whitespace-nowrap">
                      🧠 {h.skill}
                    </span>
                    <span className="ml-auto shrink-0 text-xl whitespace-nowrap" aria-label={`${stars} of 3 stars`}>
                      {[1, 2, 3].map((n) => (
                        <span key={n} aria-hidden className={n <= stars ? "" : "opacity-30 grayscale"}>
                          ⭐
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </button>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

// =================================================================== job

type Mood = "ask" | "oops" | "happy"

function Job({
  helper: h,
  onFinish,
  onAgain,
  onNext,
  onMap,
}: {
  helper: Helper
  onFinish: (h: Helper, stars: number) => void
  onAgain: () => void
  onNext: () => void
  onMap: () => void
}) {
  const [index, setIndex] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [speech, setSpeech] = useState<{ text: string; mood: Mood; id: number }>({ text: h.hello, mood: "ask", id: 0 })
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState(0)
  const puzzle = h.puzzles[index]

  function say(text: string, mood: Mood) {
    setSpeech((s) => ({ text, mood, id: s.id + 1 }))
  }

  function onMistake(why: string) {
    setMistakes((m) => m + 1)
    say(why, "oops")
  }

  function onSolved(explain: string) {
    say(`${explain} ${h.thanks[index % h.thanks.length]}`, "happy")
    setTimeout(() => {
      if (index + 1 >= h.puzzles.length) {
        const s = helperStars(mistakes)
        setStars(s)
        setDone(true)
        onFinish(h, s)
        say("You helped me with everything. Thank you so much! 🎉", "happy")
      } else {
        setIndex(index + 1)
        say(h.puzzles[index + 1].ask, "ask")
      }
    }, 1600)
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onMap}
          className="flex h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-[15px] font-semibold shadow-[0_3px_0_rgba(0,0,0,0.06)] outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          All helpers
        </button>
        <h2 className="text-3xl font-semibold">
          {h.face} {h.name}
        </h2>
        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold dark:bg-white/10">🧠 {h.skill}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        {/* ---------------- the helper */}
        <div className={cn("relative flex flex-col overflow-hidden rounded-[34px] bg-linear-to-br p-6 text-white shadow-[0_8px_0_rgba(0,0,0,0.12)] sm:p-8", h.tile)}>
          <span aria-hidden className="absolute -top-8 -right-8 text-[180px] leading-none opacity-15">
            {h.scene}
          </span>
          <div className="relative flex items-center gap-2" aria-label={`Job ${Math.min(index + 1, h.puzzles.length)} of ${h.puzzles.length}`}>
            {h.puzzles.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-3 flex-1 rounded-full transition-colors duration-500",
                  i < index || done ? "bg-white" : i === index ? "bg-white/60" : "bg-white/25"
                )}
              />
            ))}
          </div>
          <span
            key={speech.id}
            aria-hidden
            className={cn(
              "relative mt-8 self-center text-[130px] leading-none drop-shadow-[0_8px_0_rgba(0,0,0,0.15)]",
              speech.mood === "oops" ? "animate-kid-shake" : "animate-kid-pop"
            )}
          >
            {h.face}
          </span>
          <div
            key={`b-${speech.id}`}
            role="status"
            aria-live="polite"
            className={cn(
              "relative mt-6 animate-bubble-in rounded-[24px] rounded-tl-md px-5 py-4 text-xl leading-snug font-semibold shadow-[0_6px_0_rgba(0,0,0,0.08)]",
              speech.mood === "oops" ? "bg-[#FFF1D6] text-[#8B5A2B]" : speech.mood === "happy" ? "bg-[#DDF7EF] text-[#16664A]" : "bg-white text-[#2B2140]"
            )}
          >
            {speech.mood === "oops" && "🤔 "}
            {speech.text}
          </div>
          <p className="relative mt-auto pt-6 text-sm font-medium opacity-85">
            {h.job} · {mistakes === 0 ? "No mistakes yet ✨" : `${mistakes} oops so far`}
          </p>
        </div>

        {/* ---------------- the puzzle */}
        <div className="rounded-[34px] bg-white p-6 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-8 dark:bg-white/5">
          {done ? (
            <div className="flex h-full animate-kid-pop flex-col items-center justify-center text-center">
              <p className="text-6xl" aria-hidden>
                🏅
              </p>
              <p className="mt-3 text-4xl font-semibold">Great helping!</p>
              <p className="mt-2 text-lg opacity-75">
                {mistakes === 0 ? "Every puzzle right the first time!" : `You solved every job with ${mistakes} oops.`}
              </p>
              <div className="mt-4 flex gap-2 text-5xl" aria-label={`${stars} of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} aria-hidden className={cn("animate-kid-pop", n > stars && "opacity-25 grayscale")} style={{ animationDelay: `${n * 0.15}s` }}>
                    ⭐
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {helpers.some((x) => x.id === h.id + 1) ? (
                  <KidButton onClick={onNext} className={cn("gap-2 bg-linear-to-br text-white", helpers[h.id].tile)}>
                    Help {helpers[h.id].name} <HugeiconsIcon icon={ArrowRight02Icon} className="size-6" />
                  </KidButton>
                ) : (
                  <p className="text-xl font-semibold">👑 You helped the whole town!</p>
                )}
                <KidButton onClick={onAgain} className="bg-[#F1ECFF] text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white">
                  Play again
                </KidButton>
              </div>
            </div>
          ) : (
            <PuzzleView key={index} puzzle={puzzle} onMistake={onMistake} onSolved={onSolved} />
          )}
        </div>
      </div>
    </div>
  )
}

// =================================================================== puzzles

type PuzzleProps = { onMistake: (why: string) => void; onSolved: (explain: string) => void }

function PuzzleView({ puzzle, ...props }: { puzzle: Puzzle } & PuzzleProps) {
  return (
    <div>
      <p className="text-2xl leading-snug font-semibold">{puzzle.ask}</p>
      {puzzle.kind !== "sort" && puzzle.clues && <Clues clues={puzzle.clues} pics={puzzle.pics} />}
      <div className="mt-6">
        {puzzle.kind === "order" && <OrderPuzzle puzzle={puzzle} {...props} />}
        {puzzle.kind === "choice" && <ChoicePuzzle puzzle={puzzle} {...props} />}
        {puzzle.kind === "sort" && <SortPuzzle puzzle={puzzle} {...props} />}
      </div>
    </div>
  )
}

function Clues({ clues, pics }: { clues: string[]; pics?: (CluePic | null)[] }) {
  return (
    <ul className={cn("mt-4 rounded-[20px] bg-[#FFF6E5] p-4 dark:bg-white/5", pics ? "grid gap-3 sm:grid-cols-2" : "space-y-2")}>
      {clues.map((c, i) => (
        <li key={i} className="flex flex-col gap-3">
          <span className="flex items-start gap-3 text-lg">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#6C63FF] text-white">
              <HugeiconsIcon icon={Search01Icon} className="size-4" />
            </span>
            <span>
              <span className="font-semibold">Clue {i + 1}:</span> {c}
            </span>
          </span>
          {pics?.[i] && <ClueVisual pic={pics[i]!} />}
        </li>
      ))}
    </ul>
  )
}

/** Draws one clue so it can be seen, not just read. */
function ClueVisual({ pic }: { pic: CluePic }) {
  const box = "flex min-h-32 items-end justify-center gap-4 rounded-[16px] bg-white/80 px-4 py-3 dark:bg-white/10"
  const figure = (t: { emoji: string; label: string }, extra: ReactNode) => (
    <span className="flex flex-col items-center gap-1">
      {extra}
      <span className="text-sm font-semibold">{t.label}</span>
    </span>
  )

  if (pic.kind === "taller")
    return (
      <div className={box} aria-hidden>
        {[pic.a, pic.b].map((t, i) => (
          <span key={t.label} className="contents">
            {i === 1 && <span className="mb-8 text-2xl font-bold text-[#6C63FF]">&gt;</span>}
            {figure(
              t,
              <span className="flex flex-col items-center">
                <span className="text-3xl leading-none">{t.emoji}</span>
                <span className="w-9 rounded-t-lg bg-linear-to-t from-[#6C63FF] to-[#A99BFF]" style={{ height: `${t.v * 18}px` }} />
              </span>
            )}
          </span>
        ))}
        <span className="mb-8 text-xs font-semibold opacity-60">taller</span>
      </div>
    )

  if (pic.kind === "costs")
    return (
      <div className={box} aria-hidden>
        {[pic.a, pic.b].map((t, i) => (
          <span key={t.label} className="contents">
            {i === 1 && <span className="mb-8 text-2xl font-bold text-[#6C63FF]">&gt;</span>}
            {figure(
              t,
              <span className="flex items-end gap-1">
                <span className="text-3xl leading-none">{t.emoji}</span>
                <span className="flex flex-col-reverse leading-[0.6]">
                  {Array.from({ length: t.v }, (_, k) => (
                    <span key={k} className="text-xl">
                      🪙
                    </span>
                  ))}
                </span>
              </span>
            )}
          </span>
        ))}
        <span className="mb-8 text-xs font-semibold opacity-60">costs more</span>
      </div>
    )

  if (pic.kind === "before")
    return (
      <div className={cn(box, "items-center")} aria-hidden>
        {figure(pic.a, <span className="flex flex-col items-center"><span className="text-xs font-bold text-[#2F8F68]">1st</span><span className="text-3xl">{pic.a.emoji}</span></span>)}
        <span className="flex flex-col items-center text-[#6C63FF]">
          <span className="text-2xl font-bold">→</span>
          <span className="text-xs font-semibold opacity-70">then</span>
        </span>
        {figure(pic.b, <span className="flex flex-col items-center"><span className="text-xs font-bold text-[#2F8F68]">2nd</span><span className="text-3xl">{pic.b.emoji}</span></span>)}
      </div>
    )

  return (
    <div className={cn(box, "items-center")} aria-hidden>
      {figure(
        pic.a,
        <span className="relative text-4xl leading-none">
          <span className="opacity-60">{pic.a.emoji}</span>
          <span className="absolute inset-0 flex items-center justify-center text-4xl">❌</span>
        </span>
      )}
      <span className="text-sm font-semibold opacity-70">not here</span>
    </div>
  )
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("flex flex-col items-center gap-1 text-center", className)}>{children}</span>
}

// ------------------------------------------------------------ order

function OrderPuzzle({ puzzle, onMistake, onSolved }: { puzzle: Extract<Puzzle, { kind: "order" }> } & PuzzleProps) {
  const n = puzzle.items.length
  const [order] = useState(() => {
    let o = shuffle([...Array(n).keys()])
    while (o.every((v, i) => v === i)) o = shuffle(o) // never start already sorted
    return o
  })
  const [placed, setPlaced] = useState<number[]>([])
  const [wrong, setWrong] = useState<number | null>(null)

  function tap(i: number) {
    if (placed.includes(i) || placed.length === n) return
    if (i === placed.length) {
      const next = [...placed, i]
      setPlaced(next)
      if (next.length === n) onSolved("That’s the right order!")
    } else {
      setWrong(i)
      setTimeout(() => setWrong(null), 500)
      onMistake(puzzle.hint)
    }
  }

  return (
    <div>
      {/* numbered slots */}
      <ol className="grid gap-3" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {puzzle.items.map((_, s) => {
          const item = placed[s] !== undefined ? puzzle.items[placed[s]] : null
          return (
            <li
              key={s}
              className={cn(
                "flex min-h-32 flex-col items-center justify-center rounded-[20px] border-4 border-dashed p-2 text-center",
                item ? "animate-kid-pop border-transparent bg-[#DDF7EF] dark:bg-[#2BC0A4]/20" : "border-[#E4DDF5] dark:border-white/15"
              )}
            >
              <span className="text-sm font-bold opacity-60">{s + 1}</span>
              {item && (
                <>
                  <span className="text-4xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="text-sm leading-tight font-semibold">{item.label}</span>
                </>
              )}
            </li>
          )
        })}
      </ol>

      <p className="mt-6 mb-3 text-lg font-medium opacity-70">
        {placed.length < n ? `Tap step ${placed.length + 1}:` : "All in order! ✅"}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {order.map((i) => {
          const used = placed.includes(i)
          const item = puzzle.items[i]
          return (
            <KidButton
              key={i}
              onClick={() => tap(i)}
              disabled={used}
              state={wrong === i ? "wrong" : "idle"}
              className={cn(
                "h-auto min-h-24 justify-start gap-3 bg-[#F4EEFB] px-4 py-3 text-left text-lg text-[#2B2140] shadow-[0_5px_0_#DCCFF2] dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]",
                used && "scale-95 opacity-30 shadow-none"
              )}
            >
              <span className="text-4xl" aria-hidden>
                {item.emoji}
              </span>
              <span className="leading-tight">{item.label}</span>
            </KidButton>
          )
        })}
      </div>
    </div>
  )
}

// ------------------------------------------------------------ choice

function ChoicePuzzle({ puzzle, onMistake, onSolved }: { puzzle: Extract<Puzzle, { kind: "choice" }> } & PuzzleProps) {
  const [tried, setTried] = useState<number[]>([])
  const [solved, setSolved] = useState(false)
  const [shake, setShake] = useState<number | null>(null)

  function pick(i: number) {
    if (solved || tried.includes(i)) return
    if (i === puzzle.answer) {
      setSolved(true)
      onSolved(puzzle.explain)
    } else {
      setTried((t) => [...t, i])
      setShake(i)
      setTimeout(() => setShake(null), 500)
      onMistake(puzzle.options[i].why ?? "Not quite — read the clues again.")
    }
  }

  const answer = puzzle.options[puzzle.answer]

  return (
    <div>
      {puzzle.sequence && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-[20px] bg-[#FFF6E5] p-4 text-4xl dark:bg-white/5">
          {puzzle.sequence.map((s, i) =>
            s === "?" ? (
              <span
                key={i}
                className={cn(
                  "flex min-h-16 min-w-16 items-center justify-center rounded-2xl border-4 border-dashed px-2 font-bold",
                  solved ? "animate-kid-pop border-transparent bg-[#DDF7EF] dark:bg-[#2BC0A4]/20" : "border-[#FF8A5B] text-[#FF8A5B]"
                )}
              >
                {solved ? /^\d+$/.test(answer.label) ? answer.label : <EmojiGroup text={answer.emoji} /> : "?"}
              </span>
            ) : (
              <span key={i} className="flex min-h-16 min-w-16 items-center justify-center rounded-2xl bg-white/70 px-2 font-semibold tabular-nums shadow-sm dark:bg-white/10">
                <EmojiGroup text={s} />
              </span>
            )
          )}
        </div>
      )}

      <div className={cn("grid gap-4", puzzle.options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {puzzle.options.map((o, i) => {
          const isTried = tried.includes(i)
          const isAnswer = i === puzzle.answer
          return (
            <KidButton
              key={i}
              onClick={() => pick(i)}
              disabled={solved || isTried}
              state={solved && isAnswer ? "right" : shake === i ? "wrong" : "idle"}
              className={cn(
                "relative h-auto min-h-36 flex-col gap-2 bg-[#F4EEFB] px-3 py-4 text-[#2B2140] shadow-[0_5px_0_#DCCFF2] dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]",
                isTried && "opacity-45",
                !solved && tried.length >= 2 && isAnswer && "ring-4 ring-[#2BC0A4]"
              )}
            >
              {isTried && (
                <span aria-hidden className="absolute top-2 right-3 text-2xl text-[#E5484D]">
                  ✗
                </span>
              )}
              <Card>
                <span aria-hidden className="w-full">
                  <EmojiGroup text={o.emoji} big />
                </span>
                <span className="text-lg leading-tight">{o.label}</span>
                {o.tags && (
                  <span className="mt-1 flex flex-wrap justify-center gap-1">
                    {o.tags.map((t) => (
                      <span key={t} className="rounded-full bg-white px-2 py-0.5 text-sm font-medium dark:bg-white/15">
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </Card>
            </KidButton>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Shows an emoji string that may contain several emoji (e.g. "⭐⭐⭐⭐").
 * The more there are, the smaller they get, and they wrap instead of overflowing.
 */
function EmojiGroup({ text, big }: { text: string; big?: boolean }) {
  const parts = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].map((p) => p.segment)
  if (parts.length === 1 || /^[\d.]+$/.test(text)) return <span className={big ? "text-5xl leading-none" : undefined}>{text}</span>
  const size = big ? (parts.length <= 2 ? "text-4xl" : parts.length <= 4 ? "text-3xl" : "text-2xl") : parts.length <= 3 ? "text-3xl" : "text-2xl"
  return (
    <span className={cn("inline-flex max-w-full flex-wrap justify-center gap-0.5 leading-none", size)}>
      {parts.map((p, i) => (
        <span key={i}>{p}</span>
      ))}
    </span>
  )
}

// ------------------------------------------------------------ sort

function SortPuzzle({ puzzle, onMistake, onSolved }: { puzzle: Extract<Puzzle, { kind: "sort" }> } & PuzzleProps) {
  const [queue] = useState(() => shuffle([...puzzle.items]))
  const [i, setI] = useState(0)
  const [sorted, setSorted] = useState<string[][]>(() => puzzle.bins.map(() => []))
  const [shake, setShake] = useState(0)
  const item = queue[i]

  function drop(bin: number) {
    if (!item) return
    if (bin === item.bin) {
      setSorted((s) => s.map((list, b) => (b === bin ? [...list, item.emoji] : list)))
      if (i + 1 >= queue.length) {
        setI(i + 1)
        onSolved("Everything is sorted!")
      } else setI(i + 1)
    } else {
      setShake((x) => x + 1)
      onMistake(item.why)
    }
  }

  return (
    <div>
      <div className="flex min-h-44 flex-col items-center justify-center rounded-[24px] bg-[#FFF6E5] p-4 dark:bg-white/5">
        {item ? (
          <span key={`${i}-${shake}`} className={cn("flex flex-col items-center", shake ? "animate-kid-shake" : "animate-kid-pop")}>
            <span className="text-7xl" aria-hidden>
              {item.emoji}
            </span>
            <span className="mt-2 text-2xl font-semibold">{item.label}</span>
          </span>
        ) : (
          <span className="text-3xl font-semibold">✅ All sorted!</span>
        )}
        <span className="mt-2 text-sm opacity-60">
          {Math.min(i + 1, queue.length)} / {queue.length}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {puzzle.bins.map((b, bi) => (
          <KidButton
            key={bi}
            onClick={() => drop(bi)}
            disabled={!item}
            className="h-auto min-h-40 flex-col gap-2 bg-[#F4EEFB] px-3 py-4 text-[#2B2140] shadow-[0_5px_0_#DCCFF2] dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"
          >
            <span className="text-5xl" aria-hidden>
              {b.emoji}
            </span>
            <span className="text-xl">{b.label}</span>
            <span className="flex min-h-8 flex-wrap justify-center gap-0.5 text-2xl" aria-label={`${sorted[bi].length} items`}>
              {sorted[bi].map((e, k) => (
                <span key={k} className="animate-kid-pop">
                  {e}
                </span>
              ))}
            </span>
          </KidButton>
        ))}
      </div>
    </div>
  )
}
