import { gradeOf } from "@/lib/accounts"

// Math Sprint question generators for three levels:
//   First numbers (Class 0–1) · Numbers (Class 2–3) · Number power (Class 4)
// Every question has one correct answer and 3 believable wrong ones.

export type Track = "little" | "numbers" | "class4"
/** `plain`: show the expression as it is (no “= ?” after it), e.g. pictures to count. */
export type Question = { prompt: string; expr: string; answer: string; choices: string[]; plain?: boolean }

type Made = { prompt?: string; expr: string; answer: number | string; near?: (number | string)[]; plain?: boolean; small?: boolean }

const r = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))
const nz = (a: number, b: number) => {
  let v = 0
  while (v === 0) v = r(a, b)
  return v
}
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
/** Pretty minus sign for display. */
const m = (n: number) => (n < 0 ? `−${-n}` : String(n))

export type Topic = { id: string; track: Track; label: string; emoji: string; make: () => Made }

export const topics: Topic[] = [
  // ------------------------------------------------------------ First numbers (Class 0–1)
  {
    // count pictures, and what comes next
    id: "count",
    track: "little",
    label: "Numbers for kids",
    emoji: "🧸",
    make: () =>
      pick([
        () => {
          const n = r(1, 10)
          const item = pick(["🍎", "⭐", "🐟", "🌸", "🐥", "🎈", "🍓", "🚗", "🐞", "🍪"])
          // rows of 5 are easier for small children to count
          const rows = [item.repeat(Math.min(n, 5)), item.repeat(Math.max(0, n - 5))].filter(Boolean).join("\n")
          return { prompt: "How many are there?", expr: rows, answer: n, near: [n + 1, n - 1, n + 2].filter((v) => v >= 1 && v <= 10), plain: true }
        },
        () => {
          const a = r(1, 7)
          return { prompt: "What comes next?", expr: `${a}, ${a + 1}, ?`, answer: a + 2, near: [a + 1, a + 3, a] }
        },
      ])(),
  },
  { id: "add10", track: "little", label: "Add to 10", emoji: "➕", make: () => { const a = r(1, 6), b = r(1, 10 - a); return { expr: `${a} + ${b}`, answer: a + b, small: true } } },
  { id: "sub10", track: "little", label: "Take away to 10", emoji: "➖", make: () => { const a = r(3, 10), b = r(1, a - 1); return { expr: `${a} − ${b}`, answer: a - b, small: true } } },

  // ------------------------------------------------------------ Numbers (Class 2–3)
  { id: "add", track: "numbers", label: "Add", emoji: "➕", make: () => { const a = r(5, 60), b = r(2, 39); return { expr: `${a} + ${b}`, answer: a + b } } },
  { id: "sub", track: "numbers", label: "Take away", emoji: "➖", make: () => { const a = r(15, 99), b = r(2, a - 5); return { expr: `${a} − ${b}`, answer: a - b } } },
  { id: "times", track: "numbers", label: "Times 2, 5, 10", emoji: "✖️", make: () => { const a = pick([2, 5, 10]), b = r(1, 10); return { expr: `${a} × ${b}`, answer: a * b, near: [a * (b + 1), a * (b - 1)] } } },

  // ------------------------------------------------------------ Class 4
  { id: "tables", track: "class4", label: "Times tables", emoji: "✖️", make: () => { const a = r(2, 10), b = r(2, 10); return { expr: `${a} × ${b}`, answer: a * b, near: [a * (b + 1), (a - 1) * b] } } },
  { id: "divide", track: "class4", label: "Divide", emoji: "➗", make: () => { const b = r(2, 10), q = r(2, 10); return { expr: `${b * q} ÷ ${b}`, answer: q, near: [q + 1, q - 1, b] } } },
  {
    id: "big",
    track: "class4",
    label: "Big sums",
    emoji: "💯",
    make: () =>
      pick([
        () => { const a = r(120, 600), b = r(25, 399); return { expr: `${a} + ${b}`, answer: a + b, near: [a + b + 10, a + b - 100] } },
        () => { const a = r(300, 999), b = r(25, 299); return { expr: `${a} − ${b}`, answer: a - b, near: [a - b + 10, a - b - 100] } },
      ])(),
  },
  {
    id: "missing",
    track: "class4",
    label: "Missing number",
    emoji: "❓",
    make: () =>
      pick([
        () => { const a = r(3, 40), c = r(a + 5, 90); return { expr: `${a} + ? = ${c}`, answer: c - a } },
        () => { const a = r(2, 10), b = r(2, 10); return { expr: `${a} × ? = ${a * b}`, answer: b } },
      ])(),
  },
]

/** `exam`: how many questions the exam (all topics mixed) has for these classes. */
export const tracks: { id: Track; name: string; ages: string; blurb: string; emoji: string; tile: string; exam: number }[] = [
  { id: "little", name: "First numbers", ages: "Class 0–1", blurb: "Counting, and plus / minus up to 10", emoji: "🧸", tile: "from-[#FFB347] to-[#FF7A59]", exam: 10 },
  { id: "numbers", name: "Numbers", ages: "Class 2–3", blurb: "Add and take away to 100, times 2, 5, 10", emoji: "🔢", tile: "from-[#FF8A5B] to-[#FF5E7E]", exam: 10 },
  { id: "class4", name: "Number power", ages: "Class 4", blurb: "Times tables, divide, big sums, missing numbers", emoji: "🚀", tile: "from-[#4FACFE] to-[#6C63FF]", exam: 15 },
]

/** Which level fits a student's class. */
export const trackForAge = (age?: string): Track => {
  const g = gradeOf(age)
  return g === null || g <= 1 ? "little" : g <= 3 ? "numbers" : "class4"
}

const asText = (v: number | string) => (typeof v === "number" ? m(v) : v)

export function makeQuestion(topicIds: string[]): Question {
  const id = pick(topicIds) // pick once – picking inside find() chose a new topic for every comparison
  const topic = topics.find((t) => t.id === id)!
  const made = topic.make()
  const answer = asText(made.answer)
  const wrong = new Set<string>()
  for (const n of made.near ?? []) {
    const s = asText(n)
    if (s !== answer && wrong.size < 3) wrong.add(s)
  }
  let guard = 0
  while (wrong.size < 3 && guard++ < 50) {
    if (typeof made.answer === "number") {
      const spread = Math.abs(made.answer) > 30 ? 10 : 4
      const w = made.answer + nz(-spread, spread)
      if ((made.plain || made.small) && (w < 0 || w > 10)) continue // Class 0–1 answers stay between 0 and 10
      if (w < 0) continue
      if (asText(w) !== answer) wrong.add(asText(w))
    } else break
  }
  const choices = [answer, ...wrong].sort(() => Math.random() - 0.5)
  return { prompt: made.prompt ?? "What is", expr: made.expr, answer, choices, plain: made.plain }
}
