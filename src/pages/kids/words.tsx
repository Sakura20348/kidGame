import { useEffect, useEffectEvent, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { kidsGames, shuffle, starsFor } from "@/data/kids-games"
import { examStory, hasPictureClue, trackForAge, wordStories, wordTracks, type WordStory, type WordTrack } from "@/data/word-stories"
import { findAccount } from "@/lib/accounts"
import { useAuth, useKids } from "@/lib/contexts"
import { cn } from "@/lib/utils"
import { GameShell, KidButton, ResultScreen } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "words")!

type Tile = { id: number; letter: string }

function mixTiles(word: string): Tile[] {
  const tiles = word.split("").map((letter, id) => ({ id, letter }))
  let mixed = shuffle(tiles)
  // make sure the letters aren't already in order
  while (mixed.map((t) => t.letter).join("") === word) mixed = shuffle(tiles)
  return mixed
}

/** A sentence with its blank: the word once solved, a line while playing, hidden otherwise. */
function Sentence({ text, word, state }: { text: string; word: string; state: "solved" | "current" }) {
  const [before, after] = text.split("___")
  return (
    <>
      {before}
      {state === "solved" ? (
        <mark className="rounded-md bg-[#2BC0A4]/20 px-1 font-semibold text-inherit">{word.toLowerCase()}</mark>
      ) : (
        <span className="mx-0.5 inline-block w-20 border-b-4 border-[#6C63FF] align-baseline" aria-label="missing word" />
      )}
      {after}
    </>
  )
}

export default function WordBuilderPage() {
  const { email } = useAuth()
  const { award } = useKids()
  const suggested = trackForAge(findAccount(email)?.ageGroup)
  const [track, setTrack] = useState<WordTrack | null>(null)
  const [story, setStory] = useState<WordStory | null>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [index, setIndex] = useState(0)
  const [slots, setSlots] = useState<number[]>([]) // tile ids in order
  const [score, setScore] = useState(0)
  const [perfect, setPerfect] = useState(true) // no mistakes/hints this round
  const [feedback, setFeedback] = useState<"idle" | "right" | "wrong">("idle")
  const [done, setDone] = useState(false)

  function start(s: WordStory) {
    setStory(s)
    setTiles(mixTiles(s.lines[0].word))
    setIndex(0)
    setSlots([])
    setScore(0)
    setPerfect(true)
    setFeedback("idle")
    setDone(false)
  }

  // ------------------------------------------------------------ game logic (used while playing)
  const TOTAL = story?.lines.length ?? 8
  const word = story?.lines[index].word ?? ""
  const tileById = (id: number) => tiles.find((t) => t.id === id)!

  function next(solvedPerfectly: boolean) {
    const nextScore = score + (solvedPerfectly ? 1 : 0)
    setScore(nextScore)
    if (index + 1 >= TOTAL) {
      award(game.id, starsFor(nextScore, TOTAL))
      setDone(true)
      return
    }
    setIndex(index + 1)
    setTiles(mixTiles(story!.lines[index + 1].word))
    setSlots([])
    setPerfect(true)
    setFeedback("idle")
  }

  function check(filled: number[], clean: boolean) {
    const guess = filled.map((id) => tileById(id).letter).join("")
    if (guess === word) {
      setFeedback("right")
      setTimeout(() => next(clean), 1100)
    } else {
      setFeedback("wrong")
      setPerfect(false)
      setTimeout(() => {
        setFeedback("idle")
        setSlots([])
      }, 900)
    }
  }

  function place(id: number) {
    if (feedback !== "idle" || slots.includes(id)) return
    const filled = [...slots, id]
    setSlots(filled)
    if (filled.length === word.length) check(filled, perfect)
  }

  function unplace(pos: number) {
    if (feedback !== "idle") return
    setSlots(slots.slice(0, pos))
  }

  /** Keeps the correct letters at the start and adds the next right one. */
  function hint() {
    if (feedback !== "idle") return
    setPerfect(false)
    let keep = 0
    while (keep < slots.length && tileById(slots[keep]).letter === word[keep]) keep++
    const kept = slots.slice(0, keep)
    const nextTile = tiles.find((t) => !kept.includes(t.id) && t.letter === word[keep])!
    const filled = [...kept, nextTile.id]
    setSlots(filled)
    if (filled.length === word.length) check(filled, false)
  }

  // type letters on the keyboard, Backspace removes the last one
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!story || done || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === "Backspace") {
      e.preventDefault()
      if (slots.length) unplace(slots.length - 1)
      return
    }
    if (/^[a-z]$/i.test(e.key)) {
      const tile = tiles.find((t) => !slots.includes(t.id) && t.letter === e.key.toUpperCase())
      if (tile) place(tile.id)
    }
  })
  useEffect(() => {
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ------------------------------------------------------------ 1) choose a level
  if (!track) {
    return (
      <GameShell game={game} round={0} total={8} score={0} wide hideProgress>
        <Reveal>
          <h2 className="text-4xl font-semibold">Choose your words</h2>
          <p className="mt-2 text-lg opacity-75">Spell the missing words and build a whole story.</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {wordTracks.map((t, i) => (
            <Reveal key={t.id} delay={i * 90} className="flex *:flex-1">
              <button
                type="button"
                onClick={() => setTrack(t.id)}
                className={cn(
                  "group relative flex min-h-[400px] flex-col overflow-hidden rounded-[34px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.16)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-1",
                  t.tile,
                  t.id === suggested && "ring-4 ring-[#FFD166]"
                )}
              >
                <span aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-white/15" />
                <span className="relative flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white/25 px-4 py-1.5 text-base font-semibold">{t.ages}</span>
                  {t.id === suggested && <span className="rounded-full bg-[#FFD166] px-3 py-1 text-sm font-bold text-[#2B2140]">⭐ For you</span>}
                </span>
                <span aria-hidden className="relative my-6 self-center text-[110px] leading-none drop-shadow-[0_8px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110">
                  {t.emoji}
                </span>
                <span className="relative mt-auto rounded-[22px] bg-white/90 px-5 py-4 text-[#2B2140] shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                  <span className="block text-3xl leading-tight font-semibold">{t.name}</span>
                  <span className="mt-1 block text-base font-medium opacity-75">{t.blurb}</span>
                  <span className="mt-3 block text-sm font-semibold opacity-70">
                    {wordStories.filter((s) => s.track === t.id).length} stories · exam: {t.exam} words
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </GameShell>
    )
  }

  const info = wordTracks.find((t) => t.id === track)!
  const trackStories = wordStories.filter((s) => s.track === track)

  // ------------------------------------------------------------ 2) choose a story
  if (!story) {
    return (
      <GameShell game={game} round={0} total={8} score={0} wide hideProgress>
        <BackTo label="All levels" onClick={() => setTrack(null)} />
        <div className="rounded-[32px] bg-white p-6 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
          <p className="text-3xl font-semibold">
            {info.emoji} {info.name}: pick a story
          </p>
          <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {trackStories.map((s) => (
              <KidButton
                key={s.id}
                onClick={() => start(s)}
                className="h-auto flex-col gap-1 bg-[#FFF1E8] py-6 text-[#2B2140] shadow-[0_6px_0_#FFD2B8] dark:bg-white/10 dark:text-white dark:shadow-[0_6px_0_rgba(255,255,255,0.08)]"
              >
                <span aria-hidden className="text-5xl">
                  {s.emoji}
                </span>
                <span className="text-xl">{s.title}</span>
              </KidButton>
            ))}
            <KidButton onClick={() => start(examStory(info.id, info.exam))} className={cn("h-auto flex-col gap-1 bg-linear-to-br py-6 text-white", info.tile)}>
              <span aria-hidden className="text-5xl">
                📝
              </span>
              <span className="text-xl">Exam</span>
              <span className="text-sm font-medium opacity-90">All stories · {info.exam} words</span>
            </KidButton>
          </div>
        </div>
      </GameShell>
    )
  }

  // ------------------------------------------------------------ 3) results: the whole story
  if (done) {
    return (
      <GameShell game={game} round={TOTAL} total={TOTAL} score={score}>
        <ResultScreen
          game={game}
          stars={starsFor(score, TOTAL)}
          message={
            story.title === "Exam"
              ? `📝 ${info.name} exam: ${score} of ${TOTAL} words with no help (${Math.round((score / TOTAL) * 100)}%).`
              : `You spelled ${score} of ${TOTAL} words with no help.`
          }
          onReplay={() => setStory(null)}
        />
        <StoryCard story={story} solved={TOTAL} />
      </GameShell>
    )
  }

  // ------------------------------------------------------------ 4) play
  const line = story.lines[index]
  const long = word.length > 8
  const box = long ? "size-11 rounded-[12px] text-2xl sm:size-13" : "size-14 rounded-[16px] text-3xl sm:size-16"

  return (
    <GameShell game={game} round={index} total={TOTAL} score={score}>
      <div className="rounded-[32px] bg-white p-6 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
        <p className="text-lg font-semibold opacity-70">
          {story.emoji} {story.title}
        </p>
        <p key={index} className="mt-4 animate-kid-pop text-2xl leading-relaxed font-medium sm:text-3xl">
          <Sentence text={line.text} word={word} state={feedback === "right" ? "solved" : "current"} />
        </p>
        {hasPictureClue(track!) ? (
          <p aria-label="Picture clue" className="mt-4 text-7xl sm:text-8xl">
            {line.hint}
          </p>
        ) : (
          <p className="mx-auto mt-4 max-w-md rounded-[18px] bg-[#F1ECFF] px-5 py-3 text-lg text-[#4B3F8F] dark:bg-white/10 dark:text-white">
            💬 <span className="font-semibold">Clue:</span> {line.hint}
          </p>
        )}

        {/* answer slots */}
        <div className={cn("mt-6 flex flex-wrap justify-center gap-2 sm:gap-3", feedback === "wrong" && "animate-kid-shake")}>
          {word.split("").map((_, pos) => {
            const id = slots[pos]
            const filled = id !== undefined
            return (
              <button
                key={pos}
                type="button"
                aria-label={filled ? `Remove letter ${tileById(id).letter}` : `Empty box ${pos + 1}`}
                disabled={!filled}
                onClick={() => unplace(pos)}
                className={cn(
                  "flex items-center justify-center border-4 border-dashed font-semibold outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40",
                  box,
                  filled ? "border-transparent bg-[#6C63FF] text-white shadow-[0_5px_0_#4B42D6]" : "border-[#D6CCFF] dark:border-white/20",
                  feedback === "right" && "animate-kid-pop bg-[#2BC0A4] shadow-[0_5px_0_#1F9D6B]",
                  feedback === "wrong" && filled && "bg-[#FF5E7E] shadow-[0_5px_0_#D93A5C]"
                )}
              >
                {filled ? tileById(id).letter : ""}
              </button>
            )
          })}
        </div>
        <p className="mt-3 h-7 text-lg font-medium" aria-live="polite">
          {feedback === "right" ? "🎉 You got it!" : feedback === "wrong" ? "Oops! Try again." : slots.length === 0 ? <span className="text-base opacity-60">⌨️ Type the letters or tap them</span> : ""}
        </p>

        {/* letter tiles */}
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
          {tiles.map((t) => {
            const used = slots.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                disabled={used || feedback !== "idle"}
                onClick={() => place(t.id)}
                aria-label={`Letter ${t.letter}`}
                className={cn(
                  "flex items-center justify-center bg-[#FFD166] font-semibold text-[#2B2140] shadow-[0_5px_0_#E0A800] outline-none transition-[transform,opacity] focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 active:translate-y-1 active:shadow-[0_1px_0_#E0A800]",
                  box,
                  used && "scale-90 opacity-25 shadow-none"
                )}
              >
                {t.letter}
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <KidButton
            onClick={hint}
            disabled={feedback !== "idle"}
            className="h-14 bg-[#F1ECFF] px-6 text-lg text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"
          >
            💡 Hint
          </KidButton>
          <KidButton onClick={() => next(false)} disabled={feedback !== "idle"} className="h-14 bg-transparent px-6 text-lg opacity-70 shadow-none">
            Skip ➜
          </KidButton>
        </div>
      </div>

      {index > 0 && <StoryCard story={story} solved={index} />}
    </GameShell>
  )
}

/** The story so far: every sentence whose word has been spelled (or skipped). */
function StoryCard({ story, solved }: { story: WordStory; solved: number }) {
  return (
    <div className="mt-6 rounded-[28px] bg-white/70 p-6 text-left shadow-[0_6px_0_rgba(43,33,64,0.06)] sm:p-8 dark:bg-white/5">
      <p className="text-lg font-semibold">{story.title === "Exam" ? "📝 Your answers so far" : "📖 Your story so far"}</p>
      <p className="mt-3 text-xl leading-relaxed">
        {story.lines.slice(0, solved).map((l, i) => (
          <span key={i}>
            <Sentence text={l.text} word={l.word} state="solved" />{" "}
          </span>
        ))}
      </p>
    </div>
  )
}

function BackTo({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 flex h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-[15px] font-semibold shadow-[0_3px_0_rgba(0,0,0,0.06)] outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10"
    >
      <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
      {label}
    </button>
  )
}
