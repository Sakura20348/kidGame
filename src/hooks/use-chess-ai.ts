import { useCallback, useEffect, useRef } from "react"

import { chooseMove, type AiMove, type Level } from "@/lib/chess-ai"

/** Returns `think(fen, level)` – asks the engine (in a Web Worker) for a move. */
export function useChessAI() {
  const worker = useRef<Worker | null>(null)
  const pending = useRef(new Map<number, (move: AiMove | null) => void>())
  const nextId = useRef(0)

  useEffect(() => {
    const w = new Worker(new URL("../workers/chess-ai.worker.ts", import.meta.url), { type: "module" })
    const waiting = pending.current
    w.onmessage = (e: MessageEvent<{ id: number; move: AiMove | null }>) => {
      waiting.get(e.data.id)?.(e.data.move)
      waiting.delete(e.data.id)
    }
    worker.current = w
    return () => {
      w.terminate()
      worker.current = null
      waiting.clear()
    }
  }, [])

  return useCallback(
    (fen: string, level: Level) =>
      new Promise<AiMove | null>((resolve) => {
        const w = worker.current
        if (!w) return resolve(chooseMove(fen, level)) // no worker yet – think on the main thread
        const id = ++nextId.current
        pending.current.set(id, resolve)
        w.postMessage({ id, fen, level })
      }),
    []
  )
}
