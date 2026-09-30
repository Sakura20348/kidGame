// Scrabble engine for the kids area: board, bonus squares, move checking/scoring and the computer player "Robo".
// Words come from the "wordlist-english" package (SCOWL lists, MIT), loaded only when the game opens.

import { gradeOf } from "@/lib/accounts"
export type ScrLevel = "easy" | "medium"
export type Board = (string | null)[][]
export type Placement = { r: number; c: number; letter: string }
export type Premium = "TW" | "DW" | "TL" | "DL" | "★" | null
export type Tile = { id: number; letter: string }

export const VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
}
const COUNTS: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2,
  N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
}

export const scrLevels: {
  id: ScrLevel; name: string; classes: string; blurb: string; emoji: string; tile: string
  size: number; rack: number; rounds: number; bagScale: number; skip: string
}[] = [
  { id: "easy", name: "Little Scrabble", classes: "Class 0–3", blurb: "7×7 board · 5 letters · Robo plays gently", emoji: "🔤", tile: "from-[#FF8A5B] to-[#FF5E7E]", size: 7, rack: 5, rounds: 6, bagScale: 0.45, skip: "JQXZ" },
  { id: "medium", name: "Word Battle", classes: "Class 4", blurb: "11×11 board · 7 letters · a fair fight", emoji: "🧠", tile: "from-[#4FACFE] to-[#6C63FF]", size: 11, rack: 7, rounds: 8, bagScale: 0.75, skip: "Q" },
]
export const scrLevelForClass = (band?: string): ScrLevel => ((gradeOf(band) ?? 0) <= 3 ? "easy" : "medium")

/** Topics per level – their words earn a +10 bonus (and Robo likes them too). */
export const topics: Record<ScrLevel, { name: string; emoji: string; words: string[] }[]> = {
  easy: [
    { name: "Animals", emoji: "🐾", words: ["cat", "dog", "cow", "pig", "hen", "fox", "owl", "bee", "ant", "bat", "goat", "duck", "fish", "frog", "lion", "bear"] },
    { name: "Food", emoji: "🍎", words: ["egg", "jam", "pie", "bun", "rice", "milk", "cake", "meat", "soup", "corn", "bean", "pear", "plum", "nut", "tea"] },
    { name: "Colours", emoji: "🎨", words: ["red", "tan", "blue", "pink", "gold", "grey", "gray", "teal", "rose", "green", "white", "black"] },
    { name: "Home", emoji: "🏠", words: ["bed", "cup", "mug", "pan", "pot", "rug", "mat", "tap", "lamp", "sofa", "door", "roof", "sink", "desk", "wall"] },
  ],
  medium: [
    { name: "Nature", emoji: "🌳", words: ["tree", "leaf", "rain", "snow", "wind", "lake", "river", "cloud", "storm", "stone", "flower", "forest", "ocean", "island", "desert"] },
    { name: "School", emoji: "🏫", words: ["book", "pen", "desk", "class", "chalk", "paper", "ruler", "pupil", "lesson", "school", "teacher", "subject", "test"] },
    { name: "Sports", emoji: "⚽", words: ["ball", "goal", "race", "team", "swim", "skate", "tennis", "hockey", "player", "match", "score", "coach", "win"] },
    { name: "Body", emoji: "🫀", words: ["arm", "leg", "ear", "eye", "nose", "hand", "knee", "neck", "heart", "brain", "mouth", "tooth", "finger"] },
  ],
}

// ------------------------------------------------------------ dictionary

export type Dict = { valid: Set<string>; robo: Record<ScrLevel, string[]> }
let dictPromise: Promise<Dict> | null = null

// Robo never plays these (the big list is only used to accept real words from students).
const BLOCK = /^(ass|arse|bastard|bitch|bloody|bollock|boob|crap|cunt|damn|dick|fag|fuck|hell|homo|jerk|kill|nazi|piss|porn|prick|pussy|rape|sex|shit|slut|suck|tit|twat|wank|whore|drug|dead|die|gun)/

/** Loads the word lists once (about 40,000 common English words). */
export function loadDict(): Promise<Dict> {
  dictPromise ??= Promise.all([
    import("wordlist-english/english-words-10.json"),
    import("wordlist-english/english-words-20.json"),
    import("wordlist-english/english-words-35.json"),
    import("wordlist-english/british-words-10.json"),
    import("wordlist-english/british-words-20.json"),
    import("wordlist-english/british-words-35.json"),
  ]).then(([e10, e20, e35, b10, b20, b35]) => {
    const clean = (list: string[]) => list.filter((w) => /^[a-z]{2,15}$/.test(w))
    const common = clean(e10.default as string[])
    const more = clean(e20.default as string[])
    const valid = new Set([...common, ...more, ...clean(e35.default as string[]), ...clean(b10.default as string[]), ...clean(b20.default as string[]), ...clean(b35.default as string[])])
    for (const lvl of Object.values(topics)) for (const t of lvl) for (const w of t.words) valid.add(w)
    const ok = (w: string) => !BLOCK.test(w)
    return {
      valid,
      robo: {
        easy: common.filter((w) => w.length <= 5 && ok(w)),
        medium: [...common, ...more].filter((w) => w.length <= 7 && ok(w)),
      },
    }
  })
  return dictPromise
}

// ------------------------------------------------------------ board

export const emptyBoard = (size: number): Board => Array.from({ length: size }, () => Array<string | null>(size).fill(null))

const sym = (size: number, cells: [number, number][]) => {
  const out = new Set<string>()
  const m = size - 1
  for (const [r, c] of cells) for (const [a, b] of [[r, c], [c, r], [m - r, c], [r, m - c], [m - r, m - c], [c, m - r], [m - c, r], [m - c, m - r]]) out.add(`${a},${b}`)
  return out
}
const layouts: Record<number, Partial<Record<Exclude<Premium, null | "★">, Set<string>>>> = {
  15: {
    TW: sym(15, [[0, 0], [0, 7]]),
    DW: sym(15, [[1, 1], [2, 2], [3, 3], [4, 4]]),
    TL: sym(15, [[1, 5], [5, 5]]),
    DL: sym(15, [[0, 3], [2, 6], [3, 7], [6, 6]]),
  },
  11: {
    TW: sym(11, [[0, 0]]),
    DW: sym(11, [[1, 1], [2, 2]]),
    TL: sym(11, [[3, 3]]),
    DL: sym(11, [[0, 5], [2, 5], [4, 4]]),
  },
  7: {
    DW: sym(7, [[1, 1]]),
    DL: sym(7, [[0, 3], [2, 2]]),
  },
}

export function premiumAt(size: number, r: number, c: number): Premium {
  const mid = (size - 1) / 2
  if (r === mid && c === mid) return "★"
  const key = `${r},${c}`
  for (const p of ["TW", "DW", "TL", "DL"] as const) if (layouts[size]?.[p]?.has(key)) return p
  return null
}

export function makeBag(level: ScrLevel): string[] {
  const L = scrLevels.find((l) => l.id === level)!
  const bag: string[] = []
  for (const [letter, n] of Object.entries(COUNTS)) {
    if (L.skip.includes(letter)) continue
    const count = Math.max(1, Math.round(n * L.bagScale))
    for (let i = 0; i < count; i++) bag.push(letter)
  }
  return bag.sort(() => Math.random() - 0.5)
}

// ------------------------------------------------------------ checking and scoring a move

export type Word = { word: string; cells: [number, number][] }
export type Evaluated = { ok: true; words: Word[]; score: number; bonus: number } | { ok: false; error: string }

export function evaluate(board: Board, placed: Placement[], opts: { valid: Set<string>; rackSize: number; topic?: Set<string> }): Evaluated {
  const size = board.length
  const mid = (size - 1) / 2
  if (placed.length === 0) return { ok: false, error: "Put some letters on the board first." }
  const rows = new Set(placed.map((p) => p.r))
  const cols = new Set(placed.map((p) => p.c))
  if (rows.size > 1 && cols.size > 1) return { ok: false, error: "Put your letters in one straight line." }
  if (placed.some((p) => board[p.r][p.c])) return { ok: false, error: "That square is already taken." }

  const at = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return null
    return placed.find((p) => p.r === r && p.c === c)?.letter ?? board[r][c]
  }
  const firstMove = board.every((row) => row.every((x) => !x))
  if (firstMove && !placed.some((p) => p.r === mid && p.c === mid)) return { ok: false, error: "The first word must cover the ★ in the middle." }
  if (!firstMove && !placed.some((p) => [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => board[p.r + dr]?.[p.c + dc]))) {
    return { ok: false, error: "Your word must touch letters already on the board." }
  }

  const wordAt = (r: number, c: number, dr: number, dc: number): Word => {
    while (at(r - dr, c - dc)) (r -= dr), (c -= dc)
    const cells: [number, number][] = []
    let word = ""
    while (at(r, c)) {
      word += at(r, c)
      cells.push([r, c])
      r += dr
      c += dc
    }
    return { word, cells }
  }

  // main direction: along the line of tiles (a single tile: whichever way makes a word)
  const horizontal = placed.length > 1 ? rows.size === 1 : wordAt(placed[0].r, placed[0].c, 0, 1).word.length > 1
  const [dr, dc] = horizontal ? [0, 1] : [1, 0]
  const main = wordAt(placed[0].r, placed[0].c, dr, dc)
  if (placed.some((p) => !main.cells.some(([r, c]) => r === p.r && c === p.c))) return { ok: false, error: "Leave no gaps between your letters." }
  const words: Word[] = []
  if (main.word.length > 1) words.push(main)
  for (const p of placed) {
    const cross = wordAt(p.r, p.c, dc, dr)
    if (cross.word.length > 1) words.push(cross)
  }
  if (words.length === 0) return { ok: false, error: "Make a word of at least 2 letters." }
  const bad = words.find((w) => !opts.valid.has(w.word.toLowerCase()))
  if (bad) return { ok: false, error: `“${bad.word}” isn’t in our word list.` }

  let score = 0
  let bonus = 0
  for (const w of words) {
    let sum = 0
    let mult = 1
    for (const [r, c] of w.cells) {
      const letter = at(r, c)!
      const isNew = placed.some((p) => p.r === r && p.c === c)
      const prem = isNew ? premiumAt(size, r, c) : null
      sum += VALUES[letter] * (prem === "DL" ? 2 : prem === "TL" ? 3 : 1)
      if (prem === "DW" || prem === "★") mult *= 2
      if (prem === "TW") mult *= 3
    }
    score += sum * mult
    if (opts.topic?.has(w.word.toLowerCase())) bonus += 10
  }
  if (placed.length === opts.rackSize) bonus += opts.rackSize >= 7 ? 50 : 20 // used every letter
  return { ok: true, words, score: score + bonus, bonus }
}

// ------------------------------------------------------------ Robo

export type Move = { placed: Placement[]; score: number; words: Word[] }

const letterCounts = (s: string) => {
  const n = new Array(26).fill(0)
  for (const ch of s) n[ch.charCodeAt(0) - 65]++
  return n
}

/** Every move Robo could make with its rack (plays through letters already on the board). */
export function findMoves(board: Board, rack: string[], words: string[], opts: { valid: Set<string>; rackSize: number; topic?: Set<string> }): Move[] {
  const size = board.length
  const mid = (size - 1) / 2
  const onBoard: [number, number, string][] = []
  board.forEach((row, r) => row.forEach((x, c) => x && onBoard.push([r, c, x])))
  const rackN = letterCounts(rack.join(""))
  const boardN = letterCounts(onBoard.map((t) => t[2]).join(""))
  const first = onBoard.length === 0

  // words we could possibly build: letters from the rack, plus at least one from the board
  const candidates = words.filter((w) => {
    const W = w.toUpperCase()
    if (W.length > size) return false
    const need = letterCounts(W)
    let fromBoard = 0
    for (let i = 0; i < 26; i++) {
      const extra = need[i] - rackN[i]
      if (extra > 0) {
        if (first || extra > boardN[i]) return false
        fromBoard += extra
      }
    }
    return first || fromBoard <= W.length - 1
  })

  const seen = new Set<string>()
  const moves: Move[] = []
  const tryAt = (W: string, r0: number, c0: number, horizontal: boolean) => {
    const [dr, dc] = horizontal ? [0, 1] : [1, 0]
    const endR = r0 + dr * (W.length - 1), endC = c0 + dc * (W.length - 1)
    if (r0 < 0 || c0 < 0 || endR >= size || endC >= size) return
    if (board[r0 - dr]?.[c0 - dc] || board[endR + dr]?.[endC + dc]) return // would make a longer word
    const left = [...rackN]
    const placed: Placement[] = []
    for (let k = 0; k < W.length; k++) {
      const r = r0 + dr * k, c = c0 + dc * k
      const cell = board[r][c]
      if (cell) {
        if (cell !== W[k]) return
      } else {
        const i = W.charCodeAt(k) - 65
        if (left[i] <= 0) return
        left[i]--
        placed.push({ r, c, letter: W[k] })
      }
    }
    if (placed.length === 0 || placed.length === W.length && !first) return
    const key = placed.map((p) => `${p.r},${p.c},${p.letter}`).join("|")
    if (seen.has(key)) return
    seen.add(key)
    const res = evaluate(board, placed, opts)
    if (res.ok) moves.push({ placed, score: res.score, words: res.words })
  }

  for (const w of candidates) {
    const W = w.toUpperCase()
    if (first) {
      for (let k = 0; k < W.length; k++) {
        tryAt(W, mid, mid - k, true)
        tryAt(W, mid - k, mid, false)
      }
      continue
    }
    for (const [r, c, L] of onBoard) {
      for (let k = 0; k < W.length; k++) {
        if (W[k] !== L) continue
        tryAt(W, r, c - k, true)
        tryAt(W, r - k, c, false)
      }
    }
  }
  return moves.sort((a, b) => b.score - a.score)
}

/** Robo's choice: gentle for little ones, best-ish for older learners. */
export function chooseMove(moves: Move[], level: ScrLevel): Move | null {
  if (moves.length === 0) return null
  if (level === "easy") {
    const pool = moves.slice(Math.floor(moves.length * 0.4), Math.max(Math.floor(moves.length * 0.8), 1))
    return (pool.length ? pool : moves)[Math.floor(Math.random() * (pool.length || moves.length))]
  }
  if (level === "medium") return moves[Math.floor(Math.random() * Math.min(moves.length, Math.max(3, Math.ceil(moves.length * 0.25))))]
  return Math.random() < 0.85 ? moves[0] : moves[Math.min(1, moves.length - 1)]
}
