import { useEffect, useEffectEvent, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react"
import Matter from "matter-js"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, ArrowRight02Icon, Idea01Icon, LockIcon, RefreshIcon, ViewIcon } from "@hugeicons/core-free-icons"

import { burstButterflies, burstSparks, drawScene, stepEffects, type Scene } from "@/components/chain/draw"
import { Reveal } from "@/components/motion/reveal"
import { butterflySeeds, type SeedInfo } from "@/data/butterfly-seeds"
import { kidsGames } from "@/data/kids-games"
import {
  MAX_THROWS,
  VIEW,
  actionFront,
  buildLevel,
  chainStars,
  generateLevel,
  settled,
  stages,
  throwBall,
  type Stage,
} from "@/lib/chain-reaction"
import { useAuth, useKids } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { cn } from "@/lib/utils"
import { GameShell, KidButton } from "@/pages/kids/game-shell"

const gameInfo = kidsGames.find((g) => g.id === "butterfly")!
type Progress = Record<string, number> // "stage-level" → best stars
const key = (s: number, l: number) => `${s}-${l}`

/** Every verified level in play order. */
const order = butterflySeeds.slice().sort((a, b) => a.stage - b.stage || a.level - b.level)
const levelsOf = (stage: number) => order.filter((x) => x.stage === stage)

function readProgress(email: string | null): Progress {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(email, "butterfly.v2")) ?? "{}")
  } catch {
    return {}
  }
}

/** A level opens once the one before it (in play order) has any stars. */
function isOpen(p: Progress, info: SeedInfo) {
  const i = order.indexOf(info)
  return i <= 0 || (p[key(order[i - 1].stage, order[i - 1].level)] ?? 0) > 0
}

export default function ButterflyEffectPage() {
  const { email } = useAuth()
  const { award } = useKids()
  const [progress, setProgress] = useState(() => readProgress(email))
  const [stage, setStage] = useState<Stage | null>(null)
  const [level, setLevel] = useState<SeedInfo | null>(null)
  const [run, setRun] = useState(0)

  function finish(info: SeedInfo, stars: number) {
    const k = key(info.stage, info.level)
    const old = progress[k] ?? 0
    const next = { ...progress, [k]: Math.max(old, stars) }
    setProgress(next)
    try {
      localStorage.setItem(kidsKey(email, "butterfly.v2"), JSON.stringify(next))
    } catch {
      // ignore
    }
    const total = Object.values(next).reduce((a, b) => a + b, 0)
    award(gameInfo.id, Math.max(0, stars - old), Math.floor(total / order.length))
  }

  function nextLevel(info: SeedInfo) {
    const n = order[order.indexOf(info) + 1]
    if (!n) return
    setStage(stages[n.stage - 1])
    setLevel(n)
  }

  return (
    <GameShell game={gameInfo} round={0} total={1} score={0} wide hideProgress>
      {stage && level ? (
        <Play
          key={`${level.stage}-${level.level}-${run}`}
          stage={stage}
          info={level}
          hasNext={order.indexOf(level) < order.length - 1}
          onFinish={finish}
          onAgain={() => setRun((r) => r + 1)}
          onNext={() => nextLevel(level)}
          onBack={() => setLevel(null)}
        />
      ) : stage ? (
        <LevelPicker stage={stage} progress={progress} onPick={setLevel} onBack={() => setStage(null)} />
      ) : (
        <StagePicker progress={progress} onPick={setStage} />
      )}
    </GameShell>
  )
}

// =================================================================== pickers

function Stars({ n, of = 3, className }: { n: number; of?: number; className?: string }) {
  return (
    <span className={cn("ml-auto shrink-0 text-xl whitespace-nowrap", className)} aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} aria-hidden className={i < n ? "" : "opacity-30 grayscale"}>
          ⭐
        </span>
      ))}
    </span>
  )
}

const cardBase =
  "group relative flex min-h-[440px] flex-col overflow-hidden rounded-[34px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.16)] outline-none transition-transform focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50"

function StagePicker({ progress, onPick }: { progress: Progress; onPick: (s: Stage) => void }) {
  return (
    <div>
      <Reveal>
        <h2 className="text-4xl font-semibold">The Butterfly Effect 🦋</h2>
        <p className="mt-2 text-lg opacity-75">
          One tiny red ball, one giant chain reaction. The flower is far, far away — and rocks and glass are in the way!
        </p>
      </Reveal>
      <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {stages.map((st, i) => {
          const lv = levelsOf(st.id)
          const open = lv.length > 0 && isOpen(progress, lv[0])
          const done = lv.filter((x) => (progress[key(x.stage, x.level)] ?? 0) > 0).length
          const stars = lv.reduce((a, x) => a + (progress[key(x.stage, x.level)] ?? 0), 0)
          return (
            <Reveal key={st.id} delay={(i % 4) * 80} className="flex *:flex-1">
              <button
                type="button"
                disabled={!open}
                onClick={() => onPick(st)}
                className={cn(cardBase, st.tile, open ? "hover:-translate-y-1.5 active:translate-y-1" : "cursor-not-allowed opacity-55 grayscale-[40%]")}
              >
                <span aria-hidden className="absolute -top-4 -right-4 text-[130px] leading-none opacity-20">
                  🦋
                </span>
                <span className="relative flex items-center justify-between">
                  <span className="rounded-full bg-white/25 px-4 py-1.5 text-base font-semibold">
                    Stage {st.id}/5 · {lv.length} levels
                  </span>
                  {!open && (
                    <span className="flex size-11 items-center justify-center rounded-full bg-white/80 text-[#2B2140]">
                      <HugeiconsIcon icon={LockIcon} className="size-6" />
                    </span>
                  )}
                </span>
                <span aria-hidden className="relative my-6 self-center text-[110px] leading-none drop-shadow-[0_8px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110">
                  {st.emoji}
                </span>
                <span className="relative mt-auto rounded-[22px] bg-white/90 px-5 py-4 text-[#2B2140] shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                  <span className="block text-3xl leading-tight font-semibold whitespace-nowrap">{st.name}</span>
                  <span className="mt-1 block text-base font-medium opacity-75">{st.blurb}</span>
                  <span className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <span className="rounded-full bg-[#2B2140]/8 px-3 py-1 text-[15px] font-semibold whitespace-nowrap">
                      ✅ {done}/{lv.length} levels
                    </span>
                    <span className="text-lg font-semibold">⭐ {stars}/{lv.length * 3}</span>
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

function LevelPicker({
  stage,
  progress,
  onPick,
  onBack,
}: {
  stage: Stage
  progress: Progress
  onPick: (l: SeedInfo) => void
  onBack: () => void
}) {
  return (
    <div>
      <BackBar label="All stages" onBack={onBack} title={`${stage.emoji} ${stage.name}`} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {levelsOf(stage.id).map((info, i) => {
          const open = isOpen(progress, info)
          const spec = generateLevel(info.stage, info.level, info.seed)
          const rocks = spec.items.filter((it) => it.t === "rock" && it.x < spec.coverFrom).length
          return (
            <Reveal key={info.level} delay={(i % 4) * 80} className="flex *:flex-1">
              <button
                type="button"
                disabled={!open}
                onClick={() => onPick(info)}
                className={cn(cardBase, stage.tile, open ? "hover:-translate-y-1.5 active:translate-y-1" : "cursor-not-allowed opacity-55 grayscale-[40%]")}
              >
                <span className="relative flex items-center justify-between">
                  <span className="rounded-full bg-white/25 px-4 py-1.5 text-base font-semibold">
                    Level {info.level}/5
                  </span>
                  {!open && (
                    <span className="flex size-11 items-center justify-center rounded-full bg-white/80 text-[#2B2140]">
                      <HugeiconsIcon icon={LockIcon} className="size-6" />
                    </span>
                  )}
                </span>
                <span className="relative my-6 flex items-center justify-center gap-3 self-center" aria-hidden>
                  <span className="text-6xl">🔴</span>
                  <span className="text-3xl opacity-80">⋯⋯</span>
                  <span className="text-7xl transition-transform duration-300 group-hover:scale-110">🌷</span>
                </span>
                <span className="relative mt-auto rounded-[22px] bg-white/90 px-5 py-4 text-[#2B2140] shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                  <span className="block text-3xl leading-tight font-semibold">
                    {stage.name.split(" ")[0]} {info.level}
                  </span>
                  <span className="mt-1 block text-base font-medium opacity-75">
                    📏 {Math.round(spec.width / 100)} m course · 🧱 {spec.items.filter((it) => it.t === "domino").length} dominoes
                  </span>
                  <span className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <span className="rounded-full bg-[#2B2140]/8 px-3 py-1 text-[15px] font-semibold whitespace-nowrap">🪨 {rocks} in the way</span>
                    <Stars n={progress[key(info.stage, info.level)] ?? 0} />
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

function BackBar({ label, title, onBack, extra }: { label: string; title: string; onBack: () => void; extra?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-[15px] font-semibold shadow-[0_3px_0_rgba(0,0,0,0.06)] outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        {label}
      </button>
      <h2 className="text-3xl font-semibold">{title}</h2>
      {extra}
    </div>
  )
}

// =================================================================== play

type Status = "intro" | "play" | "won" | "lost"
type Controls = {
  throwAt: (x: number, y: number) => void
  aimAt: (p: { x: number; y: number } | null) => void
  replayIntro: () => void
  showHint: () => void
}

function Play({
  stage,
  info,
  hasNext,
  onFinish,
  onAgain,
  onNext,
  onBack,
}: {
  stage: Stage
  info: SeedInfo
  hasNext: boolean
  onFinish: (info: SeedInfo, stars: number) => void
  onAgain: () => void
  onNext: () => void
  onBack: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const controls = useRef<Controls | null>(null)
  const spec = useMemo(() => generateLevel(info.stage, info.level, info.seed), [info])
  const [thrown, setThrown] = useState(0)
  const [status, setStatus] = useState<Status>("intro")
  const [note, setNote] = useState("🌷 The flower is waaay over there…")
  const [stars, setStars] = useState(0)
  const finishLevel = useEffectEvent((s: number) => onFinish(info, s))

  useEffect(() => {
    const canvas = canvasRef.current!
    const wrap = wrapRef.current!
    const ctx = canvas.getContext("2d")!
    const built = buildLevel(spec)
    const maxCam = Math.max(0, spec.width - VIEW.w)
    const scene: Scene = {
      camX: maxCam,
      aim: null,
      canThrow: false,
      won: false,
      butterflies: [],
      sparks: [],
      trails: new Map(),
      time: 0,
      hintAim: null,
      front: null,
    }
    let used = 0
    let lastThrowAt = 0
    let quietSince = 0
    let finished = false
    let introStart = performance.now()
    let intro = true
    let raf = 0
    let last = performance.now()
    let acc = 0
    const STEP = 1000 / 60
    const INTRO_MS = Math.min(4200, 1200 + maxCam * 1.1)
    const sparked = new Set<object>()

    built.onEvent = (e) => {
      if (e === "pop") {
        for (const bl of built.balloons)
          if (bl.popped && !sparked.has(bl)) {
            sparked.add(bl)
            burstSparks(scene, bl.sensor.position)
          }
        setNote("Pop! 🎈 The next marble is free!")
      }
      if (e === "hit") setNote("It’s started! Follow the chain… 👀")
      if (e === "win" && !finished) {
        finished = true
        scene.won = true
        scene.canThrow = false
        burstButterflies(scene, built.flower.position)
        const s = chainStars(used)
        setStars(s)
        setNote("🌸 It bloomed! One tiny ball did all that!")
        setTimeout(() => setStatus("won"), 2200)
        finishLevel(s)
      }
    }

    const resize = () => {
      const w = wrap.clientWidth
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(((w * VIEW.h) / VIEW.w) * dpr)
      canvas.style.height = `${(w * VIEW.h) / VIEW.w}px`
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const endIntro = () => {
      if (!intro) return
      intro = false
      setStatus("play")
      setNote("Tap to throw the red ball! Aim for the dominoes on the tall tower.")
    }

    controls.current = {
      aimAt: (p) => (scene.aim = p),
      replayIntro: () => {
        if (used > 0 && !settled(built)) return
        intro = true
        introStart = performance.now()
        setStatus("intro")
        setNote("🌷 Here is the whole course…")
      },
      showHint: () => {
        scene.hintAim = { x: info.example[0], y: info.example[1] }
        setNote("💡 Try throwing at the yellow circle!")
      },
      throwAt: (x, y) => {
        if (intro) return endIntro()
        if (!scene.canThrow) return
        used++
        lastThrowAt = performance.now()
        setThrown(used)
        throwBall(built, { x, y })
        scene.hintAim = null
        setNote(used === 1 ? "Whoosh! 🔴" : `Ball ${used} of ${MAX_THROWS}…`)
      },
    }

    const frame = (now: number) => {
      acc += Math.min(now - last, 100)
      last = now
      while (acc >= STEP) {
        Matter.Engine.update(built.engine, STEP)
        stepEffects(scene)
        for (const b of built.balls) {
          const t = scene.trails.get(b) ?? []
          t.push({ ...b.position })
          if (t.length > 12) t.shift()
          scene.trails.set(b, t)
        }
        acc -= STEP
      }
      scene.time = now
      scene.front = actionFront(built)

      // ---- camera
      if (intro) {
        const t = Math.min(1, (now - introStart) / INTRO_MS)
        const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
        scene.camX = maxCam * (1 - ease)
        if (t >= 1) endIntro()
      } else {
        let target = 0
        if (scene.won) target = built.flower.position.x - VIEW.w * 0.55
        else if (scene.front !== null) {
          target = scene.front - VIEW.w * 0.45
          quietSince = now
        } else if (now - quietSince < 1200) target = scene.camX // pause a moment before flying home
        scene.camX += (Math.max(0, Math.min(maxCam, target)) - scene.camX) * 0.07
      }
      scene.canThrow = !intro && !finished && used < MAX_THROWS && scene.camX < 40 && scene.front === null

      // ---- out of balls?
      if (!finished && used >= MAX_THROWS && now - lastThrowAt > 2500 && scene.front === null && now - quietSince > 1500) {
        finished = true
        setStatus("lost")
        setNote("So close! Tiny changes make big differences — try again.")
      }

      const scale = canvas.width / VIEW.w
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      drawScene(ctx, stage, built, scene)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      Matter.World.clear(built.engine.world, false)
      Matter.Engine.clear(built.engine)
      controls.current = null
    }
  }, [spec, stage, info])

  function toWorld(e: PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * VIEW.w, y: ((e.clientY - r.top) / r.height) * VIEW.h }
  }

  const ballsLeft = MAX_THROWS - thrown
  const hudBtn =
    "pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-white/90 px-4 text-[15px] font-semibold text-[#2B2140] shadow outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"

  return (
    <div>
      <BackBar
        label={`${stage.name}`}
        title={`${stage.emoji} Level ${info.level}`}
        onBack={onBack}
        extra={
          <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold dark:bg-white/10">
            📏 {Math.round(spec.width / 100)} m to the flower
          </span>
        }
      />

      <div className="relative overflow-hidden rounded-[32px] border-8 border-white/80 bg-white shadow-[0_10px_0_rgba(43,33,64,0.1)] dark:border-white/10 dark:bg-[#1E1B2E]">
        <div ref={wrapRef} className="w-full">
          <canvas
            ref={canvasRef}
            className="block w-full cursor-crosshair touch-none select-none"
            aria-label="Game area: tap to throw the red ball"
            onPointerMove={(e) => controls.current?.aimAt(toWorld(e))}
            onPointerLeave={() => controls.current?.aimAt(null)}
            onPointerDown={(e) => {
              const p = toWorld(e)
              controls.current?.aimAt(p)
              controls.current?.throwAt(p.x, p.y)
            }}
          />
        </div>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-lg font-semibold text-[#2B2140] shadow">
            <span className="text-sm">Balls:</span>
            {Array.from({ length: MAX_THROWS }, (_, i) => (
              <span key={i} className={cn("size-4 rounded-full transition-all", i < ballsLeft ? "bg-[#D62828]" : "scale-75 bg-[#D62828]/20")} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" className={hudBtn} onClick={() => controls.current?.showHint()}>
              <HugeiconsIcon icon={Idea01Icon} className="size-4" /> Hint
            </button>
            <button type="button" className={hudBtn} onClick={() => controls.current?.replayIntro()}>
              <HugeiconsIcon icon={ViewIcon} className="size-4" /> Look
            </button>
            <button type="button" className={hudBtn} onClick={onAgain}>
              <HugeiconsIcon icon={RefreshIcon} className="size-4" /> Reset
            </button>
          </div>
        </div>
        {status === "intro" && (
          <p className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 animate-bubble-in rounded-full bg-white/90 px-5 py-2 text-lg font-semibold text-[#2B2140] shadow">
            Tap to skip ⏩
          </p>
        )}

        {/* result */}
        {(status === "won" || status === "lost") && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#14121F]/35 p-4 backdrop-blur-[1px]">
            <div className="w-full max-w-[440px] animate-kid-pop rounded-[28px] bg-white p-7 text-center text-[#2B2140] shadow-2xl dark:bg-[#1E1B2E] dark:text-[#F3EEFF]">
              {status === "won" ? (
                <>
                  <p className="text-6xl" aria-hidden>
                    🦋
                  </p>
                  <p className="mt-2 text-4xl font-semibold">Butterfly effect!</p>
                  <p className="mt-1 text-lg opacity-75">
                    One tiny ball travelled {Math.round(spec.width / 100)} m and made the flower bloom
                    {thrown === 1 ? " — first try!" : "."}
                  </p>
                  <Stars n={stars} className="mt-4 block text-4xl" />
                </>
              ) : (
                <>
                  <p className="text-6xl" aria-hidden>
                    🌱
                  </p>
                  <p className="mt-2 text-4xl font-semibold">Almost!</p>
                  <p className="mt-1 text-lg opacity-75">Small changes make big differences. Use 💡 Hint to see a good spot.</p>
                </>
              )}
              <div className="mt-6 flex flex-col gap-3">
                {status === "won" && hasNext && (
                  <KidButton onClick={onNext} className={cn("gap-2 bg-linear-to-br text-white", stage.tile)}>
                    Next level <HugeiconsIcon icon={ArrowRight02Icon} className="size-6" />
                  </KidButton>
                )}
                {status === "won" && !hasNext && <p className="text-xl font-semibold">👑 You finished all 25 levels!</p>}
                <KidButton onClick={onAgain} className="bg-[#F1ECFF] text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white">
                  {status === "won" ? "Play again" : "Try again"}
                </KidButton>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xl font-semibold" aria-live="polite">
        {note}
      </p>
      <p className="mt-1 text-center text-sm opacity-60">
        ⭐⭐⭐ on the first ball · the red ball can’t touch the flower itself — the chain has to reach it!
      </p>
    </div>
  )
}
