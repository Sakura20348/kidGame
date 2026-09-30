import { gradeOf } from "@/lib/accounts"

// Mountain Climb: the mountains and the math questions for each step.
// Two tracks by school class – Class 0–3 (easy) and Class 4 (medium).
// Difficulty grows with every step AND with every mountain.

export type ClimbTrack = "kids" | "middle"

export type Mountain = {
  id: number // 1–5 inside its track
  track: ClimbTrack
  name: string
  emoji: string
  steps: number
  temp: [number, number] // °C at the bottom → at the top
  topic: string
  /** how much of the mountain is covered in snow (0–1) */
  snowLine: number
  sky: [string, string] // light-mode sky gradient
  rock: string
  ground: "grass" | "pines" | "snow"
}

export const climbTracks: { id: ClimbTrack; name: string; classes: string; emoji: string; tile: string; blurb: string }[] = [
  { id: "kids", name: "Easy math", classes: "Class 0–3", emoji: "🧸", tile: "from-[#56CCF2] to-[#2F80ED]", blurb: "Counting, + and −, first times tables" },
  { id: "middle", name: "Medium math", classes: "Class 4", emoji: "📗", tile: "from-[#6FCF97] to-[#1F9D6B]", blurb: "Big numbers, × ÷, order of operations, fractions" },
]

export const climbTrackForClass = (band?: string): ClimbTrack => ((gradeOf(band) ?? 0) <= 3 ? "kids" : "middle")

// the same five looks on every track: from a sunny hill to a frozen giant
const looks = [
  { steps: 10, temp: [20, 12], snowLine: 0.1, sky: ["#9FDCFF", "#FFF6E5"], rock: "#8A7560", ground: "grass" },
  { steps: 10, temp: [12, 4], snowLine: 0.2, sky: ["#8FCBF2", "#EAF4F2"], rock: "#7A6E66", ground: "grass" },
  { steps: 12, temp: [4, -4], snowLine: 0.35, sky: ["#86B9E0", "#E4EEF5"], rock: "#6B6A72", ground: "pines" },
  { steps: 12, temp: [-4, -12], snowLine: 0.55, sky: ["#8AAED6", "#EEF4FA"], rock: "#62687A", ground: "snow" },
  { steps: 14, temp: [-12, -25], snowLine: 0.8, sky: ["#A9C7E8", "#F4F9FF"], rock: "#5A6784", ground: "snow" },
] as const

const names: Record<ClimbTrack, { name: string; emoji: string; topic: string }[]> = {
  kids: [
    { name: "Sunny Hill", emoji: "⛰️", topic: "+ and − within 20" },
    { name: "Rocky Ridge", emoji: "🪨", topic: "+ and − to 30" },
    { name: "Pine Peak", emoji: "🌲", topic: "× 2, 5, 10 and missing numbers" },
    { name: "Snowy Summit", emoji: "🏔️", topic: "carrying and times tables" },
    { name: "Ice Giant", emoji: "🧊", topic: "× ÷ and three numbers" },
  ],
  middle: [
    { name: "Chimgan", emoji: "🏞️", topic: "+ and − to 100, times tables" },
    { name: "Mount Fuji", emoji: "🗻", topic: "÷, missing numbers, 3-digit + −" },
    { name: "Matterhorn", emoji: "🏔️", topic: "2-digit × 1-digit, order of operations" },
    { name: "Denali", emoji: "🦅", topic: "fractions of numbers, big ÷" },
    { name: "Aconcagua", emoji: "🧊", topic: "squares, brackets, mixed practice" },
  ],
}

export const mountainsFor = (track: ClimbTrack): Mountain[] =>
  names[track].map((n, i) => {
    const l = looks[i]
    return { id: i + 1, track, ...n, steps: l.steps, temp: [l.temp[0], l.temp[1]], snowLine: l.snowLine, sky: [l.sky[0], l.sky[1]], rock: l.rock, ground: l.ground }
  })

export type Question = {
  text: string // e.g. "7 + ? = 12"
  answer: number
  choices: number[]
  /** counting pictures for small sums (only on easy questions) */
  helper?: { a: number; b: number; op: "+" | "−" }
}

const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

type Made = { text: string; answer: number; near?: number[]; helper?: Question["helper"] }

// Question kinds, from easiest to hardest (`from` = the tier where a kind first appears).
type Kind = { from: number; make: () => Made }
const kids: Kind[] = [
  { from: 0, make: () => { const a = r(1, 5), b = r(1, 5); return { text: `${a} + ${b}`, answer: a + b, helper: { a, b, op: "+" } } } },
  { from: 0.4, make: () => { const a = r(3, 10), b = r(1, a - 1); return { text: `${a} − ${b}`, answer: a - b, helper: { a, b, op: "−" } } } },
  { from: 0.7, make: () => { const a = r(5, 12), b = r(2, 8); return { text: `${a} + ${b}`, answer: a + b } } },
  { from: 1.0, make: () => { const a = r(11, 20), b = r(2, 9); return { text: `${a} − ${b}`, answer: a - b } } },
  { from: 1.4, make: () => { const a = r(12, 25), b = r(3, 9); return { text: `${a} + ${b}`, answer: a + b } } },
  { from: 1.7, make: () => { const a = r(18, 30), b = r(5, 12); return { text: `${a} − ${b}`, answer: a - b } } },
  { from: 2.0, make: () => { const a = pick([2, 5, 10]), b = r(1, 10); return { text: `${a} × ${b}`, answer: a * b, near: [a * (b + 1), a * (b - 1)] } } },
  { from: 2.3, make: () => { const a = r(3, 10), c = r(a + 2, 20); return { text: `${a} + ? = ${c}`, answer: c - a } } },
  { from: 2.6, make: () => { const a = r(20, 40), b = r(10, 30); return { text: `${a} + ${b}`, answer: a + b } } },
  { from: 3.0, make: () => { const a = r(14, 38), b = r(8, 19); return { text: `${a} + ${b}`, answer: a + b, near: [a + b - 10, a + b + 10] } } },
  { from: 3.3, make: () => { const a = r(2, 5), b = r(2, 10); return { text: `${a} × ${b}`, answer: a * b, near: [a * (b + 1), a * (b - 1)] } } },
  { from: 3.6, make: () => { const a = r(30, 60), b = r(11, 29); return { text: `${a} − ${b}`, answer: a - b, near: [a - b + 10, a - b - 10] } } },
  { from: 3.8, make: () => { const a = r(2, 5), b = r(2, 9); return { text: `${a} × ? = ${a * b}`, answer: b } } },
  { from: 4.0, make: () => { const a = r(2, 10), b = r(2, 10); return { text: `${a} × ${b}`, answer: a * b, near: [a * (b + 1), a * (b - 1), (a + 1) * b] } } },
  { from: 4.2, make: () => { const b = r(2, 5), q = r(2, 10); return { text: `${b * q} ÷ ${b}`, answer: q } } },
  { from: 4.5, make: () => { const a = r(5, 20), b = r(5, 20), c = r(3, 15); return { text: `${a} + ${b} + ${c}`, answer: a + b + c } } },
  { from: 4.7, make: () => { const b = r(2, 10), q = r(2, 10); return { text: `${b * q} ÷ ${b}`, answer: q } } },
  { from: 4.8, make: () => { const a = r(20, 50), c = r(5, a - 5); return { text: `${a} − ? = ${c}`, answer: a - c } } },
]

// Class 4
const middle: Kind[] = [
  { from: 0, make: () => { const a = r(21, 59), b = r(12, 39); return { text: `${a} + ${b}`, answer: a + b, near: [a + b - 10, a + b + 10] } } },
  { from: 0.4, make: () => { const a = r(45, 99), b = r(11, 39); return { text: `${a} − ${b}`, answer: a - b, near: [a - b + 10, a - b - 10] } } },
  { from: 0.7, make: () => { const a = r(3, 10), b = r(3, 10); return { text: `${a} × ${b}`, answer: a * b, near: [a * (b + 1), (a - 1) * b] } } },
  { from: 1.0, make: () => { const b = r(3, 10), q = r(3, 10); return { text: `${b * q} ÷ ${b}`, answer: q } } },
  { from: 1.3, make: () => { const a = r(3, 9), b = r(4, 12); return { text: `? × ${a} = ${a * b}`, answer: b } } },
  { from: 1.6, make: () => { const a = r(120, 480), b = r(25, 99); return { text: `${a} + ${b}`, answer: a + b, near: [a + b - 10, a + b + 100] } } },
  { from: 1.9, make: () => { const a = r(300, 900), b = r(45, 199); return { text: `${a} − ${b}`, answer: a - b, near: [a - b + 10, a - b - 100] } } },
  { from: 2.2, make: () => { const a = r(12, 29), b = r(3, 9); return { text: `${a} × ${b}`, answer: a * b, near: [a * b + b, a * b - 10] } } },
  { from: 2.6, make: () => { const a = r(2, 20), b = r(2, 9), c = r(2, 9); return { text: `${a} + ${b} × ${c}`, answer: a + b * c, near: [(a + b) * c] } } },
  { from: 3.0, make: () => { const d = pick([2, 3, 4, 5]), q = r(4, 15); return { text: `1/${d} of ${d * q}`, answer: q } } },
  { from: 3.3, make: () => { const b = r(3, 9), q = r(12, 45); return { text: `${b * q} ÷ ${b}`, answer: q, near: [q + 10, q - 1] } } },
  { from: 3.6, make: () => { const d = pick([3, 4, 5]), n = r(2, d - 1), q = r(3, 12); return { text: `${n}/${d} of ${d * q}`, answer: n * q, near: [q, (n + 1) * q] } } },
  { from: 4.0, make: () => { const a = r(11, 15); return { text: `${a}²`, answer: a * a, near: [a * 2, a * a + a] } } },
  { from: 4.3, make: () => { const a = r(2, 12), b = r(2, 9), c = r(2, 6); return { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, near: [a + b * c] } } },
  { from: 4.6, make: () => { const b = r(3, 9), c = r(2, 9), a = r(b * c + 3, b * c + 60); return { text: `${a} − ${b} × ${c}`, answer: a - b * c, near: [(a - b) * c] } } },
]

const kinds: Record<ClimbTrack, Kind[]> = { kids, middle }

/**
 * `tier` runs from 0 (first step of the first mountain) to 5 (top of the last).
 * The newest kinds are picked most often, older ones keep appearing for practice.
 */
export function makeQuestion(mountain: Mountain, step: number): Question {
  const tier = mountain.id - 1 + step / mountain.steps
  const open = kinds[mountain.track].filter((k) => k.from <= tier)
  const recent = open.slice(-3)
  const kind = Math.random() < 0.7 ? pick(recent) : pick(open)
  const made = kind.make()
  const text = made.text.includes("?") ? made.text : `${made.text} = ?`

  const count = mountain.track === "kids" && mountain.id <= 2 ? 3 : 4 // more choices higher up
  const wrong = new Set<number>()
  for (const n of made.near ?? []) if ((n >= 0 || made.answer < 0) && n !== made.answer && wrong.size < count - 1) wrong.add(n)
  const spread = Math.abs(made.answer) > 20 ? 5 : 3
  while (wrong.size < count - 1) {
    const w = made.answer + r(1, spread) * (Math.random() < 0.5 ? -1 : 1)
    if ((w >= 0 || made.answer < 0) && w !== made.answer) wrong.add(w)
  }
  const choices = [made.answer, ...wrong].sort(() => Math.random() - 0.5)
  return { text, answer: made.answer, choices, helper: made.helper }
}

/** Temperature at a step, e.g. 20°C at the bottom → 12°C at the top. */
export const tempAt = (m: Mountain, step: number) =>
  Math.round(m.temp[0] + ((m.temp[1] - m.temp[0]) * step) / m.steps)

/** 0 = warm meadow … 1 = frozen summit of the last mountain. */
export const coldness = (m: Mountain, step: number) => Math.min(1, (m.id - 1 + step / m.steps) / looks.length)
