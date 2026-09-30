// Writing assignments with corrections, different for every class group.
// The texts live in src/data/assignment-texts/ (one file per class group).
// Markup inside a text:  [wrong|right|why|alt]
//   wrong = what the student wrote ("" = something is missing)
//   right = the correction ("" = the word should be removed)
//   alt   = a believable wrong choice for the "Fix it yourself" quiz

import { class03 } from "@/data/assignment-texts/class-0-3"
import { class46 } from "@/data/assignment-texts/class-4-6"
import { gradeOf } from "@/lib/accounts"

export type Segment =
  | { k: "text"; text: string }
  | { k: "fix"; id: number; wrong: string; right: string; why: string; alt: string }

export type Assignment = {
  id: string
  age: string
  title: string
  emoji: string
  level: string
  topic: string
  color: string
  raw: string
}

/** Writing texts come in two sets: one shared by Class 0–3, one for Class 4. */
export const ageGroups = ["Class 0–3", "Class 4"]

/** The text set for a student's class label ("Class 2" → "Class 0–3"). */
export const assignmentGroupFor = (band?: string) => {
  const g = gradeOf(band)
  return g === null ? undefined : g <= 3 ? "Class 0–3" : "Class 4"
}

// Class 0–3: 10 topics (~60 words) · Class 4: 15 topics (~150 words)
export const assignments: Assignment[] = [...class03, ...class46]

/** Turns the markup into text + corrections. */
export function parse(raw: string): Segment[] {
  const out: Segment[] = []
  const re = /\[([^\]|]*)\|([^\]|]*)\|([^\]|]*)\|([^\]]*)\]/g
  let last = 0
  let id = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(raw))) {
    if (m.index > last) out.push({ k: "text", text: raw.slice(last, m.index) })
    out.push({ k: "fix", id: id++, wrong: m[1], right: m[2], why: m[3], alt: m[4] })
    last = m.index + m[0].length
  }
  if (last < raw.length) out.push({ k: "text", text: raw.slice(last) })
  return out
}

/** Only real mistakes (not “Correct!” items) count as corrections. */
export const fixesOf = (a: Assignment) =>
  parse(a.raw).filter((s): s is Extract<Segment, { k: "fix" }> => s.k === "fix" && s.wrong !== s.right)

export const wordCount = (a: Assignment) =>
  parse(a.raw)
    .map((s) => (s.k === "text" ? s.text : s.right))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length
