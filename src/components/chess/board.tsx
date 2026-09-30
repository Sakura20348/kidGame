import type { CSSProperties } from "react"
import type { Chess, Color, PieceSymbol, Square } from "chess.js"

import { pieceName } from "@/data/chess-opponents"
import { cn } from "@/lib/utils"

// Filled glyphs for both colours (coloured with CSS). ︎ forces the text
// version so "♟" isn't drawn as an emoji.
const glyph: Record<PieceSymbol, string> = {
  k: "♚︎",
  q: "♛︎",
  r: "♜︎",
  b: "♝︎",
  n: "♞︎",
  p: "♟︎",
}

const FILES = "abcdefgh"

type BoardProps = {
  game: Chess
  orientation: Color
  selected: Square | null
  targets: { to: Square; capture: boolean }[]
  lastMove?: { from: Square; to: Square }
  hint?: { from: Square; to: Square } | null
  /** changes on every move – restarts the slide animation */
  moveKey: number
  disabled: boolean
  onSquare: (sq: Square) => void
}

export function ChessBoard({ game, orientation, selected, targets, lastMove, hint, moveKey, disabled, onSquare }: BoardProps) {
  const rows = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const cols = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const board = game.board()
  const checkSquare = game.inCheck() ? findKing(game, game.turn()) : null

  // screen position (0–7) of a square, for the slide-in animation
  const pos = (sq: Square) => {
    const c = FILES.indexOf(sq[0])
    const r = 8 - Number(sq[1])
    return { x: cols.indexOf(c), y: rows.indexOf(r) }
  }

  return (
    <div className="rounded-[22px] bg-[#8B5A2B] p-2 shadow-[0_10px_0_rgba(0,0,0,0.18)] sm:p-3 dark:bg-[#4A3222]">
      <div
        role="grid"
        aria-label="Chess board"
        className="@container grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-[14px]"
      >
        {rows.map((r, ri) =>
          cols.map((c, ci) => {
            const sq = `${FILES[c]}${8 - r}` as Square
            const piece = board[r][c]
            const light = (r + c) % 2 === 0
            const target = targets.find((t) => t.to === sq)
            const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq)
            const isHint = hint && (hint.from === sq || hint.to === sq)
            const animate = lastMove && lastMove.to === sq && piece
            const from = animate ? pos(lastMove.from) : null
            const style = from
              ? ({ "--dx": `${(from.x - ci) * 100}%`, "--dy": `${(from.y - ri) * 100}%` } as CSSProperties)
              : undefined

            return (
              <button
                key={sq}
                type="button"
                role="gridcell"
                aria-label={`${sq}${piece ? `, ${piece.color === "w" ? "white" : "black"} ${pieceName[piece.type]}` : ""}`}
                aria-selected={selected === sq}
                disabled={disabled}
                onClick={() => onSquare(sq)}
                className={cn(
                  "relative flex items-center justify-center outline-none disabled:cursor-default",
                  light ? "bg-[#F6E7C8] dark:bg-[#D9C7A2]" : "bg-[#C9955F] dark:bg-[#A8784A]",
                  "focus-visible:z-10 focus-visible:shadow-[inset_0_0_0_4px_#6C63FF]"
                )}
              >
                {/* highlights */}
                {isLast && <span className="absolute inset-0 bg-[#FFD166]/45" />}
                {selected === sq && <span className="absolute inset-0 bg-[#6BCB77]/55" />}
                {isHint && <span className="absolute inset-[6%] animate-pulse rounded-[18%] ring-4 ring-[#6C63FF]" />}
                {checkSquare === sq && (
                  <span className="absolute inset-0 bg-[radial-gradient(circle,#FF5E7E_0%,#FF5E7Eaa_40%,transparent_72%)]" />
                )}

                {/* coordinates on the edge squares */}
                {ci === 0 && (
                  <span className={cn("absolute top-[3%] left-[5%] text-[2.2cqw] font-bold", light ? "text-[#A8784A]" : "text-[#F6E7C8]")}>
                    {8 - r}
                  </span>
                )}
                {ri === 7 && (
                  <span className={cn("absolute right-[6%] bottom-[2%] text-[2.2cqw] font-bold", light ? "text-[#A8784A]" : "text-[#F6E7C8]")}>
                    {FILES[c]}
                  </span>
                )}

                {piece && (
                  <span
                    key={animate ? `${sq}-${moveKey}` : sq}
                    style={style}
                    className={cn(
                      "relative z-[1] select-none leading-none text-[10cqw] chess-glyph transition-transform duration-150",
                      piece.color === "w"
                        ? "text-white [paint-order:stroke_fill] [-webkit-text-stroke:0.35cqw_#2B2140] drop-shadow-[0_0.5cqw_0_rgba(0,0,0,0.25)]"
                        : "text-[#2B2140] drop-shadow-[0_0.5cqw_0_rgba(0,0,0,0.18)]",
                      selected === sq && "-translate-y-[4%] scale-110",
                      animate && "animate-piece-move"
                    )}
                  >
                    {glyph[piece.type]}
                  </span>
                )}

                {/* legal move markers */}
                {target &&
                  (target.capture ? (
                    <span className="absolute inset-[4%] rounded-full border-[0.9cqw] border-[#2B2140]/30" />
                  ) : (
                    <span className="absolute size-[30%] rounded-full bg-[#2B2140]/25" />
                  ))}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export function PieceGlyph({ type, color, className }: { type: PieceSymbol; color: Color; className?: string }) {
  return (
    <span
      className={cn(
        "leading-none chess-glyph",
        color === "w" ? "text-white [paint-order:stroke_fill] [-webkit-text-stroke:1.5px_#2B2140]" : "text-[#2B2140] dark:text-[#CFC6E8]",
        className
      )}
    >
      {glyph[type]}
    </span>
  )
}

function findKing(game: Chess, color: Color): Square | null {
  const board = game.board()
  for (const row of board) for (const sq of row) if (sq && sq.type === "k" && sq.color === color) return sq.square
  return null
}
