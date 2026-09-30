import { useEffect, useEffectEvent, useMemo, useRef, useState, type ReactNode } from "react"
import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Flag01Icon, Idea01Icon, Undo02Icon } from "@hugeicons/core-free-icons"

import { ChessBoard, PieceGlyph } from "@/components/chess/board"
import { OpponentAvatar, SpeechBubble } from "@/components/chess/opponent-chat"
import { Reveal } from "@/components/motion/reveal"
import {
  eventMood,
  lineFor,
  opponents,
  pieceName,
  type ChatEvent,
  type Mood,
  type Opponent,
} from "@/data/chess-opponents"
import { kidsGames } from "@/data/kids-games"
import { useChessAI } from "@/hooks/use-chess-ai"
import type { AiMove } from "@/lib/chess-ai"
import { useAuth, useKids } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { cn } from "@/lib/utils"
import { GameShell, KidButton } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "chess")!
const LEGACY_BEATEN_KEY = "pragmalab.chess.beaten" // before it was per account
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** Opponents this account has beaten (kept per email). */
function readBeaten(email: string | null): number[] {
  try {
    const own = localStorage.getItem(kidsKey(email, "chess.beaten"))
    if (own) return JSON.parse(own)
    const legacy = localStorage.getItem(LEGACY_BEATEN_KEY)
    if (legacy) {
      localStorage.setItem(kidsKey(email, "chess.beaten"), legacy)
      localStorage.removeItem(LEGACY_BEATEN_KEY)
    }
    return JSON.parse(legacy ?? "[]")
  } catch {
    return []
  }
}

/** Win vs harder friends = more stars. */
function chessStars(result: "win" | "draw" | "loss", level: number) {
  if (result === "win") return level <= 1 ? 1 : level <= 3 ? 2 : 3
  if (result === "draw") return level >= 3 ? 1 : 0
  return 0
}

type ColorChoice = "w" | "b" | "random"

export default function ChessPage() {
  const [opponent, setOpponent] = useState<Opponent | null>(null)
  const [playerColor, setPlayerColor] = useState<Color>("w")
  const [choice, setChoice] = useState<ColorChoice>("w")
  const [round, setRound] = useState(0) // new game → new round (resets the game view)

  function start(op: Opponent, c: ColorChoice = choice) {
    setOpponent(op)
    setPlayerColor(c === "random" ? (Math.random() < 0.5 ? "w" : "b") : c)
    setRound((n) => n + 1)
  }

  return (
    <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
      {opponent ? (
        <ChessGame
          key={round}
          opponent={opponent}
          playerColor={playerColor}
          onRematch={() => start(opponent, playerColor === "w" ? "b" : "w")}
          onChooseOpponent={() => setOpponent(null)}
        />
      ) : (
        <OpponentPicker choice={choice} onChoice={setChoice} onPick={(op) => start(op)} />
      )}
    </GameShell>
  )
}

// =================================================================== picker

function OpponentPicker({
  choice,
  onChoice,
  onPick,
}: {
  choice: ColorChoice
  onChoice: (c: ColorChoice) => void
  onPick: (op: Opponent) => void
}) {
  const { email } = useAuth()
  const [beaten] = useState(() => readBeaten(email))

  return (
    <div>
      <Reveal className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h2 className="text-4xl font-semibold">Choose your opponent</h2>
          <p className="mt-2 text-lg opacity-75">Five chess friends, from 1/5 (easy) to 5/5 (champion). Beat them all!</p>
        </div>
        <div role="radiogroup" aria-label="Play as" className="flex gap-2 rounded-[20px] bg-white/80 p-1.5 shadow-[0_4px_0_rgba(0,0,0,0.06)] dark:bg-white/5">
          {(
            [
              ["w", "White", "♔"],
              ["random", "Random", "🎲"],
              ["b", "Black", "♚"],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={choice === id}
              onClick={() => onChoice(id)}
              className={cn(
                "flex h-12 items-center gap-2 rounded-[16px] px-4 text-lg font-semibold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40",
                choice === id ? "bg-[#6C63FF] text-white" : "opacity-70 hover:opacity-100"
              )}
            >
              <span aria-hidden className="text-2xl leading-none">
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
        {opponents.map((op, i) => (
          <Reveal key={op.level} delay={i * 90} className="flex *:flex-1">
            <button
              type="button"
              onClick={() => onPick(op)}
              className={cn(
                "group relative flex min-h-[330px] flex-col overflow-hidden rounded-[32px] bg-linear-to-br p-6 text-left text-white shadow-[0_8px_0_rgba(0,0,0,0.18)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,0.18)]",
                op.tile
              )}
            >
              <span aria-hidden className="absolute -top-10 -right-10 size-36 rounded-full bg-white/15" />
              <span aria-hidden className="absolute -bottom-12 -left-8 size-28 rounded-full bg-white/10" />

              <span className="relative flex items-center justify-between">
                <span className="rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">
                  {op.level}/5 · {op.difficulty}
                </span>
                {beaten.includes(op.level) && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#2B2140]">Beaten ✓</span>
                )}
              </span>
              <span
                aria-hidden
                className="relative my-4 self-center text-[92px] leading-none drop-shadow-[0_6px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
              >
                {op.face}
              </span>
              <span className="relative mt-auto text-2xl font-semibold">{op.name}</span>
              <span className="relative text-sm font-medium opacity-90">{op.title}</span>
              <span className="relative mt-2 text-[15px] leading-snug opacity-90">{op.tagline}</span>
              <span className="relative mt-3 flex gap-1.5" aria-label={`Difficulty ${op.level} of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={cn("h-2 flex-1 rounded-full", n <= op.level ? "bg-white" : "bg-white/30")} />
                ))}
              </span>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

// =================================================================== game

type Chat = { id: number; text: string; mood: Mood }

function ChessGame({
  opponent,
  playerColor,
  onRematch,
  onChooseOpponent,
}: {
  opponent: Opponent
  playerColor: Color
  onRematch: () => void
  onChooseOpponent: () => void
}) {
  const { name, initials, email } = useAuth()
  const { award } = useKids()
  const think = useChessAI()

  const [moves, setMoves] = useState<string[]>([]) // LAN, e.g. "e2e4"
  const [selected, setSelected] = useState<Square | null>(null)
  const [hint, setHint] = useState<AiMove | null>(null)
  const [resigned, setResigned] = useState(false)
  const [chat, setChat] = useState<Chat>(() => ({ id: 0, text: lineFor(opponent, "greet"), mood: "happy" }))
  const [log, setLog] = useState<Chat[]>(() => [])
  const [hintLoading, setHintLoading] = useState(false)
  const awarded = useRef(false)
  const chatRef = useRef(chat) // latest line, readable from delayed callbacks
  const fenRef = useRef("")

  // The whole game is replayed from the move list, so it's always consistent.
  const chess = useMemo(() => {
    const c = new Chess()
    for (const m of moves) c.move(m)
    return c
  }, [moves])
  const history = useMemo(() => chess.history({ verbose: true }), [chess])
  const last = history.at(-1)
  const aiColor: Color = playerColor === "w" ? "b" : "w"
  const over = resigned || chess.isGameOver()
  const playerTurn = !over && chess.turn() === playerColor
  const thinking = !over && chess.turn() === aiColor // it's the opponent's move

  useEffect(() => {
    fenRef.current = chess.fen()
  }, [chess])

  function say(event: ChatEvent, piece?: PieceSymbol) {
    const prev = chatRef.current
    const next = {
      id: prev.id + 1,
      text: lineFor(opponent, event, piece ? pieceName[piece] : undefined, prev.text),
      mood: eventMood[event],
    }
    chatRef.current = next
    setChat(next)
    setLog((l) => [prev, ...l].slice(0, 30))
  }

  /** Plays a move on top of the current list and lets the opponent react. */
  function apply(move: AiMove, by: "player" | "ai") {
    const c = new Chess()
    for (const m of moves) c.move(m)
    let done: Move
    try {
      done = c.move(move)
    } catch {
      return
    }
    setMoves([...moves, done.lan])
    setSelected(null)
    setHint(null)

    if (c.isCheckmate()) say(by === "ai" ? "aiWins" : "playerWins")
    else if (c.isDraw() || c.isStalemate()) say("draw")
    else if (c.inCheck()) say(by === "ai" ? "aiChecks" : "playerChecks")
    else if (done.captured) say(by === "ai" ? "aiCaptures" : "playerCaptures", done.captured)
    else if (by === "ai" && Math.random() < 0.2) say("banter")
  }

  // Latest apply/say, callable from the effect below without re-running it
  const playAiMove = useEffectEvent((move: AiMove) => apply(move, "ai"))
  const sayThinking = useEffectEvent(() => say("thinking"))

  // Opponent's turn: ask the engine (in the worker), wait a "human" moment, play.
  // Any change to the position (undo, resign, leaving) cancels the request.
  useEffect(() => {
    if (over || chess.turn() !== aiColor) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const started = Date.now()
    const minThink = 650 + Math.random() * 600
    if (Math.random() < 0.25) sayThinking()
    think(chess.fen(), opponent.level).then((move) => {
      if (cancelled) return
      timer = setTimeout(() => {
        if (!cancelled && move) playAiMove(move)
      }, Math.max(0, minThink - (Date.now() - started)))
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [chess, over, aiColor, opponent.level, think])

  // Stars + "Beaten ✓" once the game ends.
  useEffect(() => {
    if (!over || awarded.current) return
    awarded.current = true
    const result = resigned ? "loss" : chess.isCheckmate() ? (chess.turn() === playerColor ? "loss" : "win") : "draw"
    award(game.id, chessStars(result, opponent.level))
    if (result === "win") {
      const beaten = new Set(readBeaten(email)).add(opponent.level)
      try {
        localStorage.setItem(kidsKey(email, "chess.beaten"), JSON.stringify([...beaten]))
      } catch {
        // ignore
      }
    }
  }, [over, resigned, chess, playerColor, opponent.level, award, email])

  function onSquare(sq: Square) {
    if (!playerTurn) return
    if (selected) {
      const legal = chess.moves({ square: selected, verbose: true }).find((m) => m.to === sq)
      if (legal) {
        // pawns always promote to a queen – simplest for young players
        apply({ from: selected, to: sq, promotion: legal.promotion ? "q" : undefined }, "player")
        return
      }
    }
    const piece = chess.get(sq)
    setSelected(piece && piece.color === playerColor && sq !== selected ? sq : null)
  }

  function undo() {
    const list = moves.slice()
    // remove moves until it's the player's turn again (their last move included)
    do list.pop()
    while (list.length && (list.length % 2 === 0 ? "w" : "b") !== playerColor)
    setMoves(list)
    setSelected(null)
    setHint(null)
    setResigned(false)
    awarded.current = false
    say("undo")
  }

  async function askHint() {
    say("hint")
    setHintLoading(true)
    const fen = chess.fen()
    const move = await think(fen, 4)
    setHintLoading(false)
    if (move && fenRef.current === fen) setHint(move) // ignore if the position changed
  }

  function resign() {
    setResigned(true)
    say("resign")
  }

  const targets = selected
    ? chess.moves({ square: selected, verbose: true }).map((m) => ({ to: m.to, capture: !!m.captured }))
    : []

  // captured pieces + material difference
  const lostBy = (color: Color) => history.filter((m) => m.captured && m.color !== color).map((m) => m.captured!)
  const playerLost = lostBy(playerColor)
  const aiLost = lostBy(aiColor)
  const material = aiLost.reduce((s, p) => s + VALUE[p], 0) - playerLost.reduce((s, p) => s + VALUE[p], 0)

  const result = !over ? null : resigned ? "resigned" : chess.isCheckmate() ? (chess.turn() === playerColor ? "loss" : "win") : "draw"
  const status = over
    ? null
    : thinking
      ? `${opponent.name} is thinking`
      : playerTurn
        ? chess.inCheck()
          ? "Check! Save your king"
          : "Your turn"
        : ""

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,720px)_minmax(320px,1fr)]">
      {/* ---------------- board column */}
      <div className="mx-auto w-full max-w-[720px]">
        <PlayerStrip
          avatar={<OpponentAvatar opponent={opponent} size="sm" />}
          name={`${opponent.name} · ${opponent.level}/5`}
          lost={playerLost}
          lostColor={playerColor}
          advantage={material < 0 ? -material : 0}
          active={!over && chess.turn() === aiColor}
          thinking={thinking}
        />
        <div className="relative my-3">
          <ChessBoard
            game={chess}
            orientation={playerColor}
            selected={selected}
            targets={targets}
            lastMove={last ? { from: last.from, to: last.to } : undefined}
            hint={hint ? { from: hint.from as Square, to: hint.to as Square } : null}
            moveKey={moves.length}
            disabled={!playerTurn}
            onSquare={onSquare}
          />
          {result && (
            <GameOver
              result={result}
              opponent={opponent}
              stars={chessStars(result === "resigned" ? "loss" : result, opponent.level)}
              onRematch={onRematch}
              onChooseOpponent={onChooseOpponent}
            />
          )}
        </div>
        <PlayerStrip
          avatar={
            <span className="flex size-12 items-center justify-center rounded-full bg-[#F2B46B] text-sm font-extrabold text-green-900 shadow-[0_5px_0_rgba(0,0,0,0.15)]">
              {initials}
            </span>
          }
          name={`${name.split(" ")[0] || "You"} · ${playerColor === "w" ? "White" : "Black"}`}
          lost={aiLost}
          lostColor={aiColor}
          advantage={material > 0 ? material : 0}
          active={playerTurn}
        />
      </div>

      {/* ---------------- side panel */}
      <div className="flex flex-col gap-5">
        <section className="rounded-[32px] bg-white/80 p-5 shadow-[0_8px_0_rgba(43,33,64,0.06)] dark:bg-white/5">
          <div className="flex items-start gap-4">
            <OpponentAvatar opponent={opponent} mood={thinking ? "thinking" : chat.mood} talkKey={chat.id} />
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-2xl font-semibold">{opponent.name}</p>
              <p className="text-sm opacity-70">
                {opponent.title} · {opponent.level}/5 {opponent.difficulty}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <SpeechBubble text={chat.text} id={chat.id} />
          </div>
          {status && (
            <p
              className={cn(
                "mt-4 flex items-center gap-2 text-lg font-semibold",
                playerTurn && chess.inCheck() ? "text-[#E5484D]" : playerTurn ? "text-[#1F9D6B] dark:text-[#6BCB77]" : "opacity-75"
              )}
              aria-live="polite"
            >
              {playerTurn ? "👉" : "💭"} {status}
              {thinking && <ThinkingDots />}
            </p>
          )}
        </section>

        <div className="grid grid-cols-3 gap-3">
          <KidButton
            onClick={askHint}
            disabled={!playerTurn || hintLoading}
            className="h-auto flex-col gap-1 bg-[#FFF1D6] py-3 text-base text-[#8B5A2B] shadow-[0_5px_0_#F0D9A8] disabled:opacity-40 dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"
          >
            <HugeiconsIcon icon={Idea01Icon} className={cn("size-6", hintLoading && "animate-pulse")} />
            {hintLoading ? "Thinking…" : "Hint"}
          </KidButton>
          <KidButton
            onClick={undo}
            disabled={moves.length === 0 || (moves.length === 1 && playerColor === "b")}
            className="h-auto flex-col gap-1 bg-[#F1ECFF] py-3 text-base text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] disabled:opacity-40 dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"
          >
            <HugeiconsIcon icon={Undo02Icon} className="size-6" />
            Undo
          </KidButton>
          <KidButton
            onClick={resign}
            disabled={over}
            className="h-auto flex-col gap-1 bg-[#FFE4EA] py-3 text-base text-[#C0304F] shadow-[0_5px_0_#FFC2CF] disabled:opacity-40 dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"
          >
            <HugeiconsIcon icon={Flag01Icon} className="size-6" />
            Resign
          </KidButton>
        </div>

        <section className="rounded-[28px] bg-white/80 p-5 shadow-[0_8px_0_rgba(43,33,64,0.06)] dark:bg-white/5">
          <h3 className="text-lg font-semibold">Moves</h3>
          {history.length === 0 ? (
            <p className="mt-2 opacity-60">No moves yet. {playerColor === "w" ? "You start!" : `${opponent.name} starts.`}</p>
          ) : (
            <ol className="mt-2 grid max-h-44 grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 overflow-y-auto font-mono text-[15px]" data-lenis-prevent>
              {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
                <li key={i} className="contents">
                  <span className="opacity-50">{i + 1}.</span>
                  <span>{history[i * 2]?.san}</span>
                  <span>{history[i * 2 + 1]?.san ?? ""}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {log.length > 0 && (
          <section className="rounded-[28px] bg-white/60 p-5 dark:bg-white/5">
            <h3 className="text-lg font-semibold">What {opponent.name} said</h3>
            <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-[15px] opacity-80" data-lenis-prevent>
              {log.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <span aria-hidden>{opponent.face}</span>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <button
          type="button"
          onClick={onChooseOpponent}
          className="flex items-center justify-center gap-2 self-center rounded-full px-4 py-2 text-[15px] font-medium opacity-70 outline-none hover:opacity-100 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          Choose another opponent
        </button>
      </div>
    </div>
  )
}

// =================================================================== pieces

function PlayerStrip({
  avatar,
  name,
  lost,
  lostColor,
  advantage,
  active,
  thinking,
}: {
  avatar: ReactNode
  name: string
  lost: PieceSymbol[]
  lostColor: Color
  advantage: number
  active: boolean
  thinking?: boolean
}) {
  const order: PieceSymbol[] = ["q", "r", "b", "n", "p"]
  const sorted = [...lost].sort((a, b) => order.indexOf(a) - order.indexOf(b))
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] px-3 py-2 transition-colors",
        active ? "bg-white/90 shadow-[0_4px_0_rgba(43,33,64,0.06)] dark:bg-white/10" : "bg-transparent"
      )}
    >
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-lg font-semibold">
          {name}
          {thinking && <ThinkingDots />}
        </p>
        <p className="flex h-6 items-center gap-0.5 text-xl" aria-label={`Captured: ${sorted.map((p) => pieceName[p]).join(", ") || "none"}`}>
          {sorted.map((p, i) => (
            <PieceGlyph key={i} type={p} color={lostColor} className="-mr-1" />
          ))}
          {advantage > 0 && <span className="ml-2 text-sm font-bold opacity-70">+{advantage}</span>}
        </p>
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  )
}

function GameOver({
  result,
  opponent,
  stars,
  onRematch,
  onChooseOpponent,
}: {
  result: "win" | "loss" | "draw" | "resigned"
  opponent: Opponent
  stars: number
  onRematch: () => void
  onChooseOpponent: () => void
}) {
  const view = {
    win: { emoji: "🏆", title: "You won!", text: `You beat ${opponent.name}!` },
    loss: { emoji: "💪", title: "Checkmate", text: `${opponent.name} won this time. Try again!` },
    draw: { emoji: "🤝", title: "It’s a draw", text: "Nobody could win. Well played!" },
    resigned: { emoji: "🏳️", title: "You resigned", text: "Every champion loses sometimes." },
  }[result]

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[22px] bg-[#14121F]/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[380px] animate-kid-pop rounded-[28px] bg-white p-7 text-center text-[#2B2140] shadow-2xl dark:bg-[#1E1B2E] dark:text-[#F3EEFF]">
        <p className="text-6xl" aria-hidden>
          {view.emoji}
        </p>
        <p className="mt-3 text-4xl font-semibold">{view.title}</p>
        <p className="mt-1 text-lg opacity-75">{view.text}</p>
        <div className="mt-4 flex justify-center gap-2 text-4xl" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <span key={n} aria-hidden className={cn("animate-kid-pop", n > stars && "opacity-25 grayscale")} style={{ animationDelay: `${n * 0.15}s` }}>
              ⭐
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <KidButton autoFocus onClick={onRematch} className={cn("bg-linear-to-br text-white", opponent.tile)}>
            Rematch (swap colours)
          </KidButton>
          <KidButton
            onClick={onChooseOpponent}
            className="bg-[#F1ECFF] text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"
          >
            Choose opponent
          </KidButton>
        </div>
      </div>
    </div>
  )
}
