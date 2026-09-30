import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Idea01Icon,
  LockIcon,
  PlayIcon,
  RefreshIcon,
  StopIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import { CodeEditor, type CodeEditorHandle } from "@/components/python/code-editor"
import { IslandBoard } from "@/components/python/island-board"
import { Reveal } from "@/components/motion/reveal"
import { kidsGames } from "@/data/kids-games"
import { useAuth, useKids } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { levels, parseMap, questStars, simulate, type Level, type Pos, type QuestResult } from "@/lib/python-quest"
import { cn } from "@/lib/utils"
import { GameShell, KidButton } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "python")!

type Progress = { stars: Record<number, number>; code: Record<number, string> }

function readProgress(email: string | null): Progress {
  try {
    return { stars: {}, code: {}, ...JSON.parse(localStorage.getItem(kidsKey(email, "python")) ?? "{}") }
  } catch {
    return { stars: {}, code: {} }
  }
}

function saveProgress(email: string | null, p: Progress) {
  try {
    localStorage.setItem(kidsKey(email, "python"), JSON.stringify(p))
  } catch {
    // ignore
  }
}

const unlocked = (p: Progress, id: number) => id === 1 || (p.stars[id - 1] ?? 0) > 0

export default function PythonQuestPage() {
  const { email } = useAuth()
  const { award } = useKids()
  const [progress, setProgress] = useState(() => readProgress(email))
  const [levelId, setLevelId] = useState<number | null>(null)

  function complete(level: Level, stars: number, code: string) {
    const old = progress.stars[level.id] ?? 0
    const next: Progress = {
      stars: { ...progress.stars, [level.id]: Math.max(old, stars) },
      code: { ...progress.code, [level.id]: code },
    }
    setProgress(next)
    saveProgress(email, next)
    // only the improvement counts, so replaying can't farm stars;
    // the tile shows the average over all levels (3★ = everything mastered)
    const total = Object.values(next.stars).reduce((a, b) => a + b, 0)
    award(game.id, Math.max(0, stars - old), Math.floor(total / levels.length))
  }

  function saveCode(level: Level, code: string) {
    const next = { ...progress, code: { ...progress.code, [level.id]: code } }
    setProgress(next)
    saveProgress(email, next)
  }

  const level = levels.find((l) => l.id === levelId)

  return (
    <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
      {level ? (
        <LevelPlay
          key={level.id}
          level={level}
          savedCode={progress.code[level.id]}
          bestStars={progress.stars[level.id] ?? 0}
          hasNext={levels.some((l) => l.id === level.id + 1)}
          onComplete={complete}
          onSaveCode={saveCode}
          onNext={() => setLevelId(level.id + 1)}
          onMap={() => setLevelId(null)}
        />
      ) : (
        <LevelMap progress={progress} onPick={setLevelId} />
      )}
    </GameShell>
  )
}

// =================================================================== level map

function LevelMap({ progress, onPick }: { progress: Progress; onPick: (id: number) => void }) {
  const earned = Object.values(progress.stars).reduce((a, b) => a + b, 0)
  return (
    <div>
      <Reveal className="flex flex-col gap-6 rounded-[32px] bg-white/80 p-6 shadow-[0_8px_0_rgba(43,33,64,0.06)] sm:flex-row sm:items-center sm:p-8 dark:bg-white/5">
        <span aria-hidden className="animate-kid-float text-7xl">
          🐍
        </span>
        <div className="flex-1">
          <h2 className="text-4xl font-semibold">Learn Python with Monty!</h2>
          <p className="mt-2 text-lg opacity-75">
            Write real Python code to guide Monty the python across the island. Every level teaches something new.
          </p>
        </div>
        <div className="rounded-[20px] bg-[#FFF1D6] px-5 py-3 text-center dark:bg-white/10">
          <p className="text-3xl font-semibold">⭐ {earned}</p>
          <p className="text-sm opacity-70">of {levels.length * 3} stars</p>
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
        {levels.map((l, i) => {
          const open = unlocked(progress, l.id)
          const stars = progress.stars[l.id] ?? 0
          return (
            <Reveal key={l.id} delay={(i % 5) * 70} className="flex *:flex-1">
              <button
                type="button"
                disabled={!open}
                onClick={() => onPick(l.id)}
                className={cn(
                  "group flex flex-col rounded-[26px] p-5 text-left shadow-[0_6px_0_rgba(0,0,0,0.12)] outline-none transition-transform focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50",
                  open
                    ? "bg-linear-to-br from-[#3E8E5E] to-[#1F6B4F] text-white hover:-translate-y-1 active:translate-y-0.5"
                    : "cursor-not-allowed bg-white/60 opacity-60 dark:bg-white/5"
                )}
              >
                <span className="flex items-center justify-between">
                  <span className={cn("flex size-10 items-center justify-center rounded-full text-lg font-bold", open ? "bg-white/25" : "bg-black/10 dark:bg-white/10")}>
                    {open ? l.id : <HugeiconsIcon icon={LockIcon} className="size-5" />}
                  </span>
                  <span className="text-lg" aria-label={`${stars} of 3 stars`}>
                    {[1, 2, 3].map((n) => (
                      <span key={n} aria-hidden className={n <= stars ? "" : "opacity-30 grayscale"}>
                        ⭐
                      </span>
                    ))}
                  </span>
                </span>
                <span className="mt-4 text-xl font-semibold">{l.title}</span>
                <span className={cn("mt-1 w-fit rounded-full px-2.5 py-0.5 font-mono text-sm", open ? "bg-black/20" : "bg-black/5 dark:bg-white/10")}>
                  {l.concept}
                </span>
              </button>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}

// =================================================================== one level

type Status = { kind: "idle" | "running" | "error" | "fail" | "success"; message?: string; stars?: number }

function LevelPlay({
  level,
  savedCode,
  bestStars,
  hasNext,
  onComplete,
  onSaveCode,
  onNext,
  onMap,
}: {
  level: Level
  savedCode?: string
  bestStars: number
  hasNext: boolean
  onComplete: (level: Level, stars: number, code: string) => void
  onSaveCode: (level: Level, code: string) => void
  onNext: () => void
  onMap: () => void
}) {
  const [world] = useState(() => parseMap(level.map))
  const [code, setCode] = useState(savedCode ?? level.starter)
  const [monty, setMonty] = useState<Pos>(world.start)
  const [facingLeft, setFacingLeft] = useState(false)
  const [collected, setCollected] = useState<Set<string>>(new Set())
  const [bubble, setBubble] = useState<string | null>(null)
  const [bumped, setBumped] = useState(false)
  const [output, setOutput] = useState<string[]>([])
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [errorLine, setErrorLine] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [fast, setFast] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [usedSolution, setUsedSolution] = useState(false)
  const [fails, setFails] = useState(0)
  const editor = useRef<CodeEditorHandle>(null)
  const runId = useRef(0)

  const stepMs = fast ? 140 : 340
  const running = status.kind === "running"

  function resetBoard() {
    setMonty(world.start)
    setFacingLeft(false)
    setCollected(new Set())
    setBubble(null)
    setBumped(false)
    setOutput([])
    setActiveLine(null)
    setErrorLine(null)
  }

  function stop() {
    runId.current++
    setStatus({ kind: "idle" })
    setActiveLine(null)
  }

  async function runCode() {
    if (running) return
    const id = ++runId.current
    onSaveCode(level, code)
    resetBoard()
    setStatus({ kind: "running" })
    const result: QuestResult = simulate(level, code)
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const alive = () => id === runId.current

    // play every step so the child can watch their code run, line by line
    await wait(150)
    const seen = new Set<string>()
    for (const e of result.events) {
      if (!alive()) return
      setActiveLine(e.line)
      if (e.k === "move") {
        if (e.dir === "left") setFacingLeft(true)
        if (e.dir === "right") setFacingLeft(false)
        setMonty(e.to)
        if (e.gem) {
          seen.add(`${e.to.x},${e.to.y}`)
          const snapshot = new Set(seen)
          setTimeout(() => alive() && setCollected(snapshot), stepMs * 0.6)
        }
        await wait(stepMs + 40)
      } else {
        if (e.k === "print") setOutput((o) => [...o, e.text])
        setBubble(e.text || " ")
        await wait(fast ? 350 : 750)
      }
    }
    if (!alive()) return
    setActiveLine(null)

    if (result.error) {
      setErrorLine(result.error.line)
      if (result.error.kind === "Bump") setBumped(true)
      setFails((f) => f + 1)
      setStatus({ kind: "error", message: result.error.message })
      return
    }
    if (!result.success) {
      setFails((f) => f + 1)
      setStatus({ kind: "fail", message: result.message })
      return
    }
    const stars = questStars(result, level, usedSolution)
    if (level.map) setBubble("Yum! 🍎")
    setStatus({ kind: "success", message: result.message, stars })
    onComplete(level, stars, code)
  }

  function showSolution() {
    setUsedSolution(true)
    setCode(level.solution)
    resetBoard()
    setStatus({ kind: "idle" })
  }

  return (
    <div>
      {/* header */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onMap}
          className="flex h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-[15px] font-semibold shadow-[0_3px_0_rgba(0,0,0,0.06)] outline-none hover:bg-white focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          All levels
        </button>
        <h2 className="text-3xl font-semibold">
          Level {level.id}: {level.title}
        </h2>
        {bestStars > 0 && (
          <span className="text-xl" aria-label={`Best: ${bestStars} of 3 stars`}>
            {"⭐".repeat(bestStars)}
          </span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ---------------- left: lesson + island */}
        <div className="flex flex-col gap-5">
          <Reveal className="rounded-[28px] bg-white/80 p-6 shadow-[0_8px_0_rgba(43,33,64,0.06)] dark:bg-white/5">
            <span className="rounded-full bg-[#6C63FF] px-3 py-1 font-mono text-sm font-semibold text-white">{level.concept}</span>
            <p className="mt-3 text-lg leading-relaxed">{level.lesson}</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-[#FBF8F1] px-4 py-3 font-mono text-[16px] leading-7 dark:bg-[#0F0D18]">
              {level.example}
            </pre>
            <p className="mt-4 text-lg font-semibold whitespace-pre-line">🎯 {level.task}</p>
            {level.map && (
              <p className="mt-1 text-sm opacity-70">
                ⭐⭐⭐ Solve it in {level.par} line{level.par > 1 ? "s" : ""} or fewer.
              </p>
            )}
          </Reveal>

          {level.map && (
            <IslandBoard
              world={world}
              monty={monty}
              facingLeft={facingLeft}
              collected={collected}
              bubble={bubble}
              bumped={bumped}
              won={status.kind === "success"}
              stepMs={stepMs}
            />
          )}
          {level.expectedOutput && (
            <div className="grid grid-cols-2 gap-4">
              <OutputBox title="Your goal" lines={level.expectedOutput} tone="goal" />
              <OutputBox title="Your output" lines={output} tone={status.kind === "success" ? "ok" : "plain"} />
            </div>
          )}
        </div>

        {/* ---------------- right: code */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2" aria-label="Insert code">
            {level.snippets.map((s) => (
              <button
                key={s}
                type="button"
                disabled={running}
                onClick={() => editor.current?.insert(s)}
                className="rounded-xl bg-white/85 px-3 py-2 font-mono text-[15px] shadow-[0_3px_0_rgba(0,0,0,0.06)] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 active:translate-y-0.5 disabled:opacity-50 dark:bg-white/10"
              >
                + {s}
              </button>
            ))}
          </div>

          <CodeEditor
            ref={editor}
            value={code}
            onChange={(v) => {
              setCode(v)
              if (status.kind !== "running") {
                setErrorLine(null)
                if (status.kind !== "idle") setStatus({ kind: "idle" })
              }
            }}
            onRun={runCode}
            activeLine={activeLine}
            errorLine={errorLine}
            readOnly={running}
          />

          <div className="flex flex-wrap items-center gap-3">
            {running ? (
              <KidButton onClick={stop} className="h-14 gap-2 bg-[#FF5E7E] px-6 text-white">
                <HugeiconsIcon icon={StopIcon} className="size-6" /> Stop
              </KidButton>
            ) : (
              <KidButton onClick={runCode} className="h-14 gap-2 bg-linear-to-br from-[#3E8E5E] to-[#1F6B4F] px-7 text-white">
                <HugeiconsIcon icon={PlayIcon} className="size-6" /> Run
              </KidButton>
            )}
            <KidButton
              onClick={() => {
                stop()
                resetBoard()
              }}
              className="h-14 gap-2 bg-white px-5 text-lg text-[#2B2140] shadow-[0_5px_0_rgba(0,0,0,0.08)] dark:bg-white/10 dark:text-white"
            >
              <HugeiconsIcon icon={RefreshIcon} className="size-5" /> Reset
            </KidButton>
            <button
              type="button"
              onClick={() => setFast((f) => !f)}
              aria-pressed={fast}
              className="h-14 rounded-[20px] px-4 text-lg font-semibold opacity-80 outline-none hover:opacity-100 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
              title="Animation speed"
            >
              {fast ? "🐇 Fast" : "🐢 Slow"}
            </button>
            <span className="ml-auto hidden text-sm opacity-60 sm:inline">Ctrl + Enter to run</span>
          </div>

          <StatusPanel status={status} />

          {!level.expectedOutput && output.length > 0 && <OutputBox title="Output" lines={output} tone="plain" />}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="flex items-center gap-2 rounded-full bg-[#FFF1D6] px-4 py-2 text-[15px] font-semibold text-[#8B5A2B] outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10 dark:text-[#FFD166]"
            >
              <HugeiconsIcon icon={Idea01Icon} className="size-5" />
              {showHint ? "Hide hint" : "Hint"}
            </button>
            {fails >= 2 && (
              <button
                type="button"
                onClick={showSolution}
                className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-[15px] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10"
              >
                <HugeiconsIcon icon={ViewIcon} className="size-5" />
                Show me the answer (1★)
              </button>
            )}
          </div>
          {showHint && <p className="rounded-2xl bg-[#FFF1D6] px-4 py-3 text-lg animate-bubble-in dark:bg-white/10">💡 {level.hint}</p>}

          {status.kind === "success" && (
            <div className="flex flex-wrap gap-3">
              {hasNext ? (
                <KidButton onClick={onNext} className="gap-2 bg-linear-to-br from-[#FFD166] to-[#F7A928] text-[#2B2140]">
                  Next level <HugeiconsIcon icon={ArrowRight02Icon} className="size-6" />
                </KidButton>
              ) : (
                <p className="text-xl font-semibold">🏆 You finished Python Quest! You’re a real coder!</p>
              )}
              <KidButton onClick={onMap} className="bg-[#F1ECFF] text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white">
                All levels
              </KidButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusPanel({ status }: { status: Status }) {
  if (status.kind === "idle")
    return <p className="rounded-2xl bg-white/60 px-4 py-3 text-lg opacity-80 dark:bg-white/5">Write your code, then press ▶ Run.</p>
  if (status.kind === "running")
    return <p className="rounded-2xl bg-[#FFF6D6] px-4 py-3 text-lg dark:bg-white/10">🏃 Running your code… watch the yellow line!</p>
  const tone =
    status.kind === "success"
      ? "bg-[#DDF7EF] text-[#16664A] dark:bg-[#2BC0A4]/20 dark:text-[#8BF0CF]"
      : status.kind === "error"
        ? "bg-[#FFE4EA] text-[#B0223F] dark:bg-[#FF5E7E]/15 dark:text-[#FF9DB2]"
        : "bg-[#FFF1D6] text-[#8B5A2B] dark:bg-[#FFD166]/15 dark:text-[#FFD166]"
  return (
    <div role="status" aria-live="polite" className={cn("animate-bubble-in rounded-2xl px-5 py-4 text-lg font-semibold", tone)}>
      {status.kind === "error" && <span className="mr-1">🐞</span>}
      {status.message}
      {status.kind === "success" && status.stars !== undefined && (
        <span className="mt-2 flex gap-1 text-3xl" aria-label={`${status.stars} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <span key={n} aria-hidden className={cn("animate-kid-pop", n > status.stars! && "opacity-25 grayscale")} style={{ animationDelay: `${n * 0.12}s` }}>
              ⭐
            </span>
          ))}
        </span>
      )}
    </div>
  )
}

function OutputBox({ title, lines, tone }: { title: string; lines: string[]; tone: "goal" | "ok" | "plain" }) {
  return (
    <div
      className={cn(
        "rounded-[20px] p-4 font-mono",
        tone === "goal" ? "bg-[#2B2140] text-[#FFD166]" : tone === "ok" ? "bg-[#DDF7EF] text-[#16664A] dark:bg-[#2BC0A4]/20 dark:text-[#8BF0CF]" : "bg-[#1E1B2E] text-[#E9E4FF]"
      )}
    >
      <p className="mb-2 font-kids text-sm font-semibold opacity-70">{title}</p>
      <pre className="min-h-8 text-lg leading-7 whitespace-pre-wrap" data-lenis-prevent>
        {lines.length ? lines.join("\n") : " "}
      </pre>
    </div>
  )
}
