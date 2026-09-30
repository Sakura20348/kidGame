import { gradeOf } from "@/lib/accounts"
// CrossMath puzzles: a 5×5 grid where 3 rows AND 3 columns are equations.
//
//   A  op  B  =  C
//   op     op    op
//   D  op  E  =  F
//   =      =     =
//   G  op  H  =  I
//
// Rows:    A∘B=C, D∘E=F, G∘H=I      Columns: A∘D=G, B∘E=H, C∘F=I

export type Op = "+" | "−" | "×" | "÷"
export type Level = "c0" | "c1" | "c2" | "c3" | "c4" // one level per class

export const levels: { id: Level; name: string; classes: string; blurb: string; emoji: string; tile: string; ops: Op[]; max: number; top: number; blanks: [number, number] }[] = [
  { id: "c0", name: "Little sums", classes: "Class 0", blurb: "Add small numbers up to 10", emoji: "🧸", tile: "from-[#FFB347] to-[#FF7A59]", ops: ["+"], max: 5, top: 10, blanks: [2, 3] },
  { id: "c1", name: "Plus & minus to 10", classes: "Class 1", blurb: "Add and take away up to 10", emoji: "➕", tile: "from-[#FF8A5B] to-[#FF5E7E]", ops: ["+", "−"], max: 9, top: 10, blanks: [3, 3] },
  { id: "c2", name: "Plus & minus to 20", classes: "Class 2", blurb: "Add and take away up to 20", emoji: "➖", tile: "from-[#2BC0A4] to-[#1F7A6B]", ops: ["+", "−"], max: 10, top: 20, blanks: [3, 4] },
  { id: "c3", name: "First times", classes: "Class 3", blurb: "Plus, minus and times up to 50", emoji: "✳️", tile: "from-[#B06AB3] to-[#5B3FA8]", ops: ["+", "−", "×"], max: 10, top: 50, blanks: [4, 4] },
  { id: "c4", name: "Times tables", classes: "Class 4", blurb: "Plus, minus and times up to 100", emoji: "✖️", tile: "from-[#4FACFE] to-[#6C63FF]", ops: ["+", "−", "×"], max: 12, top: 100, blanks: [4, 5] },
]

/** The level for a student's class (Class 0 → c0 … Class 4 → c4). */
export const levelForClass = (band?: string): Level => `c${Math.min(4, Math.max(0, gradeOf(band) ?? 0))}` as Level

export function apply(a: number, op: Op, b: number): number | null {
  switch (op) {
    case "+":
      return a + b
    case "−":
      return a - b >= 0 ? a - b : null
    case "×":
      return a * b
    case "÷":
      return b !== 0 && a % b === 0 ? a / b : null
  }
}

/** Names of the 9 number cells, in grid order. */
export const CELLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const
export type Cell = (typeof CELLS)[number]

/** The six equations as [left, op index, right, result]. Ops: r1 r2 r3 (rows), c1 c2 c3 (columns). */
export const EQUATIONS: { cells: [Cell, Cell, Cell]; op: "r1" | "r2" | "r3" | "c1" | "c2" | "c3" }[] = [
  { cells: ["A", "B", "C"], op: "r1" },
  { cells: ["D", "E", "F"], op: "r2" },
  { cells: ["G", "H", "I"], op: "r3" },
  { cells: ["A", "D", "G"], op: "c1" },
  { cells: ["B", "E", "H"], op: "c2" },
  { cells: ["C", "F", "I"], op: "c3" },
]

export type Puzzle = {
  values: Record<Cell, number>
  ops: Record<"r1" | "r2" | "r3" | "c1" | "c2" | "c3", Op>
  blanks: Cell[]
}

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

export function makePuzzle(level: Level): Puzzle {
  const L = levels.find((l) => l.id === level)!
  for (let tries = 0; tries < 20000; tries++) {
    const A = rand(1, L.max), B = rand(1, L.max), D = rand(1, L.max), E = rand(1, L.max)
    const r1 = pick(L.ops), r2 = pick(L.ops), c1 = pick(L.ops), c2 = pick(L.ops)
    const C = apply(A, r1, B), F = apply(D, r2, E), G = apply(A, c1, D), H = apply(B, c2, E)
    if (C === null || F === null || G === null || H === null) continue
    if ([C, F, G, H].some((v) => v > L.top)) continue
    // the corner I must work for the last row and the last column
    const options: { r3: Op; c3: Op; I: number }[] = []
    for (const r3 of L.ops)
      for (const c3 of L.ops) {
        const I1 = apply(G, r3, H), I2 = apply(C, c3, F)
        if (I1 !== null && I1 === I2 && I1 <= L.top) options.push({ r3, c3, I: I1 })
      }
    if (options.length === 0) continue
    // prefer using a mix of operations on harder levels
    const { r3, c3, I } = pick(options)
    const ops = { r1, r2, r3, c1, c2, c3 }
    if (L.ops.length > 1 && level !== "c1" && new Set(Object.values(ops)).size < 2) continue
    const values = { A, B, C, D, E, F, G, H, I }
    const count = rand(L.blanks[0], L.blanks[1])
    const blanks = [...CELLS].sort(() => Math.random() - 0.5).slice(0, count)
    return { values, ops, blanks }
  }
  // (practically never) a simple all-plus puzzle
  return { values: { A: 1, B: 2, C: 3, D: 3, E: 4, F: 7, G: 4, H: 6, I: 10 }, ops: { r1: "+", r2: "+", r3: "+", c1: "+", c2: "+", c3: "+" }, blanks: ["B", "E", "I"] }
}

/** Which equations are wrong with these numbers (any numbers that make every equation true are accepted). */
export function wrongEquations(p: Puzzle, filled: Partial<Record<Cell, number>>) {
  const get = (c: Cell) => (p.blanks.includes(c) ? filled[c] : p.values[c])
  return EQUATIONS.filter(({ cells: [a, b, r], op }) => {
    const x = get(a), y = get(b), z = get(r)
    if (x === undefined || y === undefined || z === undefined) return true
    return apply(x, p.ops[op], y) !== z
  })
}
