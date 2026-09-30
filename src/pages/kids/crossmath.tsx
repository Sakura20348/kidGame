import { useEffect, useEffectEvent, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { Reveal } from "@/components/motion/reveal"
import { kidsGames, starsFor } from "@/data/kids-games"
import { findAccount } from "@/lib/accounts"
import { useAuth, useKids } from "@/lib/contexts"
import { levelForClass, levels, makePuzzle, wrongEquations, EQUATIONS, type Cell, type Level, type Puzzle } from "@/lib/crossmath"
import { cn } from "@/lib/utils"
import { GameShell, KidButton, ResultScreen } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "crossmath")!
const ROUNDS = 3

// 5×5 layout: number cells by name, operator slots, "=" signs, empty corners
type Slot = { cell: Cell } | { op: keyof Puzzle["ops"] } | { eq: "row" | "col" } | null
const layout: Slot[][] = [
  [{ cell: "A" }, { op: "r1" }, { cell: "B" }, { eq: "row" }, { cell: "C" }],
  [{ op: "c1" }, null, { op: "c2" }, null, { op: "c3" }],
  [{ cell: "D" }, { op: "r2" }, { cell: "E" }, { eq: "row" }, { cell: "F" }],
  [{ eq: "col" }, null, { eq: "col" }, null, { eq: "col" }],
  [{ cell: "G" }, { op: "r3" }, { cell: "H" }, { eq: "row" }, { cell: "I" }],
]

type Tile = { id: number; value: number }

function tilesFor(p: Puzzle): Tile[] {
  return p.blanks.map((c, id) => ({ id, value: p.values[c] })).sort(() => Math.random() - 0.5)
}

export default function CrossMathPage() {
  const { email } = useAuth()
  const { award } = useKids()
  const suggested = levelForClass(findAccount(email)?.ageGroup)
  // "?level=c0…c4" opens a class level straight away
  const [params] = useSearchParams()
  const linked = levels.find((l) => l.id === params.get("level"))?.id ?? null
  const [level, setLevel] = useState<Level | null>(linked)
  const [round, setRound] = useState(0)
  const [clean, setClean] = useState(0) // puzzles solved with no mistakes or hints
  const [puzzle, setPuzzle] = useState<Puzzle | null>(() => (linked ? makePuzzle(linked) : null))
  const [tiles, setTiles] = useState<Tile[]>(() => (puzzle ? tilesFor(puzzle) : []))
  const [filled, setFilled] = useState<Partial<Record<Cell, number>>>({})
  const [usedTile, setUsedTile] = useState<Partial<Record<Cell, number>>>({}) // cell → tile id
  const [selected, setSelected] = useState<Cell | null>(null)
  const [typing, setTyping] = useState("")
  const [wrong, setWrong] = useState<Cell[]>([])
  const [slipped, setSlipped] = useState(false) // a mistake or hint in this puzzle
  const [solved, setSolved] = useState(false)
  const [done, setDone] = useState(false)

  function newPuzzle(l: Level) {
    const p = makePuzzle(l)
    setPuzzle(p)
    setTiles(tilesFor(p))
    setFilled({})
    setUsedTile({})
    setSelected(p.blanks[0])
    setTyping("")
    setWrong([])
    setSlipped(false)
    setSolved(false)
  }

  function start(l: Level) {
    setLevel(l)
    setRound(0)
    setClean(0)
    setDone(false)
    newPuzzle(l)
  }

  const nextEmpty = (after: Partial<Record<Cell, number>>) => puzzle?.blanks.find((c) => after[c] === undefined) ?? null

  function put(cell: Cell, value: number | undefined, tileId?: number) {
    const f = { ...filled }
    const u = { ...usedTile }
    if (value === undefined) {
      delete f[cell]
      delete u[cell]
    } else {
      f[cell] = value
      if (tileId !== undefined) u[cell] = tileId
      else delete u[cell]
    }
    setFilled(f)
    setUsedTile(u)
    setWrong([])
    return f
  }

  function useTile(t: Tile) {
    if (!puzzle || solved) return
    const target = selected && puzzle.blanks.includes(selected) ? selected : nextEmpty(filled)
    if (!target) return
    const f = put(target, t.value, t.id)
    setTyping("")
    setSelected(nextEmpty(f) ?? target)
  }

  function check() {
    if (!puzzle || solved) return
    const bad = wrongEquations(puzzle, filled)
    if (bad.length === 0) {
      setSolved(true)
      if (!slipped) setClean((n) => n + 1)
      return
    }
    // mark the blanks that sit in a wrong equation
    const cells = new Set(bad.flatMap((e) => e.cells))
    setWrong(puzzle.blanks.filter((c) => cells.has(c)))
    setSlipped(true)
  }

  function hint() {
    if (!puzzle || solved) return
    const cell = puzzle.blanks.find((c) => filled[c] !== puzzle.values[c])
    if (!cell) return
    const tile = tiles.find((t) => t.value === puzzle.values[cell] && !Object.entries(usedTile).some(([k, id]) => id === t.id && k !== cell))
    const f = put(cell, puzzle.values[cell], tile?.id)
    setSlipped(true)
    setSelected(nextEmpty(f) ?? cell)
  }

  function next() {
    if (!level) return
    if (round + 1 >= ROUNDS) {
      award(game.id, starsFor(clean, ROUNDS))
      setDone(true)
    } else {
      setRound(round + 1)
      newPuzzle(level)
    }
  }

  // keyboard: digits type into the selected box, Backspace clears, Enter checks, arrows move
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!puzzle || done || e.ctrlKey || e.metaKey || e.altKey) return
    if (solved) {
      if (e.key === "Enter") next()
      return
    }
    if (e.key === "Enter") return check()
    if (!selected) return
    if (/^\d$/.test(e.key)) {
      const t = (typing + e.key).replace(/^0+(?=\d)/, "").slice(0, 3)
      setTyping(t)
      put(selected, Number(t))
    } else if (e.key === "Backspace") {
      e.preventDefault()
      const t = typing.slice(0, -1)
      setTyping(t)
      put(selected, t ? Number(t) : undefined)
    } else if (e.key.startsWith("Arrow") || e.key === "Tab") {
      e.preventDefault()
      const i = puzzle.blanks.indexOf(selected)
      const step = e.key === "ArrowLeft" || e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey) ? -1 : 1
      setSelected(puzzle.blanks[(i + step + puzzle.blanks.length) % puzzle.blanks.length])
      setTyping("")
    }
  })
  useEffect(() => {
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // ------------------------------------------------------------ choose a level
  if (!level || !puzzle) {
    return (
      <GameShell game={game} round={0} total={ROUNDS} score={0} wide hideProgress>
        <Reveal>
          <h2 className="text-4xl font-semibold">Choose your CrossMath</h2>
          <p className="mt-2 text-lg opacity-75">Every row and every column is a sum. Fill in the missing numbers!</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {levels.map((l, i) => (
            <Reveal key={l.id} delay={i * 90} className="flex *:flex-1">
              <button
                type="button"
                onClick={() => start(l.id)}
                className={cn(
                  "group relative flex min-h-[400px] flex-col overflow-hidden rounded-[34px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.16)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-1",
                  l.tile,
                  l.id === suggested && "ring-4 ring-[#FFD166]"
                )}
              >
                <span aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-white/15" />
                <span className="relative flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white/25 px-4 py-1.5 text-base font-semibold">{l.classes}</span>
                  {l.id === suggested && <span className="rounded-full bg-[#FFD166] px-3 py-1 text-sm font-bold text-[#2B2140]">⭐ For you</span>}
                </span>
                <span aria-hidden className="relative my-6 self-center text-[110px] leading-none drop-shadow-[0_8px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110">
                  {l.emoji}
                </span>
                <span className="relative mt-auto rounded-[22px] bg-white/90 px-5 py-4 text-[#2B2140] shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                  <span className="block text-3xl leading-tight font-semibold">{l.name}</span>
                  <span className="mt-1 block text-base font-medium opacity-75">{l.blurb}</span>
                  <span className="mt-3 block text-sm font-semibold opacity-70">{ROUNDS} puzzles · {l.ops.join(" ")}</span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </GameShell>
    )
  }

  // ------------------------------------------------------------ results
  if (done) {
    return (
      <GameShell game={game} round={ROUNDS} total={ROUNDS} score={clean}>
        <ResultScreen game={game} stars={starsFor(clean, ROUNDS)} message={`You solved ${clean} of ${ROUNDS} puzzles with no mistakes or hints.`} onReplay={() => setLevel(null)} />
      </GameShell>
    )
  }

  // ------------------------------------------------------------ play
  const usedIds = new Set(Object.values(usedTile))
  const allFilled = puzzle.blanks.every((c) => filled[c] !== undefined)
  const rightEq = solved ? EQUATIONS : []

  return (
    <GameShell game={game} round={round} total={ROUNDS} score={clean}>
      <div className="rounded-[32px] bg-white p-5 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-8 dark:bg-white/5">
        <p className="text-center text-lg font-semibold opacity-70">
          Puzzle {round + 1} of {ROUNDS} · Tap a box, then a number (or type it)
        </p>

        {/* grid */}
        <div className={cn("mx-auto mt-5 grid w-full max-w-[440px] grid-cols-5 gap-1.5 sm:gap-2", wrong.length > 0 && "animate-kid-shake")}>
          {layout.flat().map((slot, i) => {
            if (!slot) return <span key={i} />
            if ("op" in slot)
              return (
                <span key={i} className="flex aspect-square items-center justify-center">
                  <span className="flex size-[70%] items-center justify-center rounded-full bg-[#FFD166] text-2xl font-bold text-[#2B2140] sm:text-3xl">{puzzle.ops[slot.op]}</span>
                </span>
              )
            if ("eq" in slot)
              return (
                <span key={i} className={cn("flex aspect-square items-center justify-center text-3xl font-bold opacity-60", slot.eq === "col" && "rotate-90")}>
                  =
                </span>
              )
            const c = slot.cell
            const blank = puzzle.blanks.includes(c)
            const value = blank ? filled[c] : puzzle.values[c]
            return blank ? (
              <button
                key={i}
                type="button"
                disabled={solved}
                onClick={() => {
                  if (selected === c && filled[c] !== undefined) put(c, undefined) // tap again to take the number back
                  setSelected(c)
                  setTyping("")
                }}
                aria-label={`Missing number ${c}${value !== undefined ? `, ${value}` : ""}`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-[16px] border-4 text-2xl font-bold tabular-nums outline-none transition-colors sm:text-3xl",
                  solved
                    ? "border-transparent bg-[#2BC0A4] text-white"
                    : wrong.includes(c)
                      ? "border-[#FF5E7E] bg-[#FFE1E6] text-[#C22A4B]"
                      : selected === c
                        ? "border-[#6C63FF] bg-[#EEEBFF] text-[#4B42D6] dark:bg-[#6C63FF]/25 dark:text-white"
                        : value !== undefined
                          ? "border-transparent bg-[#6C63FF] text-white"
                          : "border-dashed border-[#D6CCFF] dark:border-white/20"
                )}
              >
                {value ?? ""}
              </button>
            ) : (
              <span
                key={i}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-[16px] text-2xl font-bold tabular-nums sm:text-3xl",
                  rightEq.length ? "bg-[#DFF7EE] text-[#1F9D6B] dark:bg-[#2BC0A4]/20" : "bg-[#F4F1EA] text-[#2B2140] dark:bg-white/10 dark:text-white"
                )}
              >
                {value}
              </span>
            )
          })}
        </div>

        <p className="mt-4 h-7 text-center text-lg font-medium" aria-live="polite">
          {solved ? "🎉 Every sum is right!" : wrong.length ? "Oops! Look at the red boxes." : ""}
        </p>

        {/* number tiles */}
        {!solved && (
          <div className="mt-2 flex flex-wrap justify-center gap-2.5">
            {tiles.map((t) => {
              const used = usedIds.has(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={used}
                  onClick={() => useTile(t)}
                  className={cn(
                    "flex h-14 min-w-14 items-center justify-center rounded-[16px] bg-[#FFD166] px-3 text-2xl font-bold text-[#2B2140] tabular-nums shadow-[0_5px_0_#E0A800] outline-none transition-[transform,opacity] focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 active:translate-y-1 active:shadow-[0_1px_0_#E0A800]",
                    used && "scale-90 opacity-25 shadow-none"
                  )}
                >
                  {t.value}
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {solved ? (
            <KidButton onClick={next} className="bg-[#2BC0A4] text-white shadow-[0_5px_0_#1F9D6B]">
              {round + 1 >= ROUNDS ? "See my stars ⭐" : "Next puzzle ➜"}
            </KidButton>
          ) : (
            <>
              <KidButton onClick={check} disabled={!allFilled} className="bg-[#6C63FF] text-white shadow-[0_5px_0_#4B42D6] disabled:opacity-50">
                ✔ Check
              </KidButton>
              <KidButton onClick={hint} className="h-16 bg-[#F1ECFF] px-6 text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white dark:shadow-none">
                💡 Hint
              </KidButton>
              <KidButton
                onClick={() => {
                  setFilled({})
                  setUsedTile({})
                  setWrong([])
                  setTyping("")
                  setSelected(puzzle.blanks[0])
                }}
                className="h-16 bg-transparent px-6 opacity-70 shadow-none"
              >
                Clear
              </KidButton>
            </>
          )}
        </div>
      </div>
    </GameShell>
  )
}
