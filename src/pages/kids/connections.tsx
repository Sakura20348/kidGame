import { useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { Reveal } from "@/components/motion/reveal"
import { connLevelForClass, connLevels, connPuzzles, groupColors, type ConnLevel, type ConnPuzzle } from "@/data/connections"
import { kidsGames, shuffle } from "@/data/kids-games"
import { findAccount } from "@/lib/accounts"
import { useAuth, useKids } from "@/lib/contexts"
import { cn } from "@/lib/utils"
import { GameShell, KidButton, ResultScreen } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "memory")!

type Card = { word: string; emoji?: string; group: number }

function deal(p: ConnPuzzle): Card[] {
  return shuffle(p.groups.flatMap((g, group) => g.words.map((word, i) => ({ word, emoji: g.emojis?.[i], group }))))
}

/** Fewer mistakes = more stars. */
const connStars = (mistakes: number, lost: boolean) => (lost ? 0 : mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1)

/** "Associate Words: Connections" – find the groups of words that belong together. */
export function Connections({ modeSwitch }: { modeSwitch: ReactNode }) {
  const { email } = useAuth()
  const { award } = useKids()
  const suggested = connLevelForClass(findAccount(email)?.ageGroup)
  // "&level=c0…c4" opens a level straight away
  const [params] = useSearchParams()
  const linked = connLevels.find((l) => l.id === params.get("level"))?.id ?? null
  const [level, setLevel] = useState<ConnLevel | null>(linked)
  const [order, setOrder] = useState<number[]>(() => (linked ? shuffle(connPuzzles[linked].map((_, i) => i)) : [])) // puzzle order for this level
  const [pIndex, setPIndex] = useState(0)
  const [cards, setCards] = useState<Card[]>(() => (linked ? deal(connPuzzles[linked][order[0]]) : []))
  const [picked, setPicked] = useState<string[]>([])
  const [found, setFound] = useState<number[]>([]) // group indexes, in the order found
  const [mistakes, setMistakes] = useState(0)
  const [shake, setShake] = useState(false)
  const [finished, setFinished] = useState<null | "won" | "lost">(null)
  const [showResult, setShowResult] = useState(false)

  const info = connLevels.find((l) => l.id === level)
  const puzzle = level ? connPuzzles[level][order[pIndex] ?? 0] : null
  const size = puzzle?.groups[0].words.length ?? 4

  function load(l: ConnLevel, list: number[], i: number) {
    const p = connPuzzles[l][list[i]]
    setPIndex(i)
    setCards(deal(p))
    setPicked([])
    setFound([])
    setMistakes(0)
    setFinished(null)
    setShowResult(false)
  }

  function start(l: ConnLevel) {
    const list = shuffle(connPuzzles[l].map((_, i) => i))
    setLevel(l)
    setOrder(list)
    load(l, list, 0)
  }

  function toggle(word: string) {
    if (finished) return
    setPicked((p) => (p.includes(word) ? p.filter((w) => w !== word) : p.length < size ? [...p, word] : p))
  }

  function submit() {
    if (!puzzle || !info || picked.length !== size || finished) return
    const groups = picked.map((w) => cards.find((c) => c.word === w)!.group)
    const counts = groups.reduce<Record<number, number>>((m, gi) => ({ ...m, [gi]: (m[gi] ?? 0) + 1 }), {})
    const best = Math.max(...Object.values(counts))
    if (best === size) {
      const next = [...found, groups[0]]
      setFound(next)
      setCards((c) => c.filter((card) => !picked.includes(card.word)))
      setPicked([])
      if (next.length === puzzle.groups.length) {
        setFinished("won")
        award(game.id, connStars(mistakes, false))
        setTimeout(() => setShowResult(true), 1200)
      }
      return
    }
    const nextMistakes = mistakes + 1
    setMistakes(nextMistakes)
    setShake(true)
    setTimeout(() => setShake(false), 500)
    if (best === size - 1) toast("So close — one away! 🤏")
    if (nextMistakes >= info.hearts) {
      // out of hearts: show every group
      setFinished("lost")
      setFound((f) => [...f, ...puzzle.groups.map((_, i) => i).filter((i) => !f.includes(i))])
      setCards([])
      setPicked([])
      award(game.id, 0)
      setTimeout(() => setShowResult(true), 2200)
    }
  }

  // ------------------------------------------------------------ choose a level
  if (!level || !puzzle || !info) {
    return (
      <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
        {modeSwitch}
        <Reveal>
          <h2 className="text-4xl font-semibold">Connections 🔗</h2>
          <p className="mt-2 text-lg opacity-75">Find the words that belong together. Pick a group, then press Submit!</p>
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
                  <span className="mt-1 block text-base font-medium opacity-75">{l.blurb}</span>
                  <span className="mt-3 block text-sm font-semibold opacity-70">
                    {connPuzzles[l.id].length} puzzles · {l.hearts} hearts
                  </span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </GameShell>
    )
  }

  // ------------------------------------------------------------ result
  if (showResult) {
    const stars = connStars(mistakes, finished === "lost")
    const more = pIndex + 1 < order.length
    return (
      <GameShell game={game} round={1} total={1} score={found.length}>
        <ResultScreen
          game={game}
          stars={stars}
          message={finished === "won" ? `You found all ${puzzle.groups.length} groups with ${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}!` : "Out of hearts — but now you know the groups! Try another one."}
          onReplay={() => (more ? load(level, order, pIndex + 1) : start(level))}
        />
      </GameShell>
    )
  }

  // ------------------------------------------------------------ play
  const cols = size === 3 ? "grid-cols-3" : "grid-cols-4"
  return (
    <GameShell game={game} round={found.length} total={puzzle.groups.length} score={found.length}>
      {modeSwitch}
      <div className="rounded-[32px] bg-white p-5 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-8 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-semibold opacity-75">
            {info.emoji} Find {puzzle.groups.length} groups of {size} · puzzle {pIndex + 1} of {order.length}
          </p>
          <p className="text-2xl" aria-label={`${info.hearts - mistakes} hearts left`}>
            {Array.from({ length: info.hearts }, (_, i) => (
              <span key={i} aria-hidden className={i < info.hearts - mistakes ? "" : "opacity-20 grayscale"}>
                ❤️
              </span>
            ))}
          </p>
        </div>

        {/* found groups */}
        <div className="mt-5 space-y-2.5">
          {found.map((gi, i) => {
            const group = puzzle.groups[gi]
            return (
              <div key={gi} className={cn("animate-kid-pop rounded-[20px] px-5 py-3 text-center", groupColors[i % groupColors.length], finished === "lost" && "opacity-90")}>
                <p className="text-lg font-bold tracking-wide uppercase">{group.name}</p>
                <p className="text-base font-medium">{group.words.map((w, j) => `${group.emojis?.[j] ? `${group.emojis[j]} ` : ""}${w}`).join(" · ")}</p>
              </div>
            )
          })}
        </div>

        {/* cards */}
        {cards.length > 0 && (
          <div className={cn("mt-3 grid gap-2.5 sm:gap-3", cols, shake && "animate-kid-shake")}>
            {cards.map((c) => {
              const on = picked.includes(c.word)
              return (
                <button
                  key={c.word}
                  type="button"
                  onClick={() => toggle(c.word)}
                  aria-pressed={on}
                  className={cn(
                    "flex min-h-20 flex-col items-center justify-center rounded-[18px] px-1.5 py-3 text-center font-semibold uppercase outline-none transition-[transform,background-color] focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 active:translate-y-0.5",
                    c.word.length > 9 ? "text-sm sm:text-base" : "text-base sm:text-lg",
                    on ? "-translate-y-0.5 bg-[#5A5476] text-white shadow-[0_5px_0_#3B3654]" : "bg-[#EFEBE3] text-[#2B2140] shadow-[0_5px_0_#D9D2C3] dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.06)]"
                  )}
                >
                  {c.emoji && (
                    <span aria-hidden className="mb-1 text-4xl leading-none normal-case sm:text-5xl">
                      {c.emoji}
                    </span>
                  )}
                  <span className="break-words">{c.word}</span>
                </button>
              )
            })}
          </div>
        )}

        {!finished && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <KidButton onClick={() => setCards((c) => shuffle(c))} className="h-14 bg-[#F1ECFF] px-6 text-lg text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white dark:shadow-none">
              🔀 Shuffle
            </KidButton>
            <KidButton onClick={() => setPicked([])} disabled={picked.length === 0} className="h-14 bg-transparent px-6 text-lg opacity-70 shadow-none disabled:opacity-40">
              Deselect
            </KidButton>
            <KidButton onClick={submit} disabled={picked.length !== size} className="h-14 bg-[#6C63FF] px-8 text-lg text-white shadow-[0_5px_0_#4B42D6] disabled:opacity-50">
              Submit ({picked.length}/{size})
            </KidButton>
          </div>
        )}
        {finished === "won" && <p className="mt-6 text-center text-2xl font-bold">🎉 You found every group!</p>}
        {finished === "lost" && <p className="mt-6 text-center text-xl font-semibold">Out of hearts — here are the groups 👆</p>}
      </div>
    </GameShell>
  )
}
