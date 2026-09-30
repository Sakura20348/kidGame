// Lecture questions: live quizzes like Kahoot (server: /api/live).
// Teachers keep their quizzes with their account; a game gets a 6-digit code students type in.

import { useEffect, useRef, useState } from "react"

import { api } from "@/lib/api"
import { kidsKey } from "@/lib/kids-storage"

export type LiveQuestion = { text: string; options: string[]; answer: number; seconds: number }
export type LiveQuiz = { id: string; title: string; questions: LiveQuestion[]; updatedAt: string }

export type LivePhase = "lobby" | "question" | "reveal" | "board" | "end"
export type LiveState = {
  pin: string
  title: string
  phase: LivePhase
  index: number
  total: number
  players: number
  now: number
  host: boolean
  question?: { text: string; options: string[]; seconds: number }
  endsAt?: number
  answered?: number
  correct?: number
  counts?: number[]
  leaderboard?: { id: string; name: string; score: number; lastPoints: number }[]
  names?: string[]
  me?: { name: string; score: number; rank: number; answered: boolean; lastPoints: number; lastCorrect: boolean | null }
}

/** Kahoot-style answer tiles: colour and shape, so even young children can find "the red triangle". */
export const tiles = [
  { color: "bg-[#E21B3C]", shadow: "shadow-[0_6px_0_#A50F28]", shape: "▲", name: "red triangle" },
  { color: "bg-[#1368CE]", shadow: "shadow-[0_6px_0_#0B4A99]", shape: "◆", name: "blue diamond" },
  { color: "bg-[#D89E00]", shadow: "shadow-[0_6px_0_#9E7300]", shape: "●", name: "yellow circle" },
  { color: "bg-[#26890C]", shadow: "shadow-[0_6px_0_#1A6107]", shape: "■", name: "green square" },
] as const

// ------------------------------------------------------------ the teacher's quizzes

export function readQuizzes(teacher: string | null): LiveQuiz[] {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(teacher, "liveQuizzes")) ?? "[]")
  } catch {
    return []
  }
}

export function saveQuizzes(teacher: string | null, list: LiveQuiz[]) {
  try {
    localStorage.setItem(kidsKey(teacher, "liveQuizzes"), JSON.stringify(list))
  } catch {
    // storage full
  }
}

export const blankQuestion = (): LiveQuestion => ({ text: "", options: ["", "", "", ""], answer: 0, seconds: 20 })

/** A friendly problem with the quiz, or null when it can be played. */
export function quizProblem(q: LiveQuiz): string | null {
  if (!q.title.trim()) return "Give the quiz a name."
  if (q.questions.length === 0) return "Add at least one question."
  for (const [i, x] of q.questions.entries()) {
    const filled = x.options.filter((o) => o.trim())
    if (!x.text.trim()) return `Question ${i + 1}: write the question.`
    if (filled.length < 2) return `Question ${i + 1}: add at least two answers.`
    if (!x.options[x.answer]?.trim()) return `Question ${i + 1}: mark the right answer.`
  }
  return null
}

/** Drops empty answers (keeping the right one marked). */
export function cleanQuestions(q: LiveQuiz): LiveQuestion[] {
  return q.questions.map((x) => {
    const right = x.options[x.answer]
    const options = x.options.map((o) => o.trim()).filter(Boolean)
    return { text: x.text.trim(), options, answer: options.indexOf(right.trim()), seconds: x.seconds }
  })
}

// ------------------------------------------------------------ playing

export const startGame = (quiz: LiveQuiz) => api<{ pin: string }>("/api/live", { body: { title: quiz.title, questions: cleanQuestions(quiz) } })
export const joinGame = (pin: string) => api<LiveState>(`/api/live/${pin}/join`, { method: "POST" })
export const sendAnswer = (pin: string, choice: number) => api<LiveState>(`/api/live/${pin}/answer`, { body: { choice } })
export const nextStep = (pin: string) => api<LiveState>(`/api/live/${pin}/next`, { method: "POST" })
export const endGame = (pin: string) => api<LiveState>(`/api/live/${pin}/end`, { method: "POST" })

/** Follows a game: asks the server for its state about once a second. */
export function useLiveGame(pin: string | null, first?: LiveState | null) {
  const [state, setState] = useState<LiveState | null>(first ?? null)
  const [error, setError] = useState<string | null>(null)
  const offset = useRef(0) // server clock − this device's clock

  useEffect(() => {
    if (!pin) return
    let stop = false
    let timer: number | undefined
    const load = async () => {
      try {
        const s = await api<LiveState>(`/api/live/${pin}`)
        if (stop) return
        offset.current = s.now - Date.now()
        setState(s)
        setError(null)
      } catch (err) {
        if (!stop) setError((err as Error).message)
      }
      if (!stop) timer = window.setTimeout(load, 900)
    }
    void load()
    return () => {
      stop = true
      window.clearTimeout(timer)
    }
  }, [pin])

  const update = (s: LiveState) => {
    offset.current = s.now - Date.now()
    setState(s)
  }
  /** Seconds left in the current question (by the server's clock). */
  const secondsLeft = () => (state?.endsAt ? Math.max(0, Math.ceil((state.endsAt - (Date.now() + offset.current)) / 1000)) : 0)

  return { state, error, update, secondsLeft }
}

/** Re-renders every quarter second while a question is running (for the countdown). */
export function useTicker(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(id)
  }, [active])
}
