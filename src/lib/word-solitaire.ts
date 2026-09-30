// Word Solitaire tables: words in the columns, category cards in the draw pile.
import { connPuzzles, type ConnGroup, type ConnLevel } from "@/data/connections"
import { shuffle } from "@/data/kids-games"

export type Card = { id: number; kind: "cat" | "word"; group: number; word: string; emoji?: string }
export type Deal = { groups: ConnGroup[]; columns: Card[][]; stock: Card[] }

/** Table size per class: bigger tables and more categories as the classes go up. */
export const table: Record<ConnLevel, { columns: number; depth: number; puzzles: number; spots: number }> = {
  c0: { columns: 2, depth: 3, puzzles: 1, spots: 2 },
  c1: { columns: 3, depth: 3, puzzles: 1, spots: 3 },
  c2: { columns: 3, depth: 4, puzzles: 2, spots: 3 },
  c3: { columns: 4, depth: 4, puzzles: 2, spots: 4 },
  c4: { columns: 4, depth: 6, puzzles: 2, spots: 4 },
}

/** Picks enough category groups (no repeated words) and deals them: words in the columns, categories in the pile. */
export function dealFor(level: ConnLevel): Deal {
  const t = table[level]
  const need = Math.ceil((t.columns * t.depth) / connPuzzles[level][0].groups[0].words.length)
  const groups: ConnGroup[] = []
  const seen = new Set<string>()
  for (const p of shuffle(connPuzzles[level])) {
    for (const g of p.groups) {
      if (groups.length >= need || g.words.some((w) => seen.has(w.toLowerCase()))) continue
      g.words.forEach((w) => seen.add(w.toLowerCase()))
      groups.push(g)
    }
    if (groups.length >= need) break
  }
  let id = 0
  const words = shuffle(groups.flatMap((g, group) => g.words.map((word, i) => ({ id: id++, kind: "word" as const, group, word, emoji: g.emojis?.[i] }))))
  const cats = groups.map((g, group) => ({ id: id++, kind: "cat" as const, group, word: g.name, emoji: g.emojis?.[0] }))
  const columns: Card[][] = Array.from({ length: t.columns }, (_, c) => words.slice(c * t.depth, (c + 1) * t.depth))
  // any words that don't fit go into the pile with the category cards
  return { groups, columns, stock: shuffle([...cats, ...words.slice(t.columns * t.depth)]) }
}

/** Stars from moves compared with the fewest possible (play every card once, draw every pile card once). */
export function solitaireStars(moves: number, deal: Deal) {
  const cards = deal.groups.reduce((n, g) => n + g.words.length + 1, 0)
  const best = cards + deal.groups.length
  return moves <= best * 1.4 ? 3 : moves <= best * 2 ? 2 : 1
}

