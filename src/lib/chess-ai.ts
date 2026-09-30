// Small chess engine for the kids' Chess game.
// Negamax + alpha-beta, material + piece-square tables, iterative deepening
// with a time limit. Each difficulty level searches deeper and adds less noise.
// Runs inside a Web Worker (see src/workers/chess-ai.worker.ts).
import { Chess, type Move, type PieceSymbol } from "chess.js"

export type Level = 1 | 2 | 3 | 4 | 5
export type AiMove = { from: string; to: string; promotion?: string }

type LevelConfig = {
  depth: number // max search depth (plies)
  random: number // chance to play a random legal move
  noise: number // ± centipawns added to each root move (makes mistakes)
  slack: number // choose among moves within this many cp of the best
  quiescence: boolean // keep searching captures at the leaves
  timeMs: number
}

export const levelConfig: Record<Level, LevelConfig> = {
  1: { depth: 1, random: 0.7, noise: 300, slack: 150, quiescence: false, timeMs: 300 },
  2: { depth: 1, random: 0.25, noise: 120, slack: 60, quiescence: false, timeMs: 400 },
  3: { depth: 2, random: 0.06, noise: 45, slack: 25, quiescence: false, timeMs: 900 },
  4: { depth: 3, random: 0, noise: 15, slack: 12, quiescence: false, timeMs: 1600 },
  5: { depth: 4, random: 0, noise: 0, slack: 6, quiescence: true, timeMs: 2600 },
}

const VALUE: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
const MATE = 100_000

// Piece-square tables from White's point of view, a8 → h1 (row 0 = rank 8).
// Source: "Simplified Evaluation Function" (chessprogramming wiki).
const PST: Record<PieceSymbol, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15,
    20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10,
    5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10,
    -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0,
    0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0,
    -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10,
    -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40,
    -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20,
    -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
  ],
}

/** Static evaluation from White's point of view, in centipawns. */
export function evaluate(game: Chess) {
  let score = 0
  const board = game.board()
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c]
      if (!sq) continue
      // Black reads the table mirrored vertically
      const idx = sq.color === "w" ? r * 8 + c : (7 - r) * 8 + c
      const v = VALUE[sq.type] + PST[sq.type][idx]
      score += sq.color === "w" ? v : -v
    }
  }
  return score
}

const sideEval = (game: Chess) => (game.turn() === "w" ? 1 : -1) * evaluate(game)

function orderScore(m: Move) {
  let s = 0
  if (m.captured) s += 10 * VALUE[m.captured] - VALUE[m.piece] + 1000
  if (m.promotion) s += 800
  if (m.san.includes("+")) s += 50
  return s
}

const ordered = (moves: Move[]) => moves.sort((a, b) => orderScore(b) - orderScore(a))
const play = (game: Chess, m: Move) => game.move({ from: m.from, to: m.to, promotion: m.promotion })

class Timeout extends Error {}

type Ctx = { deadline: number; quiescence: boolean; nodes: number }

function quiesce(game: Chess, alpha: number, beta: number, qDepth: number): number {
  const stand = sideEval(game)
  if (stand >= beta) return beta
  if (stand > alpha) alpha = stand
  if (qDepth >= 4) return alpha
  const captures = ordered(game.moves({ verbose: true }).filter((m) => m.captured || m.promotion))
  for (const m of captures) {
    play(game, m)
    const score = -quiesce(game, -beta, -alpha, qDepth + 1)
    game.undo()
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, ply: number, ctx: Ctx): number {
  if ((++ctx.nodes & 255) === 0 && Date.now() > ctx.deadline) throw new Timeout()
  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return game.inCheck() ? -MATE + ply : 0 // checkmate / stalemate
  if (depth === 0) return ctx.quiescence ? quiesce(game, alpha, beta, 0) : sideEval(game)
  for (const m of ordered(moves)) {
    play(game, m)
    const score = -negamax(game, depth - 1, -beta, -alpha, ply + 1, ctx)
    game.undo()
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

/** Picks a move for the side to move in `fen`. */
export function chooseMove(fen: string, level: Level, rand: () => number = Math.random): AiMove | null {
  const cfg = levelConfig[level]
  const game = new Chess(fen)
  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return null
  const pick = (m: Move): AiMove => ({ from: m.from, to: m.to, promotion: m.promotion })

  if (rand() < cfg.random) {
    // Beginners grab a free piece sometimes, otherwise play anything
    const captures = moves.filter((m) => m.captured)
    const pool = captures.length && rand() < 0.4 ? captures : moves
    return pick(pool[Math.floor(rand() * pool.length)])
  }

  const ctx: Ctx = { deadline: Date.now() + cfg.timeMs, quiescence: cfg.quiescence, nodes: 0 }
  let scored = ordered(moves).map((m) => ({ m, score: 0 }))

  // Iterative deepening: keep the last fully finished depth if time runs out.
  for (let depth = 1; depth <= cfg.depth; depth++) {
    try {
      const next = scored.map(({ m }) => {
        play(game, m)
        const score = -negamax(game, depth - 1, -MATE - 1, MATE + 1, 1, ctx)
        game.undo()
        return { m, score }
      })
      next.sort((a, b) => b.score - a.score)
      scored = next
      if (scored[0].score > MATE - 100) break // found a mate
    } catch (e) {
      if (!(e instanceof Timeout)) throw e
      // an aborted search leaves the board changed – rebuild it
      game.load(fen)
      break
    }
  }

  const noisy = scored
    .map(({ m, score }) => ({ m, score: score + (cfg.noise ? (rand() * 2 - 1) * cfg.noise : 0) }))
    .sort((a, b) => b.score - a.score)
  const best = noisy[0].score
  const close = noisy.filter((s) => s.score >= best - cfg.slack)
  return pick(close[Math.floor(rand() * close.length)].m)
}
