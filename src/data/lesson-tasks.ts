// Tasks a teacher builds for a project (New project → Tasks), and students play in the lesson.

import { isYoungAge } from "@/data/lesson-guides"
import { classesIn } from "@/lib/accounts"

/** A picture for a task: an emoji, or an uploaded image (small data URL). */
export type TaskMedia = { emoji?: string; image?: string }

export type LessonTask =
  | { id: string; kind: "choose"; media: TaskMedia; sentence: string; options: string[]; answer: number }
  | { id: string; kind: "question"; media: TaskMedia; question: string; options: string[]; answer: number }
  | { id: string; kind: "pictures"; question: string; options: { label: string; media: TaskMedia }[]; answer: number }
  | { id: string; kind: "match"; pairs: { media: TaskMedia; label: string }[] }
  // "Make 10!": 8 numbers around a + ; find the 4 pairs that add up to the target
  | { id: string; kind: "cube"; target: number; numbers: number[] }
  // "Missing number": each card is a + ☐ = total and total − ☐ = a (both boxes are total − a)
  | { id: string; kind: "missing"; cards: { a: number; total: number }[] }
  // study designs (Class 4)
  | { id: string; kind: "mcq"; question: string; options: string[]; answer: number }
  | { id: string; kind: "truefalse"; statement: string; answer: boolean }
  | { id: string; kind: "gap"; sentence: string; answers: string } // accepted answers, separated by "/"
  | { id: string; kind: "order"; prompt: string; items: string[] } // items in the right order
  // "Sort the words" (Class 4): words go into 2–3 boxes, e.g. Adverbs / Adjectives; words are comma-separated
  | { id: string; kind: "sort"; prompt: string; groups: { name: string; words: string }[] }
  // "Speak it" (Class 4): the student listens, then says the text into the microphone
  | { id: string; kind: "speak"; prompt: string; text: string }

export type TaskKind = LessonTask["kind"]
/** The picture designs (Class 0–3). */
export type KidTask = Extract<LessonTask, { kind: "choose" | "question" | "pictures" | "match" | "cube" | "missing" }>
export const isKidTask = (t: LessonTask): t is KidTask =>
  t.kind === "choose" || t.kind === "question" || t.kind === "pictures" || t.kind === "match" || t.kind === "cube" || t.kind === "missing"

/** Kid designs are for Class 0–3; Class 4 gets the study designs. */
export type TaskAudience = "kid" | "study"
export const audienceFor = (ageGroup?: string): TaskAudience => (isYoungAge(ageGroup) ? "kid" : "study")

export const taskKinds: { kind: TaskKind; audience: TaskAudience; name: string; title: string; blurb: string; emoji: string; classes?: number[] }[] = [
  { kind: "choose", audience: "kid", name: "Choose the right word", title: "Choose the right option", blurb: "A picture and a sentence with a missing word.", emoji: "🧩" },
  { kind: "question", audience: "kid", name: "Which one is it?", title: "Which one is it?", blurb: "A picture and a question with answers to pick from.", emoji: "❓" },
  { kind: "pictures", audience: "kid", name: "Pick the right picture", title: "Pick the right picture", blurb: "Every answer has its own picture.", emoji: "🖼️" },
  { kind: "match", audience: "kid", name: "Match the pairs", title: "Match the pairs", blurb: "Join each picture with its word.", emoji: "🔗" },
  { kind: "missing", audience: "kid", name: "Missing number", title: "Find the missing number!", blurb: "Cards like 7 + ☐ = 10 and 10 − ☐ = 7 — type the number.", emoji: "🚀" },
  { kind: "cube", audience: "kid", name: "Make the number", title: "Make the number!", blurb: "Find 4 pairs in the number cube that add up to 10.", emoji: "🧮" },
  { kind: "mcq", audience: "study", name: "Multiple choice", title: "Choose the best answer", blurb: "A question with two to four answers.", emoji: "🅰️" },
  { kind: "truefalse", audience: "study", name: "True or false", title: "True or false?", blurb: "A statement students judge as true or false.", emoji: "⚖️" },
  { kind: "gap", audience: "study", name: "Fill in the gap", title: "Fill in the gap", blurb: "Students type the missing word themselves.", emoji: "✍️" },
  { kind: "sort", audience: "study", classes: [4], name: "Sort the words", title: "Sort the words", blurb: "Put each word in the right box — e.g. Adverbs or Adjectives.", emoji: "🗂️" },
  { kind: "speak", audience: "study", classes: [4], name: "Speak it", title: "Say it out loud", blurb: "Students listen, then say the words into the microphone.", emoji: "🎙️" },
  { kind: "order", audience: "study", name: "Put in order", title: "Put these in order", blurb: "Sentences or steps to arrange correctly.", emoji: "🔢" },
]

/** The designs for a project's class (some designs are only for certain classes, e.g. "Sort the words" for Class 4). */
export const kindsFor = (audience: TaskAudience, ageGroup?: string) =>
  taskKinds.filter((k) => k.audience === audience && (!k.classes || classesIn(ageGroup).some((g) => k.classes!.includes(g))))

export const kindInfo = (kind: TaskKind) => taskKinds.find((k) => k.kind === kind)!

/** The blank in a "choose" sentence. */
export const BLANK = "___"

/** A new, empty task of this kind for the builder. */
export function blankTask(kind: TaskKind): LessonTask {
  const id = `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  switch (kind) {
    case "choose":
      return { id, kind, media: { emoji: "🌳" }, sentence: "", options: ["", ""], answer: 0 }
    case "question":
      return { id, kind, media: { emoji: "✌️" }, question: "", options: ["", "", "", ""], answer: 0 }
    case "pictures":
      return { id, kind, question: "", options: [0, 1, 2, 3].map(() => ({ label: "", media: {} })), answer: 0 }
    case "match":
      return { id, kind, pairs: [0, 1, 2].map(() => ({ label: "", media: {} })) }
    case "cube":
      return { id, kind, target: 10, numbers: cubeNumbers(10) }
    case "missing":
      return { id, kind, cards: missingCards(6, 10) }
    case "mcq":
      return { id, kind, question: "", options: ["", "", "", ""], answer: 0 }
    case "truefalse":
      return { id, kind, statement: "", answer: true }
    case "gap":
      return { id, kind, sentence: "", answers: "" }
    case "order":
      return { id, kind, prompt: "", items: ["", "", ""] }
    case "speak":
      return { id, kind, prompt: "Listen to the podcast line, then say it out loud.", text: "" }
    case "sort":
      return {
        id,
        kind,
        prompt: "Sort the adverbs and adjectives.",
        groups: [
          { name: "Adverbs", words: "sweetly, happily, fairly, loudly, bravely, carefully, quickly, slowly, sadly" },
          { name: "Adjectives", words: "colorful, large, squeaky, fluffy, hungry, fresh, smelly" },
        ],
      }
  }
}

/** Lower-case, no extra spaces or end punctuation – for checking typed answers. */
export const normalizeAnswer = (s: string) => s.trim().toLowerCase().replace(/[.!?,;:"“”'’]+$/g, "").replace(/\s+/g, " ")

/** Is a typed gap answer one of the accepted ones? */
export const gapAccepts = (t: { answers: string }, typed: string) =>
  t.answers.split("/").map(normalizeAnswer).filter(Boolean).includes(normalizeAnswer(typed))

const hasMedia = (m: TaskMedia) => !!(m.emoji?.trim() || m.image)

/** A friendly problem with the task, or null when it's ready. */
export function taskProblem(t: LessonTask): string | null {
  switch (t.kind) {
    case "choose":
      if (!t.sentence.includes(BLANK)) return `Write the sentence with ${BLANK} where the missing word goes.`
      if (t.options.filter((o) => o.trim()).length < 2) return "Add at least two words to choose from."
      if (!t.options[t.answer]?.trim()) return "Mark the right word."
      return null
    case "question":
      if (!t.question.trim()) return "Write the question."
      if (t.options.filter((o) => o.trim()).length < 2) return "Add at least two answers."
      if (!t.options[t.answer]?.trim()) return "Mark the right answer."
      return null
    case "pictures":
      if (!t.question.trim()) return "Write the question."
      if (t.options.some((o) => !o.label.trim() || !hasMedia(o.media))) return "Every answer needs a picture and a word."
      return null
    case "match":
      if (t.pairs.length < 2) return "Add at least two pairs."
      if (t.pairs.some((p) => !p.label.trim() || !hasMedia(p.media))) return "Every pair needs a picture and a word."
      if (new Set(t.pairs.map((p) => p.label.trim().toLowerCase())).size !== t.pairs.length) return "Each word should be different."
      return null
    case "mcq":
      if (!t.question.trim()) return "Write the question."
      if (t.options.filter((o) => o.trim()).length < 2) return "Add at least two answers."
      if (!t.options[t.answer]?.trim()) return "Mark the right answer."
      return null
    case "missing":
      if (t.cards.length < 1) return "Add at least one card."
      if (t.cards.some((c) => !Number.isInteger(c.a) || !Number.isInteger(c.total) || c.a < 0 || c.total > MISSING_MAX)) return `Use whole numbers from 0 to ${MISSING_MAX}.`
      if (t.cards.some((c) => c.total <= c.a)) return "The total must be bigger than the first number on every card."
      return null
    case "cube":
      if (!Number.isInteger(t.target) || t.target < CUBE_MIN || t.target > CUBE_MAX) return `Choose a number to make from ${CUBE_MIN} to ${CUBE_MAX}.`
      if (t.numbers.length !== 8 || t.numbers.some((n) => !Number.isInteger(n) || n < 0 || n > t.target)) return "Fill all 8 squares with numbers from 0 to the target."
      return cubePairs(t.numbers, t.target) ? null : `The 8 numbers must make 4 pairs that each add up to ${t.target}. Press “New numbers” to fix it.`
    case "truefalse":
      return t.statement.trim() ? null : "Write the statement."
    case "gap":
      if (!t.sentence.includes(BLANK)) return `Write the sentence with ${BLANK} where the missing word goes.`
      return t.answers.split("/").some((a) => a.trim()) ? null : "Write the right answer."
    case "order":
      return t.items.filter((i) => i.trim()).length < 3 ? "Add at least three items." : null
    case "speak": {
      const n = t.text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length
      if (n < 2) return "Write at least two words for students to say."
      return n > 60 ? "Keep it to 60 words or fewer – short parts are easier to say." : null
    }
    case "sort": {
      if (t.groups.length < 2) return "Add at least two boxes."
      if (t.groups.some((g) => !g.name.trim())) return "Give every box a name."
      if (t.groups.some((g) => splitWords(g.words).length < 2)) return "Put at least two words in every box."
      const all = sortWords(t).map((w) => w.word.toLowerCase())
      if (all.length > 24) return "Use 24 words or fewer."
      return new Set(all).size === all.length ? null : "Each word can only be in one box."
    }
  }
}

/** Removes empty answers (and keeps the right one pointing at the same text). */
export function cleanTask(t: LessonTask): LessonTask {
  if (t.kind === "order") return { ...t, items: t.items.map((i) => i.trim()).filter(Boolean) }
  if (t.kind === "choose" || t.kind === "question" || t.kind === "mcq") {
    const right = t.options[t.answer]
    const options = t.options.map((o) => o.trim()).filter(Boolean)
    return { ...t, options, answer: options.indexOf(right.trim()) }
  }
  return t
}

/** One-line summary for the builder list. */
export function taskSummary(t: LessonTask) {
  switch (t.kind) {
    case "choose":
      return t.sentence.replace(BLANK, `[${t.options[t.answer] ?? "?"}]`)
    case "question":
    case "pictures":
      return t.question
    case "match":
      return t.pairs.map((p) => p.label).join(" · ")
    case "cube":
      return `Make ${t.target}: ${t.numbers.join(" ")}`
    case "missing":
      return t.cards.map((c) => `${c.a} + ☐ = ${c.total}`).join(" · ")
    case "mcq":
      return t.question
    case "truefalse":
      return `${t.statement} (${t.answer ? "true" : "false"})`
    case "gap":
      return t.sentence.replace(BLANK, `[${t.answers.split("/")[0]?.trim() || "?"}]`)
    case "order":
      return t.items.join(" → ")
    case "speak":
      return `🎙️ ${t.text}`
    case "sort":
      return t.groups.map((g) => `${g.name} (${splitWords(g.words).length})`).join(" · ")
  }
}

// ------------------------------------------------------------ "Make 10!" number cube

export const CUBE_MIN = 5
export const CUBE_MAX = 20

/** 8 numbers (for the squares around the +) that make 4 pairs adding up to `target`, shuffled. */
export function cubeNumbers(target: number): number[] {
  const firsts = Array.from({ length: Math.floor(target / 2) + 1 }, (_, i) => i).filter((a) => a > 0 || target <= 6)
  // different pairs when there are enough, e.g. 10 → 1+9, 3+7, 4+6, 2+8
  const picked: number[] = []
  const pool = [...firsts].sort(() => Math.random() - 0.5)
  while (picked.length < 4) picked.push(pool.length ? pool.pop()! : firsts[Math.floor(Math.random() * firsts.length)])
  return picked.flatMap((a) => [a, target - a]).sort(() => Math.random() - 0.5)
}

/** The 4 pairs (as square indexes) that add up to the target, or null when the numbers don't pair up. */
export function cubePairs(numbers: number[], target: number): [number, number][] | null {
  const free = numbers.map((_, i) => i)
  const pairs: [number, number][] = []
  while (free.length) {
    const i = free.shift()!
    const j = free.findIndex((k) => numbers[i] + numbers[k] === target)
    if (j < 0) return null
    pairs.push([i, free.splice(j, 1)[0]])
  }
  return pairs
}

// ------------------------------------------------------------ "Missing number" cards

export const MISSING_MAX = 20

/** `count` cards with totals up to `max`, e.g. { a: 7, total: 10 } → 7 + ☐ = 10 and 10 − ☐ = 7. */
export function missingCards(count: number, max: number): { a: number; total: number }[] {
  const seen = new Set<string>()
  const cards: { a: number; total: number }[] = []
  for (let tries = 0; cards.length < count && tries < 500; tries++) {
    const total = 3 + Math.floor(Math.random() * (max - 2))
    const a = 1 + Math.floor(Math.random() * (total - 1))
    if (seen.has(`${a}-${total}`)) continue
    seen.add(`${a}-${total}`)
    cards.push({ a, total })
  }
  return cards
}

// ------------------------------------------------------------ "Sort the words"

export const splitWords = (text: string) => text.split(/[,\n]/).map((w) => w.trim()).filter(Boolean)

/** Every word with the index of the box it belongs in. */
export const sortWords = (t: { groups: { name: string; words: string }[] }) => t.groups.flatMap((g, group) => splitWords(g.words).map((word) => ({ word, group })))
