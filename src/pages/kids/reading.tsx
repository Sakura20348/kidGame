import { useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, VolumeHighIcon } from "@hugeicons/core-free-icons"

import { ReadAloud } from "@/components/kids/read-aloud"
import { Reveal } from "@/components/motion/reveal"
import { kidsGames, shuffle, starsFor } from "@/data/kids-games"
import { sentences, stories, wordSets } from "@/data/reading"
import { readLevelForClass, readLevels } from "@/data/reading-passages"
import { useSpeech } from "@/hooks/use-speech"
import { findAccount } from "@/lib/accounts"
import { useAuth, useKids } from "@/lib/contexts"
import { cn } from "@/lib/utils"
import { GameShell, KidButton, ResultScreen } from "@/pages/kids/game-shell"
import { PassageReading } from "@/pages/kids/reading-passages"

const game = kidsGames.find((g) => g.id === "reading")!
const ROUNDS = 8

type Mode = "listen" | "match" | "story"

const modes: { id: Mode; title: string; blurb: string; emoji: string; level: string; tile: string }[] = [
  {
    id: "listen",
    title: "Listen & Find",
    blurb: "Hear a word, then find it among look-alike words.",
    emoji: "👂",
    level: "Words",
    tile: "from-[#4FACFE] to-[#6C63FF]",
  },
  {
    id: "match",
    title: "Read & Match",
    blurb: "Read a sentence and pick the picture that matches.",
    emoji: "🖼️",
    level: "Sentences",
    tile: "from-[#FF8A5B] to-[#FF5E7E]",
  },
  {
    id: "story",
    title: "Story Time",
    blurb: "Read a short story, then answer questions about it.",
    emoji: "📚",
    level: "Stories",
    tile: "from-[#2BC0A4] to-[#1F9D6B]",
  },
]

const choiceClass =
  "bg-[#FFF1E8] text-[#2B2140] shadow-[0_6px_0_#FFD2B8] dark:bg-white/10 dark:text-white dark:shadow-[0_6px_0_rgba(255,255,255,0.08)]"

export default function LearnToReadPage() {
  const { email } = useAuth()
  const [mode, setMode] = useState<Mode | null>(null)
  const [session, setSession] = useState(0)
  // Class 0–3: Words → Sentences → Stories · Class 4: ~200-word texts
  const suggested = readLevelForClass(findAccount(email)?.ageGroup)
  const [params, setParams] = useSearchParams()
  const level = readLevels.find((l) => l.id === params.get("level"))?.id ?? suggested

  const exit = () => setMode(null)
  const replay = () => setSession((s) => s + 1)

  const levelSwitch = (
    <div role="tablist" aria-label="Reading level" className="mb-6 flex w-fit max-w-full flex-wrap gap-1 rounded-[28px] bg-white p-1.5 shadow-[0_4px_0_rgba(0,0,0,0.06)] dark:bg-white/10">
      {readLevels.map((l) => (
        <button
          key={l.id}
          type="button"
          role="tab"
          aria-selected={level === l.id}
          onClick={() => setParams(l.id === suggested ? {} : { level: l.id }, { replace: true })}
          className={cn(
            "h-11 rounded-full px-4 text-[15px] font-semibold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 sm:px-5 sm:text-[16px]",
            level === l.id ? cn("bg-linear-to-br text-white", l.tile) : "text-[#2B2140]/70 hover:text-[#2B2140] dark:text-white/70"
          )}
        >
          {l.emoji} {l.classes}
          {l.id === suggested && <span className="ml-1.5" aria-label="for you">⭐</span>}
        </button>
      ))}
    </div>
  )

  if (level !== "kids") return <PassageReading key={level} level={level} header={levelSwitch} />

  if (mode === "listen") return <ListenAndFind key={session} onReplay={replay} onExit={exit} />
  if (mode === "match") return <ReadAndMatch key={session} onReplay={replay} onExit={exit} />
  if (mode === "story") return <StoryTime key={session} onReplay={replay} onExit={exit} />

  return (
    <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
      {levelSwitch}
      <Reveal>
        <h2 className="text-3xl font-semibold sm:text-4xl">🧸 First reading · Class 0–3</h2>
        <p className="mt-2 text-lg opacity-75">How do you want to practise reading? Tip: tap any word to hear it. 🔊</p>
      </Reveal>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {modes.map((m, i) => (
          <Reveal key={m.id} delay={i * 90} className="flex *:flex-1">
            <button
              type="button"
              onClick={() => {
                setMode(m.id)
                setSession((s) => s + 1)
              }}
              className={cn(
                "group relative flex min-h-[250px] flex-col overflow-hidden rounded-[32px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.18)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,0.18)]",
                m.tile
              )}
            >
              <span aria-hidden className="absolute -top-10 -right-10 size-36 rounded-full bg-white/15" />
              <span className="relative w-fit rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">
                {i + 1}. {m.level}
              </span>
              <span aria-hidden className="relative my-4 self-center text-[80px] leading-none transition-transform group-hover:scale-110">
                {m.emoji}
              </span>
              <span className="relative mt-auto text-2xl font-semibold">{m.title}</span>
              <span className="relative mt-1 text-[15px] leading-snug opacity-90">{m.blurb}</span>
            </button>
          </Reveal>
        ))}
      </div>
    </GameShell>
  )
}

type ModeProps = { onReplay: () => void; onExit: () => void }

/** Shared finish: award stars once, show the result screen. */
function useFinish() {
  const { award } = useKids()
  const [done, setDone] = useState(false)
  function finish(score: number, total: number) {
    award(game.id, starsFor(score, total))
    setDone(true)
  }
  return { done, finish }
}

function Feedback({ picked, correct, answer }: { picked: boolean; correct: boolean; answer: string }) {
  return (
    <p className="mt-4 h-8 text-center text-xl font-semibold" aria-live="polite">
      {!picked ? "" : correct ? "🎉 Great reading!" : `Almost! The answer is “${answer}”.`}
    </p>
  )
}

// =================================================================== 1. Listen & Find

function ListenAndFind({ onReplay, onExit }: ModeProps) {
  const { speak, supported } = useSpeech()
  const { done, finish } = useFinish()
  const [rounds] = useState(() =>
    shuffle(wordSets)
      .slice(0, ROUNDS)
      .map((s) => ({ answer: s.words[0], emoji: s.emoji, choices: shuffle([...s.words]) }))
  )
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const round = rounds[index]

  // say the word at the start of every round
  useEffect(() => {
    if (!done) speak(round.answer, 0.75)
  }, [round.answer, done, speak])

  function choose(word: string) {
    if (picked) return
    const correct = word === round.answer
    const next = score + (correct ? 1 : 0)
    setPicked(word)
    setScore(next)
    if (!correct) speak(round.answer, 0.75)
    setTimeout(() => {
      if (index + 1 >= ROUNDS) finish(next, ROUNDS)
      else {
        setIndex(index + 1)
        setPicked(null)
      }
    }, correct ? 900 : 1700)
  }

  if (done)
    return (
      <GameShell game={game} round={ROUNDS} total={ROUNDS} score={score}>
        <ResultScreen game={game} stars={starsFor(score, ROUNDS)} message={`You found ${score} of ${ROUNDS} words.`} onReplay={onReplay} />
        <BackToModes onExit={onExit} />
      </GameShell>
    )

  return (
    <GameShell game={game} round={index} total={ROUNDS} score={score}>
      <Card>
        <p aria-hidden className="text-center text-8xl">
          {round.emoji}
        </p>
        <p className="mt-3 text-center text-2xl font-semibold">
          {supported ? "Which word did you hear?" : "Which word matches the picture?"}
        </p>
        {supported && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => speak(round.answer, 0.7)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#6C63FF] px-5 text-lg font-semibold text-white shadow-[0_4px_0_#4B42D6] outline-none active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
            >
              <HugeiconsIcon icon={VolumeHighIcon} className="size-5" />
              Listen again
            </button>
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {round.choices.map((w) => (
            <KidButton
              key={w}
              onClick={() => choose(w)}
              disabled={picked !== null}
              state={!picked ? "idle" : w === round.answer ? "right" : w === picked ? "wrong" : "dim"}
              className={cn("h-20 text-4xl", choiceClass)}
            >
              {w}
            </KidButton>
          ))}
        </div>
        <Feedback picked={picked !== null} correct={picked === round.answer} answer={round.answer} />
      </Card>
    </GameShell>
  )
}

// =================================================================== 2. Read & Match

function ReadAndMatch({ onReplay, onExit }: ModeProps) {
  const { done, finish } = useFinish()
  const [rounds] = useState(() =>
    shuffle(sentences)
      .slice(0, ROUNDS)
      .map((s) => ({ text: s.text, answer: s.pictures[0], choices: shuffle([...s.pictures]) }))
  )
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const round = rounds[index]

  function choose(pic: string) {
    if (picked) return
    const correct = pic === round.answer
    const next = score + (correct ? 1 : 0)
    setPicked(pic)
    setScore(next)
    setTimeout(() => {
      if (index + 1 >= ROUNDS) finish(next, ROUNDS)
      else {
        setIndex(index + 1)
        setPicked(null)
      }
    }, correct ? 900 : 1600)
  }

  if (done)
    return (
      <GameShell game={game} round={ROUNDS} total={ROUNDS} score={score}>
        <ResultScreen game={game} stars={starsFor(score, ROUNDS)} message={`You matched ${score} of ${ROUNDS} sentences.`} onReplay={onReplay} />
        <BackToModes onExit={onExit} />
      </GameShell>
    )

  return (
    <GameShell game={game} round={index} total={ROUNDS} score={score}>
      <Card>
        <p className="text-center text-lg font-medium opacity-70">Read the sentence. Which picture matches?</p>
        <ReadAloud key={index} text={round.text} size="xl" className="mt-4 text-center" />
        <div className="mt-6 grid grid-cols-2 gap-4">
          {round.choices.map((pic) => (
            <KidButton
              key={pic}
              onClick={() => choose(pic)}
              disabled={picked !== null}
              aria-label={`Picture ${pic}`}
              state={!picked ? "idle" : pic === round.answer ? "right" : pic === picked ? "wrong" : "dim"}
              className={cn("h-28 text-6xl", choiceClass)}
            >
              {pic}
            </KidButton>
          ))}
        </div>
        <p className="mt-4 h-8 text-center text-xl font-semibold" aria-live="polite">
          {!picked ? "" : picked === round.answer ? "🎉 Great reading!" : "Almost! Look for the green picture."}
        </p>
      </Card>
    </GameShell>
  )
}

// =================================================================== 3. Story Time

function StoryTime({ onReplay, onExit }: ModeProps) {
  const { done, finish } = useFinish()
  const [story] = useState(() => {
    const s = stories[Math.floor(Math.random() * stories.length)]
    return { ...s, questions: s.questions.map((q) => ({ q: q.q, answer: q.options[0], options: shuffle([...q.options]) })) }
  })
  const [phase, setPhase] = useState<"read" | "questions">("read")
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const total = story.questions.length
  const question = story.questions[index]

  function choose(option: string) {
    if (picked) return
    const correct = option === question.answer
    const next = score + (correct ? 1 : 0)
    setPicked(option)
    setScore(next)
    setTimeout(() => {
      if (index + 1 >= total) finish(next, total)
      else {
        setIndex(index + 1)
        setPicked(null)
      }
    }, correct ? 900 : 1700)
  }

  if (done)
    return (
      <GameShell game={game} round={total} total={total} score={score}>
        <ResultScreen
          game={game}
          stars={starsFor(score, total)}
          message={`You answered ${score} of ${total} questions about “${story.title}”.`}
          onReplay={onReplay}
        />
        <BackToModes onExit={onExit} />
      </GameShell>
    )

  if (phase === "read")
    return (
      <GameShell game={game} round={0} total={total} score={0}>
        <Card>
          <p className="text-center text-6xl" aria-hidden>
            {story.emoji}
          </p>
          <h2 className="mt-2 text-center text-3xl font-semibold">{story.title}</h2>
          <ReadAloud text={story.text} className="mt-5" />
          <div className="mt-8 flex justify-center">
            <KidButton onClick={() => setPhase("questions")} className={cn("gap-2 bg-linear-to-br text-white", game.tile)}>
              I’m ready for the questions
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-6" />
            </KidButton>
          </div>
        </Card>
      </GameShell>
    )

  return (
    <GameShell game={game} round={index} total={total} score={score}>
      <Card>
        <details className="rounded-[20px] bg-[#FFF6E5] px-5 py-3 dark:bg-white/5">
          <summary className="cursor-pointer text-lg font-semibold">
            {story.emoji} Read “{story.title}” again
          </summary>
          <p className="mt-3 text-lg leading-relaxed">{story.text}</p>
        </details>
        <ReadAloud key={index} text={question.q} size="xl" className="mt-6 text-center" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {question.options.map((o) => (
            <KidButton
              key={o}
              onClick={() => choose(o)}
              disabled={picked !== null}
              state={!picked ? "idle" : o === question.answer ? "right" : o === picked ? "wrong" : "dim"}
              className={cn("h-auto min-h-16 py-3 text-2xl", choiceClass)}
            >
              {o}
            </KidButton>
          ))}
        </div>
        <Feedback picked={picked !== null} correct={picked === question.answer} answer={question.answer} />
      </Card>
    </GameShell>
  )
}

// =================================================================== bits

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">{children}</div>
  )
}

function BackToModes({ onExit }: { onExit: () => void }) {
  return (
    <div className="mt-5 flex justify-center">
      <button
        type="button"
        onClick={onExit}
        className="rounded-full px-4 py-2 text-lg font-medium opacity-70 outline-none hover:opacity-100 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
      >
        ← Try another reading game
      </button>
    </div>
  )
}
