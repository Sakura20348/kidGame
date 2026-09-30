export type KidsGame = {
  id: string
  path: string
  title: string
  skill: string
  blurb: string
  emoji: string
  /** Tailwind classes for the tile background */
  tile: string
  /** A drawn icon used instead of the emoji for older students (Class 4 and up) – see GameIcon */
  artForOlder?: "word-builder"
}

export const kidsGames: KidsGame[] = [
  {
    id: "math",
    path: "/kids/math",
    title: "Math Sprint",
    skill: "Math",
    blurb: "Counting and numbers for Class 0–1, add and take away for Class 2–3, times tables and more for Class 4.",
    emoji: "🚀",
    tile: "from-[#FF8A5B] to-[#FF5E7E]",
  },
  {
    id: "crossmath",
    path: "/kids/crossmath",
    title: "CrossMath",
    skill: "Math",
    blurb: "Rows and columns are sums — fill in the missing numbers.",
    emoji: "➕",
    tile: "from-[#FFB347] to-[#FF7A59]",
  },
  {
    id: "words",
    path: "/kids/words",
    title: "Word Builder",
    skill: "Reading",
    blurb: "Spell the missing words and build a story — a level for every class, from 3-letter words in Class 0 to story words in Class 4.",
    emoji: "🔤",
    tile: "from-[#4FACFE] to-[#6C63FF]",
    artForOlder: "word-builder",
  },
  {
    id: "memory",
    path: "/kids/memory",
    title: "Word Connect",
    skill: "Words",
    blurb: "Connections: find the groups · Word Solitaire: sort the words into categories.",
    emoji: "🔗",
    tile: "from-[#B06AB3] to-[#7B4397]",
  },
  {
    id: "clock",
    path: "/kids/clock",
    title: "Clock Quest",
    skill: "Time",
    blurb: "Read the clock and pick the right time.",
    emoji: "⏰",
    tile: "from-[#2BC0A4] to-[#1F9D6B]",
  },
  {
    id: "typing",
    path: "/kids/typing",
    title: "Typing Race",
    skill: "Typing",
    blurb: "Type the words as fast as you can. Watch your speed grow!",
    emoji: "⌨️",
    tile: "from-[#4A4E5C] to-[#2B2D35]",
  },
  {
    id: "chess",
    path: "/kids/chess",
    title: "Chess Friends",
    skill: "Strategy",
    blurb: "Play chess against 5 animal friends, from easy to champion.",
    emoji: "♟️",
    tile: "from-[#C8864B] to-[#8B5A2B]",
  },
  {
    id: "reading",
    path: "/kids/reading",
    title: "Learn to Read",
    skill: "Reading",
    blurb: "Listen, read and understand words, sentences and stories.",
    emoji: "📖",
    tile: "from-[#F6A85B] to-[#E0607E]",
  },
  {
    id: "python",
    path: "/kids/python",
    title: "Python Quest",
    skill: "Coding",
    blurb: "Write real Python code to guide Monty across the island.",
    emoji: "🐍",
    tile: "from-[#3E8E5E] to-[#1F4D8C]",
  },
  {
    id: "climb",
    path: "/kids/climb",
    title: "Mountain Climb",
    skill: "Numbers",
    blurb: "Solve math to climb 5 mountains — easy for Class 0–3, medium for Class 4.",
    emoji: "🧗",
    tile: "from-[#56CCF2] to-[#2F80ED]",
  },
  {
    id: "helpers",
    path: "/kids/helpers",
    title: "Town Helpers",
    skill: "Logic",
    blurb: "Help your neighbours every day by thinking things through.",
    emoji: "🤝",
    tile: "from-[#FFB86B] to-[#FF6F91]",
  },
  {
    id: "sudoku",
    path: "/kids/sudoku",
    title: "Sudoku",
    skill: "Mantiq",
    blurb: "Har qator, ustun va qutida raqamlar faqat bir martadan! Raqamlar yoki rasmlar bilan.",
    emoji: "🧩",
    tile: "from-[#7FB2FF] to-[#6A5ACD]",
  },
]

/** 10 questions -> 0–3 stars */
export function starsFor(score: number, total: number) {
  const ratio = score / total
  if (ratio >= 0.9) return 3
  if (ratio >= 0.7) return 2
  if (ratio >= 0.4) return 1
  return 0
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
