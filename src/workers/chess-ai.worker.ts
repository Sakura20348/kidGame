// Runs the chess engine off the main thread so the board never freezes.
import { chooseMove, type Level } from "@/lib/chess-ai"

type Request = { id: number; fen: string; level: Level }

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, fen, level } = e.data
  const move = chooseMove(fen, level)
  self.postMessage({ id, move })
}
