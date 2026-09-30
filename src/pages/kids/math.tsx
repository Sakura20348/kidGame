import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { kidsGames, starsFor } from "@/data/kids-games"
import { findAccount } from "@/lib/accounts"
import { useAuth, useKids } from "@/lib/contexts"
import { makeQuestion, topics, trackForAge, tracks, type Question, type Track } from "@/lib/math-sprint"
import { cn } from "@/lib/utils"
import { GameShell, KidButton, ResultScreen } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "math")!
const PRACTICE = 10 // questions when practising one topic; the exam length depends on the class (tracks[].exam)

export default function MathSprintPage() {
  const { email } = useAuth()
  const { award } = useKids()
  const suggested = trackForAge(findAccount(email)?.ageGroup)
  const [track, setTrack] = useState<Track | null>(null)
  const [topicIds, setTopicIds] = useState<string[] | null>(null)
  const [total, setTotal] = useState(PRACTICE)
  const [exam, setExam] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function start(ids: string[], count = PRACTICE, isExam = false) {
    setTopicIds(ids)
    setTotal(count)
    setExam(isExam)
    setQuestions(Array.from({ length: count }, () => makeQuestion(ids)))
    setIndex(0)
    setScore(0)
    setPicked(null)
    setDone(false)
  }

  function choose(value: string) {
    if (picked !== null) return
    const correct = value === questions[index].answer
    const nextScore = score + (correct ? 1 : 0)
    setPicked(value)
    setScore(nextScore)
    setTimeout(() => {
      if (index + 1 >= total) {
        award(game.id, starsFor(nextScore, total))
        setDone(true)
      } else {
        setIndex(index + 1)
        setPicked(null)
      }
    }, correct ? 700 : 1500)
  }

  // ------------------------------------------------------------ 1) choose a track
  if (!track) {
    return (
      <GameShell game={game} round={0} total={PRACTICE} score={0} wide hideProgress>
        <Reveal>
          <h2 className="text-4xl font-semibold">Choose your math</h2>
          <p className="mt-2 text-lg opacity-75">From counting to times tables — pick the level that fits your class.</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {tracks.map((t, i) => (
            <Reveal key={t.id} delay={i * 90} className="flex *:flex-1">
              <button
                type="button"
                onClick={() => setTrack(t.id)}
                className={cn(
                  "group relative flex min-h-[440px] flex-col overflow-hidden rounded-[34px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.16)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-1",
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
                    {topics.filter((x) => x.track === t.id).length} topics · exam: {t.exam} questions
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </GameShell>
    )
  }

  const info = tracks.find((t) => t.id === track)!
  const trackTopics = topics.filter((t) => t.track === track)

  // ------------------------------------------------------------ 2) choose a topic
  if (!topicIds) {
    return (
      <GameShell game={game} round={0} total={total} score={0} wide hideProgress>
        <BackTo label="All levels" onClick={() => setTrack(null)} />
        <div className="rounded-[32px] bg-white p-6 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
          <p className="text-3xl font-semibold">
            {info.emoji} {info.name}: what do you want to practise?
          </p>
          <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {trackTopics.map((t) => (
              <KidButton
                key={t.id}
                onClick={() => start([t.id])}
                className="h-auto flex-col gap-1 bg-[#FFF1E8] py-6 text-[#2B2140] shadow-[0_6px_0_#FFD2B8] dark:bg-white/10 dark:text-white dark:shadow-[0_6px_0_rgba(255,255,255,0.08)]"
              >
                <span aria-hidden className="text-5xl">
                  {t.emoji}
                </span>
                <span className="text-xl">{t.label}</span>
              </KidButton>
            ))}
            <KidButton
              onClick={() => start(trackTopics.map((t) => t.id), info.exam, true)}
              className={cn("h-auto flex-col gap-1 bg-linear-to-br py-6 text-white", info.tile)}
            >
              <span aria-hidden className="text-5xl">
                📝
              </span>
              <span className="text-xl">Exam</span>
              <span className="text-sm font-medium opacity-90">
                All topics · {info.exam} questions
              </span>
            </KidButton>
          </div>
        </div>
      </GameShell>
    )
  }

  // ------------------------------------------------------------ 3) results
  if (done) {
    return (
      <GameShell game={game} round={total} total={total} score={score}>
        <ResultScreen
          game={game}
          stars={starsFor(score, total)}
          message={
            exam
              ? `📝 ${info.name} exam: ${score} out of ${total} right (${Math.round((score / total) * 100)}%).`
              : `${info.name}: you got ${score} out of ${total} right.`
          }
          onReplay={() => setTopicIds(null)}
        />
      </GameShell>
    )
  }

  // ------------------------------------------------------------ 4) play
  const q = questions[index]
  const long = !q.plain && (q.expr.length > 16 || q.expr.includes("\n"))
  return (
    <GameShell game={game} round={index} total={total} score={score}>
      <div className="rounded-[32px] bg-white p-6 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
        <p className="text-lg font-semibold opacity-70">
          {exam ? "📝 Exam · " : ""}
          {info.emoji} {info.name} · {q.prompt}
        </p>
        <p
          key={index}
          className={cn(
            "mt-3 animate-kid-pop font-semibold tracking-tight whitespace-pre-line tabular-nums",
            long ? "text-4xl leading-snug sm:text-5xl" : "text-6xl sm:text-7xl"
          )}
        >
          {q.plain || q.expr.includes("?") || q.expr.includes("=") || q.expr.includes(" and ") ? q.expr : <>{q.expr} = <span className="text-[#FF5E7E]">?</span></>}
        </p>
        <p className="mt-4 h-7 text-lg font-medium" aria-live="polite">
          {picked === null ? "" : picked === q.answer ? "🎉 Correct!" : `Almost! The answer is ${q.answer}.`}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {q.choices.map((c) => (
            <KidButton
              key={c}
              onClick={() => choose(c)}
              disabled={picked !== null}
              state={picked === null ? "idle" : c === q.answer ? "right" : c === picked ? "wrong" : "dim"}
              className={cn(
                "h-auto min-h-20 bg-[#FFF1E8] py-3 text-[#2B2140] tabular-nums shadow-[0_6px_0_#FFD2B8] dark:bg-white/10 dark:text-white dark:shadow-[0_6px_0_rgba(255,255,255,0.08)]",
                c.length > 8 ? "text-2xl" : "text-3xl"
              )}
            >
              {c}
            </KidButton>
          ))}
        </div>
      </div>
    </GameShell>
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
