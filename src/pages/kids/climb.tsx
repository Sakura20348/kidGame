import { useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, ArrowRight02Icon, LockIcon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { kidsGames } from "@/data/kids-games"
import { findAccount } from "@/lib/accounts"
import { climbTrackForClass, climbTracks, coldness, makeQuestion, mountainsFor, tempAt, type ClimbTrack, type Mountain } from "@/lib/climb-math"
import { useAuth, useKids } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { cn } from "@/lib/utils"
import { GameShell, KidButton } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "climb")!
const items = ["🍎", "⭐", "🍓", "🐟", "🌸", "🍪"]
const cheers = ["Great climb!", "Keep going!", "Super!", "Nice one!", "You’re flying up!", "Awesome!"]

type Progress = Record<number, number> // mountain id → best stars

// Class 0–3 keeps the original key, so old progress stays
const progressKey = (email: string | null, track: ClimbTrack) => kidsKey(email, track === "kids" ? "climb" : `climb.${track}`)

function readProgress(email: string | null, track: ClimbTrack): Progress {
  try {
    return JSON.parse(localStorage.getItem(progressKey(email, track)) ?? "{}")
  } catch {
    return {}
  }
}

/** A few more mistakes are allowed on the longer mountains. */
function climbStars(mistakes: number, m: Mountain) {
  const easy = m.steps <= 10 ? 1 : 2
  if (mistakes <= easy) return 3
  if (mistakes <= easy + 3) return 2
  return 1 // reaching the top always earns a star
}

/** Jagged snow cap from the peak down to `snowLine` of the mountain height. */
function snowCap(px: number, py: number, height: number, snowLine: number, halfBase: number) {
  const y = py + height * snowLine
  const w = halfBase * snowLine
  const teeth = 5
  const pts = [`${px},${py}`, `${px + w},${y}`]
  for (let t = 1; t < teeth; t++) {
    const x = px + w - (2 * w * t) / teeth
    pts.push(`${x},${y + (t % 2 ? -height * 0.05 : height * 0.02)}`)
  }
  pts.push(`${px - w},${y}`)
  return pts.join(" ")
}

export default function MountainClimbPage() {
  const { email } = useAuth()
  // Class 0–3: easy math · Class 4: medium ("?track=" switches)
  const suggested = climbTrackForClass(findAccount(email)?.ageGroup)
  const [params, setParams] = useSearchParams()
  const track = climbTracks.find((t) => t.id === params.get("track"))?.id ?? suggested

  const trackSwitch = (
    <div role="tablist" aria-label="Math level" className="mb-6 flex w-fit max-w-full flex-wrap gap-1 rounded-[28px] bg-white p-1.5 shadow-[0_4px_0_rgba(0,0,0,0.06)] dark:bg-white/10">
      {climbTracks.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={track === t.id}
          onClick={() => setParams(t.id === suggested ? {} : { track: t.id }, { replace: true })}
          className={cn(
            "h-11 rounded-full px-4 text-[15px] font-semibold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 sm:px-5 sm:text-[16px]",
            track === t.id ? cn("bg-linear-to-br text-white", t.tile) : "text-[#2B2140]/70 hover:text-[#2B2140] dark:text-white/70"
          )}
        >
          {t.emoji} {t.classes}
          {t.id === suggested && <span className="ml-1.5" aria-label="for you">⭐</span>}
        </button>
      ))}
    </div>
  )

  return <ClimbTrackView key={track} track={track} header={trackSwitch} />
}

function ClimbTrackView({ track, header }: { track: ClimbTrack; header: ReactNode }) {
  const { email } = useAuth()
  const { award } = useKids()
  const mountains = mountainsFor(track)
  const [progress, setProgress] = useState(() => readProgress(email, track))
  // "&m=3" opens an unlocked mountain straight away
  const [params] = useSearchParams()
  const [current, setCurrent] = useState<Mountain | null>(() => {
    const m = mountains.find((x) => x.id === Number(params.get("m")))
    return m && (m.id === 1 || (progress[m.id - 1] ?? 0) > 0) ? m : null
  })
  const [run, setRun] = useState(0)

  function finish(m: Mountain, stars: number) {
    const old = progress[m.id] ?? 0
    const next = { ...progress, [m.id]: Math.max(old, stars) }
    setProgress(next)
    try {
      localStorage.setItem(progressKey(email, track), JSON.stringify(next))
    } catch {
      // ignore
    }
    // only improvements add stars; the tile shows the average over all mountains
    const total = Object.values(next).reduce((a, b) => a + b, 0)
    award(game.id, Math.max(0, stars - old), Math.floor(total / mountains.length))
  }

  return (
    <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
      {current ? (
        <Climb
          key={`${current.id}-${run}`}
          mountain={current}
          onFinish={finish}
          onAgain={() => setRun((r) => r + 1)}
          onNext={() => {
            const next = mountains.find((m) => m.id === current.id + 1)
            if (next) setCurrent(next)
          }}
          onMap={() => setCurrent(null)}
        />
      ) : (
        <>
          {header}
          <MountainPicker track={track} mountains={mountains} progress={progress} onPick={setCurrent} />
        </>
      )}
    </GameShell>
  )
}

// =================================================================== picker

function MountainPicker({ track, mountains, progress, onPick }: { track: ClimbTrack; mountains: Mountain[]; progress: Progress; onPick: (m: Mountain) => void }) {
  const open = (m: Mountain) => m.id === 1 || (progress[m.id - 1] ?? 0) > 0
  const info = climbTracks.find((t) => t.id === track)!
  return (
    <div>
      <Reveal>
        <h2 className="text-4xl font-semibold">
          {info.emoji} {info.name} · {info.classes}
        </h2>
        <p className="mt-2 text-lg opacity-75">
          {info.blurb}. Each mountain is higher, colder and trickier. Reach the top to unlock the next one!
        </p>
      </Reveal>
      <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {mountains.map((m, i) => {
          const unlocked = open(m)
          const stars = progress[m.id] ?? 0
          return (
            <Reveal key={m.id} delay={i * 80} className="flex *:flex-1">
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => onPick(m)}
                className={cn(
                  "relative flex min-h-[440px] flex-col overflow-hidden rounded-[34px] p-6 text-left text-[#1E2A3A] shadow-[0_8px_0_rgba(0,0,0,0.14)] outline-none transition-transform focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50",
                  unlocked ? "hover:-translate-y-1.5 active:translate-y-1" : "cursor-not-allowed opacity-55 grayscale-[40%]"
                )}
                style={{ background: `linear-gradient(to bottom, ${m.sky[0]}, ${m.sky[1]})` }}
              >
                <svg viewBox="0 0 100 80" className="pointer-events-none absolute inset-x-0 bottom-0 h-[85%] w-full" preserveAspectRatio="none" aria-hidden>
                  <polygon points="0,80 50,8 100,80" fill={m.rock} opacity="0.85" />
                  <polygon points={snowCap(50, 8, 72, m.snowLine, 50)} fill="#FFFFFF" />
                </svg>
                <span className="relative flex items-center justify-between">
                  <span className="rounded-full bg-white/80 px-4 py-1.5 text-base font-semibold">
                    {m.id}/5 · {m.steps} steps
                  </span>
                  {!unlocked && (
                    <span className="flex size-11 items-center justify-center rounded-full bg-white/80">
                      <HugeiconsIcon icon={LockIcon} className="size-6" />
                    </span>
                  )}
                </span>
                <span className="relative mt-auto rounded-[22px] bg-white/85 px-5 py-4 shadow-[0_4px_0_rgba(0,0,0,0.06)] backdrop-blur-sm">
                  <span className="block text-3xl leading-tight font-semibold whitespace-nowrap">
                    {m.emoji} {m.name}
                  </span>
                  <span className="mt-1 block text-base font-medium opacity-80">{m.topic}</span>
                  <span className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <span className="rounded-full bg-[#1E2A3A]/8 px-3 py-1 text-[15px] font-semibold whitespace-nowrap">
                      🌡️ {m.temp[0]}° → {m.temp[1]}°C
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

// =================================================================== climb

function Climb({
  mountain: m,
  onFinish,
  onAgain,
  onNext,
  onMap,
}: {
  mountain: Mountain
  onFinish: (m: Mountain, stars: number) => void
  onAgain: () => void
  onNext: () => void
  onMap: () => void
}) {
  const STEPS = m.steps
  const [step, setStep] = useState(0)
  const [question, setQuestion] = useState(() => makeQuestion(m, 0))
  const [item] = useState(() => items[Math.floor(Math.random() * items.length)])
  const [picked, setPicked] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const [missesHere, setMissesHere] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [wobble, setWobble] = useState(0)
  const [message, setMessage] = useState(`Welcome to ${m.name}! Answer to climb. 🧗`)
  const [stars, setStars] = useState<number | null>(null)

  const atTop = step >= STEPS
  const cold = coldness(m, step)
  const temp = tempAt(m, step)
  const snowflakes = Math.round(cold * 26)
  const ledges = Array.from({ length: STEPS + 1 }, (_, i) => ({
    x: i === STEPS ? 50 : 50 + (i % 2 === 0 ? -1 : 1) * (27 - (i * 22) / STEPS),
    y: 90 - (i * 81) / STEPS,
  }))
  const here = ledges[step]
  const snowStartsAt = 1 - m.snowLine // ledges higher than this are icy

  function choose(n: number) {
    if (picked !== null || atTop) return
    if (n === question.answer) {
      setPicked(n)
      setMessage(`✅ ${cheers[step % cheers.length]}`)
      setTimeout(() => {
        const next = step + 1
        setStep(next)
        setPicked(null)
        setMissesHere(0)
        if (next >= STEPS) {
          const s = climbStars(mistakes, m)
          setStars(s)
          setMessage(`🚩 You reached the top of ${m.name}!`)
          onFinish(m, s)
        } else {
          setQuestion(makeQuestion(m, next))
          setMessage(
            next === STEPS - 1
              ? "One more step to the top! 🏔️"
              : tempAt(m, next) < 0 && tempAt(m, step) >= 0
                ? "Brrr! It’s below zero now ❄️"
                : "Next step!"
          )
        }
      }, 450)
    } else {
      setMistakes((x) => x + 1)
      setMissesHere((x) => x + 1)
      setWobble((w) => w + 1)
      setWrong(n)
      setTimeout(() => setWrong(null), 550)
      setMessage(
        missesHere >= 1
          ? "Look at the green button 👀"
          : question.helper
            ? "Oops! Try again — count the pictures."
            : "Oops! Try again — you can do it!"
      )
    }
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
          All mountains
        </button>
        <h2 className="text-3xl font-semibold">
          {m.emoji} {m.name}
        </h2>
        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold dark:bg-white/10">{m.topic}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---------------- mountain scene */}
        <div
          className="@container relative mx-auto aspect-[4/5] w-full max-w-[560px] overflow-hidden rounded-[32px] shadow-[0_8px_0_rgba(43,33,64,0.08)]"
          style={{ background: `linear-gradient(to bottom, ${m.sky[0]}, ${m.sky[1]})` }}
        >
          {/* the higher you are, the icier the air */}
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-b from-[#E6F4FF] via-[#CFE6FA]/70 to-transparent transition-opacity duration-1000"
            style={{ opacity: 0.15 + cold * 0.7 }}
          />
          <div aria-hidden className="absolute inset-0 hidden bg-[#0E1230]/55 dark:block" />

          <span aria-hidden className={cn("absolute top-[5%] right-[8%] text-5xl transition-opacity duration-1000 dark:hidden", cold > 0.6 && "opacity-60")}>
            {cold > 0.75 ? "🌥️" : "☀️"}
          </span>
          <span aria-hidden className="absolute top-[5%] right-[8%] hidden text-5xl dark:block">
            🌙
          </span>
          <span aria-hidden className="absolute top-[10%] left-[-20%] animate-cloud text-5xl opacity-90">
            ☁️
          </span>
          <span aria-hidden className="absolute top-[22%] left-[-20%] animate-cloud-slow text-4xl opacity-80">
            ☁️
          </span>

          {/* mountains */}
          <svg viewBox="0 0 100 125" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
            <polygon points="-10,125 18,55 38,80 60,40 110,125" fill="#B9CFE0" opacity="0.9" />
            <polygon points={snowCap(60, 40, 85, Math.min(1, m.snowLine + 0.15), 50)} fill="#FFFFFF" opacity="0.9" />
            <polygon points="0,125 50,10 100,125" fill={m.rock} />
            <polygon points={snowCap(50, 10, 115, m.snowLine, 50)} fill="#FFFFFF" />
            {m.ground === "grass" && <polygon points="-5,125 20,100 40,112 62,98 105,125" fill="#7CC46A" />}
            {m.ground === "pines" && <polygon points="-5,125 20,104 40,114 62,102 105,125" fill="#5E8F6A" />}
            {m.ground === "snow" && <polygon points="-5,125 20,104 40,112 62,100 105,125" fill="#F2F8FF" />}
            <polyline
              points={ledges.map((l) => `${l.x},${l.y * 1.25}`).join(" ")}
              fill="none"
              stroke="#F5E6C8"
              strokeOpacity="0.7"
              strokeWidth="0.6"
              strokeDasharray="1.5 1.5"
            />
          </svg>
          {m.ground === "pines" && (
            <div aria-hidden className="absolute bottom-[2%] flex w-full justify-around text-3xl">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i}>🌲</span>
              ))}
            </div>
          )}

          {/* ledges: icy above the snow line */}
          {ledges.map((l, i) => {
            const icy = 1 - l.y / 100 > snowStartsAt
            return (
              <span
                key={i}
                className={cn(
                  "absolute h-[3%] w-[15%] -translate-x-1/2 rounded-full transition-colors duration-500",
                  i === STEPS
                    ? "bg-transparent"
                    : i < step
                      ? "bg-[#6BCB77] shadow-[0_3px_0_rgba(0,0,0,0.2)]"
                      : icy
                        ? "bg-[#DDF1FF] shadow-[0_3px_0_#9CC7E8]"
                        : "bg-[#C9B79C] shadow-[0_3px_0_rgba(0,0,0,0.2)]"
                )}
                style={{ left: `${l.x}%`, top: `${l.y}%` }}
              >
                {i > 0 && i < step && i < STEPS && (
                  <span aria-hidden className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">
                    ⭐
                  </span>
                )}
                {icy && i >= step && i < STEPS && (
                  <span aria-hidden className="absolute -top-2.5 right-0 text-[10px]">
                    ❄️
                  </span>
                )}
              </span>
            )
          })}

          {/* summit flag */}
          <span
            aria-hidden
            className={cn("absolute -translate-x-1/2 -translate-y-full text-5xl", atTop && "animate-kid-pop")}
            style={{ left: `${ledges[STEPS].x}%`, top: `${ledges[STEPS].y}%` }}
          >
            🚩
          </span>

          {/* falling snow – more of it the higher (colder) you are */}
          {Array.from({ length: snowflakes }, (_, i) => (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute top-0 animate-snow text-white drop-shadow"
              style={{
                left: `${(i * 37 + 11) % 100}%`,
                fontSize: `${10 + ((i * 7) % 12)}px`,
                animationDuration: `${5 + ((i * 13) % 6)}s`,
                animationDelay: `-${(i * 1.7) % 7}s`,
                opacity: 0.55 + ((i * 3) % 5) / 10,
              }}
            >
              ❄
            </span>
          ))}

          {/* climber – puts on a scarf below zero */}
          <span
            className="absolute text-5xl drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-[left,top] duration-700 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
            style={{ left: `${here.x}%`, top: `${here.y}%`, transform: "translate(-50%, -95%)" }}
            aria-label={`Climber on step ${step} of ${STEPS}`}
          >
            <span key={wobble} className={cn("relative block", wobble > 0 && "animate-kid-shake")}>
              {atTop ? "🙌" : "🧗"}
              {temp < 0 && !atTop && (
                <span aria-hidden className="absolute -right-2 bottom-0 text-2xl">
                  🧣
                </span>
              )}
            </span>
          </span>

          {/* thermometer + step counter */}
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-3 py-1 text-sm font-bold shadow transition-colors duration-700",
              temp < 0 ? "bg-[#DDF1FF] text-[#1E5FA8]" : temp < 10 ? "bg-[#FFF3D6] text-[#9A6B00]" : "bg-[#FFE4D6] text-[#B4471A]"
            )}
          >
            🌡️ {temp}°C
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-sm font-semibold text-[#2B2140] shadow">
            Step {Math.min(step, STEPS)} / {STEPS}
          </span>
        </div>

        {/* ---------------- question panel (frostier higher up) */}
        <div
          className={cn(
            "flex flex-col justify-center rounded-[32px] bg-white p-6 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5",
            cold > 0.5 && "ring-4 ring-[#CFE6FA] dark:ring-[#2A3A66]"
          )}
        >
          {atTop ? (
            <div className="animate-kid-pop">
              <p className="text-5xl font-semibold">🏔️ You made it!</p>
              <p className="mt-2 text-lg opacity-75">
                {mistakes === 0 ? "No mistakes at all — amazing!" : `${mistakes} oops${mistakes === 1 ? "" : "es"} on the way.`}
              </p>
              <div className="mt-4 flex justify-center gap-2 text-5xl" aria-label={`${stars ?? 0} of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} aria-hidden className={cn("animate-kid-pop", n > (stars ?? 0) && "opacity-25 grayscale")} style={{ animationDelay: `${n * 0.15}s` }}>
                    ⭐
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                {m.id < 5 ? (
                  <KidButton onClick={onNext} className="gap-2 bg-linear-to-br from-[#56CCF2] to-[#2F80ED] text-white">
                    Next mountain <HugeiconsIcon icon={ArrowRight02Icon} className="size-6" />
                  </KidButton>
                ) : (
                  <p className="text-xl font-semibold">👑 You climbed every mountain!</p>
                )}
                <KidButton onClick={onAgain} className="bg-[#F1ECFF] text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white">
                  Climb again
                </KidButton>
              </div>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium opacity-70">Solve it to climb!</p>
              <p
                key={step}
                className={cn(
                  "mt-2 animate-kid-pop font-semibold tabular-nums",
                  // long questions get a smaller size so they fit on one line
                  question.text.length > 18 ? "text-3xl sm:text-4xl" : question.text.length > 12 ? "text-5xl sm:text-6xl" : "text-6xl sm:text-7xl"
                )}
              >
                {question.text.split("?").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <span className="text-[#FF8A5B]">?</span>}
                  </span>
                ))}
              </p>

              {question.helper && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-3xl" aria-hidden>
                  <span className="flex flex-wrap justify-center gap-0.5">
                    {Array.from({ length: question.helper.a }, (_, i) => (
                      <span
                        key={i}
                        className={cn(
                          question.helper!.op === "−" &&
                            i >= question.helper!.a - question.helper!.b &&
                            "opacity-30 line-through decoration-[#FF5E7E] decoration-4"
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </span>
                  {question.helper.op === "+" && (
                    <>
                      <span className="font-semibold opacity-60">+</span>
                      <span className="flex flex-wrap justify-center gap-0.5">
                        {Array.from({ length: question.helper.b }, (_, i) => (
                          <span key={i}>{item}</span>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className={cn("mt-8 grid gap-4", question.choices.length === 4 ? "grid-cols-2" : "grid-cols-3")}>
                {question.choices.map((c) => (
                  <KidButton
                    key={`${step}-${c}-${wrong === c ? wobble : 0}`}
                    onClick={() => choose(c)}
                    disabled={picked !== null}
                    state={picked === c ? "right" : wrong === c ? "wrong" : "idle"}
                    className={cn(
                      "h-24 text-5xl tabular-nums dark:bg-white/10 dark:text-white dark:shadow-[0_6px_0_rgba(255,255,255,0.08)]",
                      cold > 0.5
                        ? "bg-[#EAF5FF] text-[#1E3A5F] shadow-[0_6px_0_#BBD8F2]"
                        : "bg-[#FFF1E8] text-[#2B2140] shadow-[0_6px_0_#FFD2B8]",
                      missesHere >= 2 && c === question.answer && "ring-4 ring-[#2BC0A4]"
                    )}
                  >
                    {c}
                  </KidButton>
                ))}
              </div>
            </>
          )}
          <p className="mt-6 min-h-8 text-xl font-semibold" aria-live="polite">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
