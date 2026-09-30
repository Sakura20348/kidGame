import { useState } from "react"

import { kidsGames, randInt, shuffle, starsFor } from "@/data/kids-games"
import { useKids } from "@/lib/contexts"
import { GameShell, KidButton, ResultScreen } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "clock")!
const TOTAL = 10

type Time = { h: number; m: number }
type Question = { time: Time; choices: string[] }

const fmt = ({ h, m }: Time) => `${h}:${String(m).padStart(2, "0")}`

/** Rounds get harder: o'clock/half past → quarters → 5-minute steps. */
function minuteFor(round: number) {
  if (round < 3) return [0, 30][randInt(0, 1)]
  if (round < 6) return [0, 15, 30, 45][randInt(0, 3)]
  return randInt(0, 11) * 5
}

function makeQuestion(round: number): Question {
  const time = { h: randInt(1, 12), m: minuteFor(round) }
  const answer = fmt(time)
  const wrong = new Set<string>()
  const wrap = (h: number) => ((h + 11) % 12) + 1
  const candidates = [
    { h: wrap(time.h + 1), m: time.m }, // hour hand misread
    { h: wrap(time.h - 1), m: time.m },
    { h: time.h, m: (time.m + 30) % 60 },
    { h: time.h, m: (time.m + 15) % 60 },
    { h: time.m / 5 || 12, m: (time.h % 12) * 5 }, // hands swapped
  ]
  for (const c of shuffle(candidates)) {
    const s = fmt(c)
    if (s !== answer) wrong.add(s)
    if (wrong.size === 3) break
  }
  while (wrong.size < 3) {
    const s = fmt({ h: randInt(1, 12), m: time.m })
    if (s !== answer) wrong.add(s)
  }
  return { time, choices: shuffle([answer, ...wrong]) }
}

function ClockFace({ time }: { time: Time }) {
  const hourAngle = ((time.h % 12) + time.m / 60) * 30
  const minuteAngle = time.m * 6

  return (
    <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[280px]" role="img" aria-label="A clock. What time does it show?">
      <circle cx="100" cy="100" r="96" className="fill-[#2BC0A4]" />
      <circle cx="100" cy="100" r="86" className="fill-white dark:fill-[#1E1B2E]" />
      {Array.from({ length: 60 }, (_, i) => {
        const big = i % 5 === 0
        const a = (i * 6 * Math.PI) / 180
        const r1 = big ? 72 : 77
        return (
          <line
            key={i}
            x1={100 + r1 * Math.sin(a)}
            y1={100 - r1 * Math.cos(a)}
            x2={100 + 82 * Math.sin(a)}
            y2={100 - 82 * Math.cos(a)}
            strokeWidth={big ? 3 : 1.2}
            strokeLinecap="round"
            className="stroke-[#2B2140]/60 dark:stroke-white/50"
          />
        )
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1
        const a = (n * 30 * Math.PI) / 180
        return (
          <text
            key={n}
            x={100 + 58 * Math.sin(a)}
            y={100 - 58 * Math.cos(a)}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[#2B2140] font-kids text-[17px] font-semibold dark:fill-white"
          >
            {n}
          </text>
        )
      })}
      {/* hour hand */}
      <line
        x1="100" y1="100" x2="100" y2="58"
        strokeWidth="8" strokeLinecap="round"
        className="stroke-[#FF5E7E] transition-transform duration-700"
        style={{ transform: `rotate(${hourAngle}deg)`, transformOrigin: "100px 100px" }}
      />
      {/* minute hand */}
      <line
        x1="100" y1="100" x2="100" y2="30"
        strokeWidth="5" strokeLinecap="round"
        className="stroke-[#6C63FF] transition-transform duration-700"
        style={{ transform: `rotate(${minuteAngle}deg)`, transformOrigin: "100px 100px" }}
      />
      <circle cx="100" cy="100" r="7" className="fill-[#2B2140] dark:fill-white" />
    </svg>
  )
}

export default function ClockQuestPage() {
  const { award } = useKids()
  const [questions, setQuestions] = useState(() => Array.from({ length: TOTAL }, (_, i) => makeQuestion(i)))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const q = questions[index]
  const answer = fmt(q.time)

  function choose(value: string) {
    if (picked !== null) return
    const correct = value === answer
    const nextScore = score + (correct ? 1 : 0)
    setPicked(value)
    setScore(nextScore)
    setTimeout(() => {
      if (index + 1 >= TOTAL) {
        award(game.id, starsFor(nextScore, TOTAL))
        setDone(true)
      } else {
        setIndex(index + 1)
        setPicked(null)
      }
    }, correct ? 800 : 1500)
  }

  if (done) {
    return (
      <GameShell game={game} round={TOTAL} total={TOTAL} score={score}>
        <ResultScreen
          game={game}
          stars={starsFor(score, TOTAL)}
          message={`You read ${score} of ${TOTAL} clocks correctly.`}
          onReplay={() => {
            setQuestions(Array.from({ length: TOTAL }, (_, i) => makeQuestion(i)))
            setIndex(0)
            setScore(0)
            setPicked(null)
            setDone(false)
          }}
        />
      </GameShell>
    )
  }

  return (
    <GameShell game={game} round={index} total={TOTAL} score={score}>
      <div className="rounded-[32px] bg-white p-6 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
        <p className="mb-4 text-2xl font-semibold">What time is it?</p>
        <ClockFace time={q.time} />
        <p className="mt-4 h-7 text-lg font-medium" aria-live="polite">
          {picked === null ? "" : picked === answer ? "🎉 Correct!" : `Almost! It’s ${answer}.`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {q.choices.map((c) => (
            <KidButton
              key={c}
              onClick={() => choose(c)}
              disabled={picked !== null}
              state={picked === null ? "idle" : c === answer ? "right" : c === picked ? "wrong" : "dim"}
              className="h-20 bg-[#E6FAF4] text-3xl text-[#2B2140] tabular-nums shadow-[0_6px_0_#B5ECDD] dark:bg-white/10 dark:text-white dark:shadow-[0_6px_0_rgba(255,255,255,0.08)]"
            >
              {c}
            </KidButton>
          ))}
        </div>
      </div>
    </GameShell>
  )
}
