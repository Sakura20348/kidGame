import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { Reveal } from "@/components/motion/reveal"
import { kidsGames } from "@/data/kids-games"
import { findAccount } from "@/lib/accounts"
import { useAuth, useKids } from "@/lib/contexts"
import {
  chooseMove,
  emptyBoard,
  evaluate,
  findMoves,
  loadDict,
  makeBag,
  premiumAt,
  scrLevelForClass,
  scrLevels,
  topics,
  VALUES,
  type Board,
  type Dict,
  type ScrLevel,
  type Tile,
} from "@/lib/scrabble"
import { cn } from "@/lib/utils"
import { KidButton, ResultScreen } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "sudoku")!

type Pending = { r: number; c: number; tile: Tile }
type Game = {
  level: ScrLevel
  topic: number | null
  board: Board
  bag: string[]
  rack: Tile[]
  robo: string[]
  you: number
  roboScore: number
  turn: "you" | "robo"
  turns: { you: number; robo: number }
  quiet: number // turns in a row with no points (passes/swaps)
  log: string[]
  last: [number, number][]
  over: boolean
}

let tileId = 0
const toTiles = (letters: string[]) => letters.map((letter) => ({ id: tileId++, letter }))

const premiumStyle: Record<string, string> = {
  TW: "bg-[#FF7A7A] text-white",
  DW: "bg-[#FFB3C7] text-[#8A1F45]",
  TL: "bg-[#5B9BFF] text-white",
  DL: "bg-[#B9D8FF] text-[#1F4E8A]",
  "★": "bg-[#FFB3C7] text-[#8A1F45]",
}
const premiumLabel: Record<string, string> = { TW: "3W", DW: "2W", TL: "3L", DL: "2L", "★": "★" }

/** Scrabble against Robo, the computer – board size, letters and Robo's skill depend on the class. */
export function Scrabble() {
  const { email } = useAuth()
  const { award } = useKids()
  const suggested = scrLevelForClass(findAccount(email)?.ageGroup)
  const [dict, setDict] = useState<Dict | null>(null)
  const [pickLevel, setPickLevel] = useState<ScrLevel | null>(null)
  const [g, setG] = useState<Game | null>(null)
  const [pending, setPending] = useState<Pending[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  // "&level=easy|medium|hard&topic=0-3" starts a game straight away
  const [params] = useSearchParams()
  useEffect(() => {
    let alive = true
    loadDict().then((d) => {
      if (!alive) return
      setDict(d)
      const level = scrLevels.find((l) => l.id === params.get("level"))?.id
      if (level && !g) {
        const t = Number(params.get("topic"))
        start(level, Number.isInteger(t) && t >= 0 && t < topics[level].length ? t : null)
      }
    })
    return () => {
      alive = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const info = scrLevels.find((l) => l.id === (g?.level ?? pickLevel))
  const pickInfo = scrLevels.find((l) => l.id === pickLevel)
  const topicSet = g && g.topic !== null ? new Set(topics[g.level][g.topic].words) : undefined

  function start(level: ScrLevel, topic: number | null) {
    const L = scrLevels.find((l) => l.id === level)!
    const bag = makeBag(level)
    const rack = toTiles(bag.splice(0, L.rack))
    const robo = bag.splice(0, L.rack)
    setG({ level, topic, board: emptyBoard(L.size), bag, rack, robo, you: 0, roboScore: 0, turn: "you", turns: { you: 0, robo: 0 }, quiet: 0, log: [], last: [], over: false })
    setPending([])
    setSelected(null)
    setShowResult(false)
  }

  function isOver(next: Game) {
    const L = scrLevels.find((l) => l.id === next.level)!
    return (next.bag.length === 0 && (next.rack.length === 0 || next.robo.length === 0)) || next.quiet >= 4 || (next.turns.you >= L.rounds && next.turns.robo >= L.rounds)
  }

  function finishIfOver(next: Game) {
    if (!isOver(next)) return next
    const stars = next.you >= next.roboScore + 20 ? 3 : next.you >= next.roboScore ? 2 : 1
    award(game.id, stars)
    setTimeout(() => setShowResult(true), 1400)
    return { ...next, over: true }
  }

  // ------------------------------------------------------------ Robo's turn
  useEffect(() => {
    if (!g || !dict || g.turn !== "robo" || g.over) return
    const id = setTimeout(() => {
      const L = scrLevels.find((l) => l.id === g.level)!
      const moves = findMoves(g.board, g.robo, dict.robo[g.level], { valid: dict.valid, rackSize: L.rack, topic: topicSet })
      const move = chooseMove(moves, g.level)
      let next: Game
      if (move) {
        const board = g.board.map((row) => [...row])
        const robo = [...g.robo]
        for (const p of move.placed) {
          board[p.r][p.c] = p.letter
          robo.splice(robo.indexOf(p.letter), 1)
        }
        const bag = [...g.bag]
        robo.push(...bag.splice(0, L.rack - robo.length))
        const word = move.words[0].word
        next = { ...g, board, bag, robo, roboScore: g.roboScore + move.score, quiet: 0, last: move.placed.map((p) => [p.r, p.c]), log: [`🤖 Robo played ${word} for ${move.score}`, ...g.log] }
      } else if (g.bag.length >= L.rack) {
        const bag = [...g.bag, ...g.robo].sort(() => Math.random() - 0.5)
        next = { ...g, robo: bag.splice(0, L.rack), bag, quiet: g.quiet + 1, last: [], log: ["🤖 Robo swapped its letters", ...g.log] }
      } else {
        next = { ...g, quiet: g.quiet + 1, last: [], log: ["🤖 Robo passed", ...g.log] }
      }
      setG(finishIfOver({ ...next, turn: "you", turns: { ...next.turns, robo: next.turns.robo + 1 } }))
    }, 900)
    return () => clearTimeout(id)
  }, [g, dict]) // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------ your moves
  const usedIds = new Set(pending.map((p) => p.tile.id))

  function tapCell(r: number, c: number) {
    if (!g || g.turn !== "you" || g.over) return
    const here = pending.find((p) => p.r === r && p.c === c)
    if (here) {
      setPending(pending.filter((p) => p !== here)) // take it back
      return
    }
    if (g.board[r][c]) return
    const tile = g.rack.find((t) => t.id === selected && !usedIds.has(t.id)) ?? g.rack.find((t) => !usedIds.has(t.id))
    if (!tile) return
    setPending([...pending, { r, c, tile }])
    const nextFree = g.rack.find((t) => t.id !== tile.id && !usedIds.has(t.id))
    setSelected(nextFree?.id ?? null)
  }

  function play() {
    if (!g || !dict || g.turn !== "you") return
    const L = scrLevels.find((l) => l.id === g.level)!
    const res = evaluate(
      g.board,
      pending.map((p) => ({ r: p.r, c: p.c, letter: p.tile.letter })),
      { valid: dict.valid, rackSize: L.rack, topic: topicSet }
    )
    if (!res.ok) {
      toast(res.error)
      return
    }
    const board = g.board.map((row) => [...row])
    for (const p of pending) board[p.r][p.c] = p.tile.letter
    const bag = [...g.bag]
    const rack = g.rack.filter((t) => !usedIds.has(t.id))
    rack.push(...toTiles(bag.splice(0, L.rack - rack.length)))
    const words = res.words.map((w) => w.word).join(", ")
    setPending([])
    setSelected(null)
    setG(
      finishIfOver({
        ...g,
        board,
        bag,
        rack,
        you: g.you + res.score,
        quiet: 0,
        last: [],
        turn: "robo",
        turns: { ...g.turns, you: g.turns.you + 1 },
        log: [`🧒 You played ${words} for ${res.score}${res.bonus ? ` (bonus +${res.bonus})` : ""}`, ...g.log],
      })
    )
  }

  function passOrSwap(swap: boolean) {
    if (!g || g.turn !== "you") return
    const L = scrLevels.find((l) => l.id === g.level)!
    setPending([])
    if (swap && g.bag.length >= L.rack) {
      const bag = [...g.bag, ...g.rack.map((t) => t.letter)].sort(() => Math.random() - 0.5)
      const rack = toTiles(bag.splice(0, L.rack))
      setG(finishIfOver({ ...g, bag, rack, quiet: g.quiet + 1, turn: "robo", turns: { ...g.turns, you: g.turns.you + 1 }, log: ["🧒 You swapped your letters", ...g.log] }))
    } else {
      setG(finishIfOver({ ...g, quiet: g.quiet + 1, turn: "robo", turns: { ...g.turns, you: g.turns.you + 1 }, log: ["🧒 You passed", ...g.log] }))
    }
  }

  // ------------------------------------------------------------ choose level + topic
  if (!g || !info) {
    return (
      <div>
        <Reveal>
          <h2 className="text-4xl font-semibold">Scrabble vs Robo 🤖</h2>
          <p className="mt-2 text-lg opacity-75">Make English words on the board and beat the computer! {dict ? "" : "Loading words…"}</p>
        </Reveal>
        {!pickLevel ? (
          <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {scrLevels.map((l, i) => (
              <Reveal key={l.id} delay={i * 90} className="flex *:flex-1">
                <button
                  type="button"
                  onClick={() => setPickLevel(l.id)}
                  className={cn(
                    "group relative flex min-h-[380px] flex-col overflow-hidden rounded-[34px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.16)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-1",
                    l.tile,
                    l.id === suggested && "ring-4 ring-[#FFD166]"
                  )}
                >
                  <span aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-white/15" />
                  <span className="relative flex items-center justify-between gap-2">
                    <span className="rounded-full bg-white/25 px-4 py-1.5 text-base font-semibold">{l.classes}</span>
                    {l.id === suggested && <span className="rounded-full bg-[#FFD166] px-3 py-1 text-sm font-bold text-[#2B2140]">⭐ For you</span>}
                  </span>
                  <span aria-hidden className="relative my-6 self-center text-[96px] leading-none drop-shadow-[0_8px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110">
                    {l.emoji}
                  </span>
                  <span className="relative mt-auto rounded-[22px] bg-white/90 px-5 py-4 text-[#2B2140] shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                    <span className="block text-3xl leading-tight font-semibold">{l.name}</span>
                    <span className="mt-1 block text-base font-medium opacity-75">{l.blurb}</span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[32px] bg-white p-6 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
            <p className="text-3xl font-semibold">
              {pickInfo?.emoji} {pickInfo?.name}: pick a topic
            </p>
            <p className="mt-1 text-lg opacity-70">Words from your topic give +10 bonus points!</p>
            <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
              {topics[pickLevel].map((t, i) => (
                <KidButton key={t.name} disabled={!dict} onClick={() => start(pickLevel, i)} className="h-auto flex-col gap-1 bg-[#FFF1E8] py-5 text-[#2B2140] shadow-[0_6px_0_#FFD2B8] dark:bg-white/10 dark:text-white dark:shadow-none">
                  <span className="text-5xl">{t.emoji}</span>
                  <span className="text-xl">{t.name}</span>
                </KidButton>
              ))}
              <KidButton disabled={!dict} onClick={() => start(pickLevel, null)} className={cn("h-auto flex-col gap-1 bg-linear-to-br py-5 text-white", pickInfo?.tile)}>
                <span className="text-5xl">🎲</span>
                <span className="text-xl">Any words</span>
              </KidButton>
            </div>
            <button type="button" onClick={() => setPickLevel(null)} className="mt-6 text-base font-semibold opacity-70 hover:underline">
              ← Other level
            </button>
          </div>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------ result
  if (showResult) {
    const won = g.you > g.roboScore
    const stars = g.you >= g.roboScore + 20 ? 3 : g.you >= g.roboScore ? 2 : 1
    return (
      <ResultScreen
        game={game}
        stars={stars}
        message={`${won ? "You beat Robo" : g.you === g.roboScore ? "It’s a tie" : "Robo won this time"}: ${g.you} – ${g.roboScore}.`}
        onReplay={() => start(g.level, g.topic)}
      />
    )
  }

  // ------------------------------------------------------------ play
  const size = g.board.length
  const lastSet = new Set(g.last.map(([r, c]) => `${r},${c}`))
  const myTurn = g.turn === "you" && !g.over
  const topic = g.topic !== null ? topics[g.level][g.topic] : null

  return (
    <div className="grid items-start gap-6 @min-[1000px]:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[32px] bg-white p-3 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-5 dark:bg-white/5">
        {/* board */}
        <div className="@container mx-auto w-full max-w-[640px]">
          <div className="grid gap-[2px] rounded-[16px] bg-[#1E6B4D] p-[3px]" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
            {g.board.map((row, r) =>
              row.map((cell, c) => {
                const p = pending.find((x) => x.r === r && x.c === c)
                const letter = cell ?? p?.tile.letter
                const prem = premiumAt(size, r, c)
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => tapCell(r, c)}
                    disabled={!myTurn || (!!cell && !p)}
                    aria-label={letter ? `${letter} at row ${r + 1}, column ${c + 1}` : `Empty square row ${r + 1}, column ${c + 1}${prem ? `, ${premiumLabel[prem]}` : ""}`}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-[4px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#FFD166]",
                      letter
                        ? p
                          ? "bg-[#B9AEFF] text-[#2B2140] shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]"
                          : cn("bg-[#FFE6A8] text-[#3A2A00] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]", lastSet.has(`${r},${c}`) && "ring-2 ring-[#2BC0A4] ring-inset")
                        : prem
                          ? premiumStyle[prem]
                          : "bg-[#E9F3EC] dark:bg-[#23332B]"
                    )}
                    style={{ fontSize: `min(${Math.round(62 / size)}cqw, 30px)` }}
                  >
                    {letter ?? (prem ? <span style={{ fontSize: "0.5em" }}>{premiumLabel[prem]}</span> : "")}
                    {letter && (
                      <span className="absolute right-[6%] bottom-[2%] font-semibold" style={{ fontSize: "0.38em" }}>
                        {VALUES[letter]}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* rack */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {g.rack.map((t) => {
            const used = usedIds.has(t.id)
            return (
              <button
                key={t.id}
                type="button"
                disabled={used || !myTurn}
                onClick={() => setSelected(t.id)}
                className={cn(
                  "relative flex size-14 items-center justify-center rounded-[12px] bg-[#FFE6A8] text-3xl font-bold text-[#3A2A00] shadow-[0_4px_0_#D9B25A] outline-none transition-[transform,opacity] focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 sm:size-16",
                  selected === t.id && !used && "-translate-y-1.5 ring-4 ring-[#6C63FF]",
                  used && "scale-90 opacity-25 shadow-none"
                )}
              >
                {t.letter}
                <span className="absolute right-1.5 bottom-0.5 text-xs font-semibold">{VALUES[t.letter]}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-center text-sm opacity-60">Tap a letter, then a square. Tap a purple letter to take it back.</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          <KidButton onClick={play} disabled={!myTurn || pending.length === 0} className="h-14 bg-[#2BC0A4] px-7 text-lg text-white shadow-[0_5px_0_#1F9D6B] disabled:opacity-50">
            ✔ Play word
          </KidButton>
          <KidButton onClick={() => setPending([])} disabled={!myTurn || pending.length === 0} className="h-14 bg-[#F1ECFF] px-5 text-lg text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] disabled:opacity-40 dark:bg-white/10 dark:text-white dark:shadow-none">
            ↩ Take back
          </KidButton>
          <KidButton
            onClick={() => setG({ ...g, rack: [...g.rack].sort(() => Math.random() - 0.5) })}
            disabled={!myTurn}
            className="h-14 bg-[#F1ECFF] px-5 text-lg text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] disabled:opacity-40 dark:bg-white/10 dark:text-white dark:shadow-none"
          >
            🔀 Mix
          </KidButton>
          <KidButton onClick={() => passOrSwap(true)} disabled={!myTurn || g.bag.length < info.rack} className="h-14 bg-transparent px-4 text-lg opacity-70 shadow-none disabled:opacity-30">
            New letters
          </KidButton>
          <KidButton onClick={() => passOrSwap(false)} disabled={!myTurn} className="h-14 bg-transparent px-4 text-lg opacity-70 shadow-none disabled:opacity-30">
            Pass
          </KidButton>
        </div>
      </div>

      {/* side panel */}
      <aside className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { who: "You 🧒", score: g.you, active: g.turn === "you" },
            { who: "Robo 🤖", score: g.roboScore, active: g.turn === "robo" },
          ].map((p) => (
            <div key={p.who} className={cn("rounded-[22px] bg-white p-4 text-center shadow-[0_5px_0_rgba(43,33,64,0.06)] dark:bg-white/5", p.active && !g.over && "ring-4 ring-[#FFD166]")}>
              <p className="text-base font-semibold opacity-75">{p.who}</p>
              <p className="text-4xl font-bold tabular-nums">{p.score}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-lg font-semibold" aria-live="polite">
          {g.over ? "Game over!" : g.turn === "robo" ? "🤖 Robo is thinking…" : "Your turn!"}
        </p>
        <div className="rounded-[22px] bg-white p-4 text-sm shadow-[0_5px_0_rgba(43,33,64,0.06)] dark:bg-white/5">
          <p className="font-semibold">
            {info.name} · round {Math.min(g.turns.you + 1, info.rounds)} of {info.rounds} · {g.bag.length} letters left
          </p>
          {topic && (
            <div className="mt-3 rounded-[14px] bg-[#FFF6E5] p-3 dark:bg-white/10">
              <p className="font-semibold">
                {topic.emoji} Topic: {topic.name} (+10)
              </p>
              <p className="mt-1 leading-relaxed opacity-80">{topic.words.map((w) => w.toUpperCase()).join(" · ")}</p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {Object.entries(premiumLabel).map(([k, v]) => (
              <span key={k} className={cn("rounded-[6px] px-2 py-1 font-semibold", premiumStyle[k])}>
                {v} {k === "TW" ? "word ×3" : k === "DW" || k === "★" ? "word ×2" : k === "TL" ? "letter ×3" : "letter ×2"}
              </span>
            ))}
          </div>
        </div>
        <ol className="max-h-56 space-y-1.5 overflow-y-auto rounded-[22px] bg-white p-4 text-sm shadow-[0_5px_0_rgba(43,33,64,0.06)] dark:bg-white/5">
          {g.log.length === 0 ? <li className="opacity-60">Make the first word — it must cover the ★ in the middle.</li> : g.log.map((l, i) => <li key={i} className={cn(i === 0 && "font-semibold")}>{l}</li>)}
        </ol>
      </aside>
    </div>
  )
}
