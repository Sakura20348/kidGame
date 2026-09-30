import { useEffect, useEffectEvent, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Delete02Icon, Idea01Icon, RefreshIcon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { kidsGames } from "@/data/kids-games"
import { useAuth, useKids } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { boxOf, clashes, makePuzzle, type Grid, type Puzzle, type Size } from "@/lib/sudoku"
import { cn } from "@/lib/utils"
import { GameShell, KidButton } from "@/pages/kids/game-shell"
import { Scrabble } from "@/pages/kids/scrabble"

const game = kidsGames.find((g) => g.id === "sudoku")!

// Rasmlar (pictures) mode: one fruit per number
const PICS = ["", "🍎", "🍌", "🍇", "🍓", "🍊", "🍉", "🥝", "🍒", "🍍"]

const levels: { size: Size; name: string; text: string; tile: string }[] = [
  { size: 4, name: "Oson", text: "1 dan 4 gacha raqamlar", tile: "from-[#6FCF97] to-[#2F8F68]" },
  { size: 6, name: "Oʻrta", text: "1 dan 6 gacha raqamlar", tile: "from-[#7FB2FF] to-[#3E6FD8]" },
  { size: 9, name: "Qiyin", text: "1 dan 9 gacha raqamlar", tile: "from-[#B79CFF] to-[#6A5ACD]" },
]

type Progress = Record<number, number> // size → best stars

function readProgress(email: string | null): Progress {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(email, "sudoku")) ?? "{}")
  } catch {
    return {}
  }
}

/** 0 xato/maslahat = 3★, 2 tagacha = 2★, qolgan hollarda = 1★. */
const sudokuStars = (slips: number) => (slips === 0 ? 3 : slips <= 2 ? 2 : 1)

export default function SudokuPage() {
  const { email } = useAuth()
  const { award } = useKids()
  const [progress, setProgress] = useState(() => readProgress(email))
  const [size, setSize] = useState<Size | null>(null)
  const [pics, setPics] = useState(false)
  const [run, setRun] = useState(0)

  function finish(s: Size, stars: number) {
    const old = progress[s] ?? 0
    const next = { ...progress, [s]: Math.max(old, stars) }
    setProgress(next)
    try {
      localStorage.setItem(kidsKey(email, "sudoku"), JSON.stringify(next))
    } catch {
      // ignore
    }
    award(game.id, stars)
  }

  // two games here: Sudoku, and Scrabble against the computer (English)
  const [params, setParams] = useSearchParams()
  const mode = params.get("mode") === "scrabble" ? "scrabble" : "sudoku"
  const modeSwitch = (
    <div role="tablist" aria-label="O‘yin" className="mb-5 flex w-fit gap-1 rounded-full bg-white p-1.5 shadow-[0_4px_0_rgba(0,0,0,0.06)] dark:bg-white/10">
      {[
        { id: "sudoku", label: "🧩 Sudoku" },
        { id: "scrabble", label: "🔤 Scrabble" },
      ].map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={mode === m.id}
          onClick={() => setParams(m.id === "sudoku" ? {} : { mode: m.id }, { replace: true })}
          className={cn(
            "h-11 rounded-full px-5 text-[16px] font-semibold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40",
            mode === m.id ? "bg-linear-to-br from-[#7FB2FF] to-[#6A5ACD] text-white" : "text-[#2B2140]/70 hover:text-[#2B2140] dark:text-white/70"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )

  if (mode === "scrabble") {
    return (
      <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
        {modeSwitch}
        <Scrabble />
      </GameShell>
    )
  }

  return (
    <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
      {modeSwitch}
      {size ? (
        <Board key={`${size}-${run}`} size={size} pics={pics} onPics={setPics} onFinish={finish} onNew={() => setRun((r) => r + 1)} onBack={() => setSize(null)} />
      ) : (
        <div>
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-4xl font-semibold">Sudoku 🧩</h2>
              <p className="mt-2 text-lg opacity-75">
                Har bir qator, ustun va qutida har bir raqam faqat <b>bir marta</b> boʻlishi kerak.
              </p>
            </div>
            <ModeSwitch pics={pics} onPics={setPics} />
          </Reveal>
          <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {levels.map((l, i) => {
              const stars = progress[l.size] ?? 0
              return (
                <Reveal key={l.size} delay={i * 90} className="flex *:flex-1">
                  <button
                    type="button"
                    onClick={() => setSize(l.size)}
                    className={cn(
                      "group relative flex min-h-[440px] flex-col overflow-hidden rounded-[34px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.16)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-1",
                      l.tile
                    )}
                  >
                    <span className="relative w-fit rounded-full bg-white/25 px-4 py-1.5 text-base font-semibold">
                      {l.size}×{l.size} katak
                    </span>
                    <MiniBoard size={l.size} pics={pics} />
                    <span className="relative mt-auto rounded-[22px] bg-white/90 px-5 py-4 text-[#2B2140] shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                      <span className="block text-3xl leading-tight font-semibold">{l.name}</span>
                      <span className="mt-1 block text-base font-medium opacity-75">{pics ? `${l.size} xil meva rasmlari` : l.text}</span>
                      <span className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                        <span className="rounded-full bg-[#2B2140]/8 px-3 py-1 text-[15px] font-semibold whitespace-nowrap">🧠 Mantiq</span>
                        <span className="ml-auto shrink-0 text-xl whitespace-nowrap" aria-label={`${stars} yulduz`}>
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
      )}
    </GameShell>
  )
}

function ModeSwitch({ pics, onPics }: { pics: boolean; onPics: (v: boolean) => void }) {
  return (
    <div role="radiogroup" aria-label="Belgilar" className="flex w-fit gap-1 rounded-[18px] bg-white/80 p-1.5 shadow-[0_4px_0_rgba(0,0,0,0.06)] dark:bg-white/5">
      {[
        [false, "🔢 Raqamlar"],
        [true, "🍎 Rasmlar"],
      ].map(([v, label]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={pics === v}
          onClick={() => onPics(v as boolean)}
          className={cn(
            "h-11 rounded-[14px] px-4 text-lg font-semibold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40",
            pics === v ? "bg-[#6C63FF] text-white" : "opacity-70 hover:opacity-100"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/** Decorative preview board on the level cards. */
function MiniBoard({ size, pics }: { size: Size; pics: boolean }) {
  const [p] = useState(() => makePuzzle(size))
  const { r, c } = boxOf(size)
  return (
    <span aria-hidden className="relative my-6 grid self-center overflow-hidden rounded-xl bg-white/90 p-1 text-[#2B2140] shadow-lg" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, width: size === 9 ? 198 : size === 6 ? 180 : 150 }}>
      {p.start.map((v, i) => {
        const row = Math.floor(i / size)
        const col = i % size
        return (
          <span
            key={i}
            className={cn(
              "flex aspect-square items-center justify-center border-[#2B2140]/15 font-bold",
              size === 9 ? "text-[11px]" : size === 6 ? "text-base" : "text-xl",
              (col + 1) % c === 0 && col < size - 1 ? "border-r-2 border-r-[#2B2140]/50" : "border-r",
              (row + 1) % r === 0 && row < size - 1 ? "border-b-2 border-b-[#2B2140]/50" : "border-b"
            )}
          >
            {v ? (pics ? PICS[v] : v) : ""}
          </span>
        )
      })}
    </span>
  )
}

// =================================================================== board

function Board({
  size,
  pics,
  onPics,
  onFinish,
  onNew,
  onBack,
}: {
  size: Size
  pics: boolean
  onPics: (v: boolean) => void
  onFinish: (s: Size, stars: number) => void
  onNew: () => void
  onBack: () => void
}) {
  const [puzzle] = useState<Puzzle>(() => makePuzzle(size))
  const [grid, setGrid] = useState<Grid>(() => puzzle.start.slice())
  const [selected, setSelected] = useState<number | null>(() => puzzle.start.indexOf(0))
  const [mistakes, setMistakes] = useState(0)
  const [hints, setHints] = useState(0)
  const [message, setMessage] = useState("Katakni tanlang, keyin raqamni bosing.")
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [done, setDone] = useState(false)
  const [stars, setStars] = useState(0)
  const { r, c } = boxOf(size)

  // timer (stops when solved)
  useEffect(() => {
    if (done) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [done])

  const given = (i: number) => puzzle.start[i] !== 0
  const secs = Math.floor((now - startedAt) / 1000)
  const time = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
  const show = (v: number) => (v ? (pics ? PICS[v] : String(v)) : "")

  function place(v: number, i = selected, extraHints = 0) {
    if (i === null || done || given(i)) return
    const next = grid.slice()
    next[i] = v
    setGrid(next)
    if (v === 0) return setMessage("Oʻchirildi.")
    if (v !== puzzle.solution[i]) {
      setMistakes((m) => m + 1)
      setMessage("Bu yerga toʻgʻri kelmaydi — qator, ustun yoki qutini tekshiring. 🤔")
      return
    }
    setMessage("Toʻgʻri! 👍")
    if (next.every((x, k) => x === puzzle.solution[k])) {
      const s = sudokuStars(mistakes + hints + extraHints)
      setStars(s)
      setDone(true)
      setMessage("Barakalla! 🎉 Sudoku yechildi!")
      onFinish(size, s)
    }
  }

  function hint() {
    if (done) return
    // the selected empty/wrong cell, otherwise the first one that needs help
    const i = selected !== null && !given(selected) && grid[selected] !== puzzle.solution[selected] ? selected : grid.findIndex((v, k) => v !== puzzle.solution[k])
    if (i === -1) return
    setHints((h) => h + 1)
    setSelected(i)
    place(puzzle.solution[i], i, 1)
    setMessage("Maslahat: shu katakka toʻgʻri javob qoʻyildi. 💡")
  }

  // Keyboard works anywhere on the page while the game is open
  // (not only when the board has focus).
  const onKey = useEffectEvent((e: globalThis.KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    if (target?.closest("input, textarea, select, [contenteditable]")) return
    if (e.ctrlKey || e.metaKey || e.altKey || done) return
    if (selected === null) {
      if (e.key.startsWith("Arrow")) setSelected(0)
      return
    }
    const row = Math.floor(selected / size)
    const col = selected % size
    const move: Record<string, number> = {
      ArrowUp: row > 0 ? selected - size : selected,
      ArrowDown: row < size - 1 ? selected + size : selected,
      ArrowLeft: col > 0 ? selected - 1 : selected,
      ArrowRight: col < size - 1 ? selected + 1 : selected,
    }
    if (e.key in move) {
      e.preventDefault()
      setSelected(move[e.key])
    } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= size) {
      e.preventDefault()
      place(Number(e.key))
    } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
      e.preventDefault()
      place(0)
    } else if (e.key === "h" || e.key === "H") {
      hint()
    }
  })

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => onKey(e)
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const selRow = selected === null ? -1 : Math.floor(selected / size)
  const selCol = selected === null ? -1 : selected % size
  const sameBox = (i: number) =>
    selected !== null &&
    Math.floor(Math.floor(i / size) / r) === Math.floor(selRow / r) &&
    Math.floor((i % size) / c) === Math.floor(selCol / c)
  const selValue = selected === null ? 0 : grid[selected]

  const cellText = size === 9 ? "text-[min(6.5cqw,34px)]" : size === 6 ? "text-[min(9cqw,44px)]" : "text-[min(13cqw,60px)]"
  // how many of each number are still missing (hide finished ones on the pad)
  const left = (v: number) => size - grid.filter((x, k) => x === v && x === puzzle.solution[k]).length

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-[15px] font-semibold shadow-[0_3px_0_rgba(0,0,0,0.06)] outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          Orqaga
        </button>
        <h2 className="text-3xl font-semibold">
          Sudoku {size}×{size} · {levels.find((l) => l.size === size)!.name}
        </h2>
        <ModeSwitch pics={pics} onPics={onPics} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)]">
        {/* ---------------- the grid */}
        <div
          aria-label="Sudoku taxtasi: strelkalar bilan yuring, raqam bilan yozing"
          className="@container mx-auto w-full max-w-[620px] self-start rounded-[26px] bg-[#2B2140] p-2 shadow-[0_10px_0_rgba(0,0,0,0.15)] outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 dark:bg-[#0B0A14]"
        >
          <div
            className="grid aspect-square w-full overflow-hidden rounded-[18px] bg-white dark:bg-[#1E1B2E]"
            // equal rows AND columns, so every cell is a square and no row gets cut off
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {grid.map((v, i) => {
              const row = Math.floor(i / size)
              const col = i % size
              const isSel = i === selected
              const wrong = v !== 0 && !given(i) && v !== puzzle.solution[i]
              const related = selected !== null && (row === selRow || col === selCol || sameBox(i))
              const sameVal = v !== 0 && v === selValue
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-label={`${row + 1}-qator, ${col + 1}-ustun${v ? `: ${v}` : ", boʻsh"}`}
                  className={cn(
                    "flex min-h-0 min-w-0 items-center justify-center overflow-hidden border-[#2B2140]/15 leading-none outline-none transition-colors dark:border-white/10",
                    cellText,
                    (col + 1) % c === 0 && col < size - 1 ? "border-r-[3px] border-r-[#2B2140] dark:border-r-white/60" : "border-r",
                    (row + 1) % r === 0 && row < size - 1 ? "border-b-[3px] border-b-[#2B2140] dark:border-b-white/60" : "border-b",
                    isSel ? "bg-[#FFD166] dark:bg-[#8A6A1E]" : sameVal ? "bg-[#FFF1C2] dark:bg-[#6C5A1E]/60" : related ? "bg-[#EEEAFF] dark:bg-white/8" : "",
                    given(i) ? "font-bold text-[#2B2140] dark:text-white" : wrong ? "animate-kid-shake font-semibold text-[#E5484D]" : "font-semibold text-[#6C63FF] dark:text-[#B9B3FF]",
                    done && "animate-kid-pop"
                  )}
                  style={done ? { animationDelay: `${(row + col) * 30}ms` } : undefined}
                >
                  {show(v)}
                  {wrong && clashes(grid, size, i) && <span className="sr-only"> (takrorlanmoqda)</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* ---------------- controls */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ["⏱️", time, "Vaqt"],
              ["❌", String(mistakes), "Xatolar"],
              ["💡", String(hints), "Maslahatlar"],
            ].map(([e, v, l]) => (
              <div key={l} className="rounded-[18px] bg-white/80 p-3 shadow-[0_4px_0_rgba(0,0,0,0.05)] dark:bg-white/5">
                <p className="text-2xl font-semibold tabular-nums">
                  <span aria-hidden>{e}</span> {v}
                </p>
                <p className="text-sm opacity-70">{l}</p>
              </div>
            ))}
          </div>

          <p className="min-h-16 rounded-[18px] bg-white/80 px-5 py-4 text-lg font-semibold shadow-[0_4px_0_rgba(0,0,0,0.05)] dark:bg-white/5" aria-live="polite">
            {message}
          </p>

          {done ? (
            <div className="animate-kid-pop rounded-[24px] bg-white p-6 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] dark:bg-white/5">
              <p className="text-4xl font-semibold">🎉 Barakalla!</p>
              <p className="mt-1 text-lg opacity-75">
                Vaqt: {time} · Xatolar: {mistakes} · Maslahatlar: {hints}
              </p>
              <p className="mt-3 text-5xl" aria-label={`${stars} yulduz`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} aria-hidden className={cn("animate-kid-pop", n > stars && "opacity-25 grayscale")} style={{ animationDelay: `${n * 0.15}s` }}>
                    ⭐
                  </span>
                ))}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <KidButton onClick={onNew} className="bg-linear-to-br from-[#6FCF97] to-[#2F8F68] text-white">
                  Yangi oʻyin
                </KidButton>
                <KidButton onClick={onBack} className="bg-[#F1ECFF] text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white">
                  Boshqa daraja
                </KidButton>
              </div>
            </div>
          ) : (
            <>
              <div className={cn("grid gap-3", size === 9 ? "grid-cols-5" : size === 6 ? "grid-cols-3" : "grid-cols-4")}>
                {Array.from({ length: size }, (_, k) => k + 1).map((v) => (
                  <KidButton
                    key={v}
                    onClick={() => place(v)}
                    disabled={left(v) === 0}
                    className={cn(
                      "h-16 bg-[#F1ECFF] text-3xl text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] disabled:opacity-30 dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]",
                      selValue === v && "ring-4 ring-[#FFD166]"
                    )}
                    aria-label={pics ? `${PICS[v]} (${v})` : String(v)}
                  >
                    {show(v)}
                  </KidButton>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <KidButton onClick={() => place(0)} className="h-14 gap-2 bg-white px-3 text-base text-[#2B2140] shadow-[0_5px_0_rgba(0,0,0,0.08)] dark:bg-white/10 dark:text-white">
                  <HugeiconsIcon icon={Delete02Icon} className="size-5" /> Oʻchirish
                </KidButton>
                <KidButton onClick={hint} className="h-14 gap-2 bg-[#FFF1D6] px-3 text-base text-[#8B5A2B] shadow-[0_5px_0_#F0D9A8] dark:bg-white/10 dark:text-[#FFD166]">
                  <HugeiconsIcon icon={Idea01Icon} className="size-5" /> Maslahat
                </KidButton>
                <KidButton
                  onClick={() => {
                    setGrid(puzzle.start.slice())
                    setMessage("Boshidan boshlandi. Omad! 🍀")
                  }}
                  className="h-14 gap-2 bg-white px-3 text-base text-[#2B2140] shadow-[0_5px_0_rgba(0,0,0,0.08)] dark:bg-white/10 dark:text-white"
                >
                  <HugeiconsIcon icon={RefreshIcon} className="size-5" /> Qaytadan
                </KidButton>
              </div>
              <p className="text-sm opacity-60">⌨️ Klaviatura: strelkalar — yurish, 1–{size} — yozish, Backspace — oʻchirish, H — maslahat.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
