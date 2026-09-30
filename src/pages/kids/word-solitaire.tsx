import { useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { Reveal } from "@/components/motion/reveal"
import { connLevelForClass, connLevels, groupColors, type ConnLevel } from "@/data/connections"
import { dealFor, solitaireStars, table, type Card, type Deal } from "@/lib/word-solitaire"
import { kidsGames } from "@/data/kids-games"
import { findAccount } from "@/lib/accounts"
import { useAuth, useKids } from "@/lib/contexts"
import { cn } from "@/lib/utils"
import { GameShell, ResultScreen } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "memory")!

export function WordSolitaire({ modeSwitch }: { modeSwitch: ReactNode }) {
  const { email } = useAuth()
  const { award } = useKids()
  const suggested = connLevelForClass(findAccount(email)?.ageGroup)
  const [params] = useSearchParams()
  const linked = connLevels.find((l) => l.id === params.get("level"))?.id ?? null
  const [level, setLevel] = useState<ConnLevel | null>(linked)
  const [deal, setDeal] = useState<Deal | null>(() => (linked ? dealFor(linked) : null))
  const [waste, setWaste] = useState<Card[]>([])
  const [slots, setSlots] = useState<(number | null)[]>(() => (linked ? Array(table[linked].spots).fill(null) : [])) // open category (group index) per spot
  const [filled, setFilled] = useState<Record<number, number>>({})
  const [done, setDone] = useState<number[]>([]) // finished groups
  const [moves, setMoves] = useState(0)
  const [shakeId, setShakeId] = useState<number | null>(null)
  const [won, setWon] = useState(false)
  const [earned, setEarned] = useState(0) // stars for this table

  const puzzle = deal // the groups on this table
  const size = deal?.groups[0].words.length ?? 4
  const info = connLevels.find((l) => l.id === level)

  function start(l: ConnLevel) {
    setLevel(l)
    setDeal(dealFor(l))
    setWaste([])
    setSlots(Array(table[l].spots).fill(null))
    setFilled({})
    setDone([])
    setMoves(0)
    setWon(false)
  }

  function draw() {
    if (!deal || won) return
    setMoves((m) => m + 1)
    if (deal.stock.length === 0) {
      // turn the pile over again
      setDeal({ ...deal, stock: [...waste].reverse() })
      setWaste([])
      return
    }
    const [top, ...rest] = deal.stock
    setDeal({ ...deal, stock: rest })
    setWaste([...waste, top])
  }

  function shake(card: Card, message: string) {
    setShakeId(card.id)
    setTimeout(() => setShakeId(null), 450)
    toast(message)
  }

  function play(card: Card, from: "waste" | number) {
    if (!deal || !puzzle || won) return
    let nextSlots = slots
    let nextFilled = filled
    let nextDone = done
    if (card.kind === "cat" ? slots.indexOf(null) === -1 : !slots.includes(card.group)) {
      // can't be played yet: it goes to the bottom of the pile (so the game never gets stuck)
      shake(card, card.kind === "cat" ? "All spots are busy — it went back to the pile" : "Its category isn’t open yet — it went back to the pile 🔄")
      setTimeout(() => {
        setDeal((d) => (d ? { ...d, columns: from === "waste" ? d.columns : d.columns.map((col, i) => (i === from ? col.slice(0, -1) : col)), stock: [...d.stock, card] } : d))
        if (from === "waste") setWaste((w) => w.slice(0, -1))
      }, 350)
      setMoves((m) => m + 1)
      return
    }
    if (card.kind === "cat") {
      const free = slots.indexOf(null)
      nextSlots = slots.map((s, i) => (i === free ? card.group : s))
    } else {
      const count = (filled[card.group] ?? 0) + 1
      nextFilled = { ...filled, [card.group]: count }
      if (count === size) {
        // category complete: it leaves the table and frees its spot
        nextDone = [...done, card.group]
        nextSlots = slots.map((s) => (s === card.group ? null : s))
      }
    }
    // take the card away from where it was
    const columns = from === "waste" ? deal.columns : deal.columns.map((col, i) => (i === from ? col.slice(0, -1) : col))
    const nextWaste = from === "waste" ? waste.slice(0, -1) : waste
    setDeal({ ...deal, columns })
    setWaste(nextWaste)
    setSlots(nextSlots)
    setFilled(nextFilled)
    setDone(nextDone)
    const nextMoves = moves + 1
    setMoves(nextMoves)
    if (nextDone.length === puzzle.groups.length) {
      const stars = solitaireStars(nextMoves, deal)
      award(game.id, stars)
      setEarned(stars)
      setTimeout(() => setWon(true), 900)
    }
  }

  // ------------------------------------------------------------ choose a level
  if (!level || !deal || !puzzle || !info) {
    return (
      <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
        {modeSwitch}
        <Reveal>
          <h2 className="text-4xl font-semibold">Word Solitaire 🃏</h2>
          <p className="mt-2 text-lg opacity-75">Open a category card, then send every word to its category. Clear the table to win!</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {connLevels.map((l, i) => (
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
                <span aria-hidden className="relative my-6 self-center text-[100px] leading-none drop-shadow-[0_8px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110">
                  {l.emoji}
                </span>
                <span className="relative mt-auto rounded-[22px] bg-white/90 px-5 py-4 text-[#2B2140] shadow-[0_4px_0_rgba(0,0,0,0.06)]">
                  <span className="block text-3xl leading-tight font-semibold">{l.name}</span>
                  <span className="mt-1 block text-base font-medium opacity-75">
                    {table[l.id].columns} columns × {table[l.id].depth} cards
                  </span>
                  <span className="mt-3 block text-sm font-semibold opacity-70">{table[l.id].spots} category spots · new table every game</span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </GameShell>
    )
  }

  // ------------------------------------------------------------ result
  if (won) {
    return (
      <GameShell game={game} round={1} total={1} score={done.length}>
        <ResultScreen game={game} stars={earned} message={`You cleared the table in ${moves} moves!`} onReplay={() => start(level)} />
      </GameShell>
    )
  }

  // ------------------------------------------------------------ play
  const cardBase = "relative flex w-full flex-col items-center justify-center rounded-[14px] px-1 text-center font-semibold uppercase select-none"
  const wordCard = (c: Card, onClick?: () => void, extra?: string) => (
    <button
      key={c.id}
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        cardBase,
        "h-20 outline-none transition-transform focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 sm:h-24",
        c.kind === "cat"
          ? "bg-linear-to-br from-[#FFD166] to-[#FFAE3B] text-[#4A3100] shadow-[0_4px_0_#D9901A]"
          : "bg-white text-[#2B2140] shadow-[0_4px_0_#D9D2C3] dark:bg-[#2A2640] dark:text-white dark:shadow-[0_4px_0_rgba(0,0,0,0.3)]",
        onClick && "hover:-translate-y-0.5 active:translate-y-0.5",
        shakeId === c.id && "animate-kid-shake",
        extra
      )}
    >
      {c.emoji && (
        <span aria-hidden className="text-3xl leading-none normal-case sm:text-4xl">
          {c.emoji}
        </span>
      )}
      <span className={cn("mt-0.5 leading-tight break-words", c.word.length > 10 ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm")}>{c.kind === "cat" ? `★ ${c.word}` : c.word}</span>
    </button>
  )
  const back = (key: string | number, extra?: string) => (
    <span key={key} aria-hidden className={cn(cardBase, "h-20 bg-linear-to-br from-[#8E7CFF] to-[#5B4BD6] text-2xl text-white/40 shadow-[0_4px_0_#3E30A6] sm:h-24", extra)}>
      ✦
    </span>
  )
  const cols = deal.columns.length

  return (
    <GameShell game={game} round={done.length} total={puzzle.groups.length} score={done.length}>
      {modeSwitch}
      <div className="rounded-[32px] bg-linear-to-b from-[#2F8F68] to-[#1E6B4D] p-4 text-white shadow-[0_8px_0_rgba(20,70,50,0.35)] sm:p-6">
        <div className="flex items-center justify-between text-sm font-semibold text-white/85">
          <span>
            {info.emoji} {info.name} · {done.length}/{puzzle.groups.length} categories
          </span>
          <span>Moves: {moves}</span>
        </div>

        {/* pile + category spots */}
        <div className="mt-4 grid gap-2.5 sm:gap-3" style={{ gridTemplateColumns: `repeat(${2 + slots.length}, minmax(0, 1fr))` }}>
          <button type="button" onClick={draw} aria-label={deal.stock.length ? `Draw a card (${deal.stock.length} left)` : "Turn the pile over"} className="outline-none focus-visible:ring-4 focus-visible:ring-white/50">
            {deal.stock.length ? (
              <span className={cn(cardBase, "h-20 bg-linear-to-br from-[#8E7CFF] to-[#5B4BD6] shadow-[0_4px_0_#3E30A6] sm:h-24")}>
                <span className="text-2xl">🂠</span>
                <span className="text-xs">{deal.stock.length} left</span>
              </span>
            ) : (
              <span className={cn(cardBase, "h-20 border-2 border-dashed border-white/40 text-2xl sm:h-24")}>🔄</span>
            )}
          </button>
          {waste.length ? wordCard(waste[waste.length - 1], () => play(waste[waste.length - 1], "waste")) : <span className={cn(cardBase, "h-20 border-2 border-dashed border-white/25 sm:h-24")} />}
          {slots.map((gi, i) =>
            gi === null ? (
              <span key={`slot-${i}`} className={cn(cardBase, "h-20 border-2 border-dashed border-white/35 text-[11px] text-white/60 sm:h-24")}>
                Category spot
              </span>
            ) : (
              <span key={`slot-${i}`} className={cn(cardBase, "h-20 sm:h-24", groupColors[gi % groupColors.length])}>
                <span className="text-[11px] leading-tight sm:text-xs">★ {puzzle.groups[gi].name}</span>
                <span className="mt-1 text-lg font-bold tabular-nums">
                  {filled[gi] ?? 0}/{size}
                </span>
              </span>
            )
          )}
        </div>

        {/* finished categories */}
        {done.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {done.map((gi) => (
              <span key={gi} className={cn("animate-kid-pop rounded-full px-3 py-1 text-xs font-bold uppercase", groupColors[gi % groupColors.length])}>
                ✓ {puzzle.groups[gi].name}
              </span>
            ))}
          </div>
        )}

        {/* columns */}
        <div className="mt-5 grid gap-2.5 sm:gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {deal.columns.map((col, ci) => (
            <div key={ci} className="flex min-h-24 flex-col">
              {col.length === 0 && <span className={cn(cardBase, "h-20 border-2 border-dashed border-white/20 sm:h-24")} />}
              {col.map((c, i) => {
                const top = i === col.length - 1
                const overlap = i > 0 ? "-mt-14 sm:-mt-16" : ""
                return top ? wordCard(c, () => play(c, ci), overlap) : back(c.id, overlap)
              })}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-white/75">Tap the pile to draw · Gold ★ cards open a category · Tap a word to send it to its category (not open yet? it goes back to the pile)</p>
      </div>
    </GameShell>
  )
}
