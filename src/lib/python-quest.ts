// Python Quest: levels + the island world that runs a child's Python code.
import { PyError, pyStr, run, codeLines, type Builtin } from "@/lib/mini-python"

export type Pos = { x: number; y: number }
export type Dir = "right" | "left" | "up" | "down"

export type QuestEvent =
  | { k: "move"; to: Pos; dir: Dir; line: number; gem?: boolean }
  | { k: "print"; text: string; line: number }
  | { k: "say"; text: string; line: number }

export type Level = {
  id: number
  title: string
  concept: string
  lesson: string
  example: string
  task: string
  /** S start · G apple · # tree · ~ water · * gem · . grass */
  map?: string[]
  collectAll?: boolean
  requirePrint?: boolean
  expectedOutput?: string[]
  starter: string
  hint: string
  solution: string
  /** lines of code for 3 stars */
  par: number
  /** snippets shown as quick-insert buttons */
  snippets: string[]
}

const MOVE = ["right()", "left()", "up()", "down()"]

export const levels: Level[] = [
  {
    id: 1,
    title: "Hello, Python!",
    concept: "print()",
    lesson: "print() shows a message. Put your words inside quotes, inside the brackets.",
    example: 'print("Hi!")',
    task: "Make Monty say hello with print().",
    map: [".....", "..S..", "....."],
    requirePrint: true,
    starter: '# Write a message between the quotes\nprint("")',
    hint: 'Type your message between the quotes, like print("Hello, I am Monty!")',
    solution: 'print("Hello, I am Monty!")',
    par: 1,
    snippets: ['print("Hello")'],
  },
  {
    id: 2,
    title: "First Steps",
    concept: "calling functions",
    lesson: "right() is a function. Calling it moves Monty one step to the right. Each line runs one after another.",
    example: "right()\nright()",
    task: "Help Monty reach the apple 🍎.",
    map: [".....", "S...G", "....."],
    starter: "right()\n",
    hint: "The apple is 4 steps away. Write right() on 4 lines.",
    solution: "right()\nright()\nright()\nright()",
    par: 4,
    snippets: ["right()"],
  },
  {
    id: 3,
    title: "Giant Steps",
    concept: "arguments",
    lesson: "You can put a number inside the brackets. right(3) moves 3 steps at once!",
    example: "right(3)",
    task: "Reach the apple using only ONE line of code.",
    map: ["........", "S......G", "........"],
    starter: "right()",
    hint: "Count the steps to the apple and put that number in the brackets.",
    solution: "right(7)",
    par: 1,
    snippets: ["right(2)"],
  },
  {
    id: 4,
    title: "Around the Corner",
    concept: "directions",
    lesson: "Monty knows 4 moves: right(), left(), up() and down(). Trees 🌳 block the way.",
    example: "right(2)\ndown(1)",
    task: "Find the path around the trees to the apple.",
    map: ["S...#", "###.#", "###.#", "###..", "####G"],
    starter: "",
    hint: "Go right 3, then down 3, then right 1, then down 1.",
    solution: "right(3)\ndown(3)\nright(1)\ndown(1)",
    par: 4,
    snippets: MOVE,
  },
  {
    id: 5,
    title: "Gem Collector",
    concept: "planning",
    lesson: "Walk over a gem 💎 to collect it. Plan the whole path before you run!",
    example: "right(4)\ndown(2)",
    task: "Collect ALL the gems, then reach the apple.",
    map: ["S.*..", "####.", "..*..", ".####", "..*.G"],
    collectAll: true,
    starter: "",
    hint: "Snake along the rows: right, down, left, down, right.",
    solution: "right(4)\ndown(2)\nleft(4)\ndown(2)\nright(4)",
    par: 5,
    snippets: MOVE,
  },
  {
    id: 6,
    title: "Loop the Stairs",
    concept: "for loops",
    lesson:
      "A for loop repeats code. The lines under it must be indented (press Tab). range(5) means “do it 5 times”.",
    example: "for i in range(3):\n    right()",
    task: "Climb down the stairs with a loop.",
    map: ["S#####", "..####", "#..###", "##..##", "###..#", "####.G"],
    starter: "for i in range(5):\n    ",
    hint: "Inside the loop, move down() and then right().",
    solution: "for i in range(5):\n    down()\n    right()",
    par: 3,
    snippets: ["for i in range(3):", ...MOVE],
  },
  {
    id: 7,
    title: "Double Stairs",
    concept: "loops + numbers",
    lesson: "You can use numbers inside a loop too. Each stair here is 2 steps big.",
    example: "for i in range(2):\n    right(2)\n    down(2)",
    task: "Collect both gems and reach the apple using a loop.",
    map: ["S..####", "##.####", "##*..##", "####.##", "####*..", "######.", "######G"],
    collectAll: true,
    starter: "",
    hint: "The pattern right(2), down(2) repeats 3 times.",
    solution: "for i in range(3):\n    right(2)\n    down(2)",
    par: 3,
    snippets: ["for i in range(3):", "right(2)", "down(2)", ...MOVE],
  },
  {
    id: 8,
    title: "Magic Boxes",
    concept: "variables",
    lesson: "A variable is a box with a name that keeps a value. side = 4 puts 4 in the box. Use its name instead of the number!",
    example: "side = 4\nright(side)",
    task: "Walk around the lake 🌊 collecting all the gems, then reach the apple.",
    map: ["S...*", "G~~~.", ".~~~.", ".~~~.", "*...*"],
    collectAll: true,
    starter: "side = 4\n",
    hint: "right(side), down(side), left(side), then up(side - 1).",
    solution: "side = 4\nright(side)\ndown(side)\nleft(side)\nup(side - 1)",
    par: 5,
    snippets: ["side = 4", "right(side)", "down(side)", "left(side)", "up(side - 1)"],
  },
  {
    id: 9,
    title: "Zig-Zag",
    concept: "bigger loops",
    lesson: "A loop can hold many lines. Find the part of the path that repeats!",
    example: "for i in range(2):\n    right(4)\n    down(1)",
    task: "Collect all 4 gems, then reach the apple.",
    map: ["S...*", "*....", "....*", "*....", "G...."],
    collectAll: true,
    starter: "for i in range(2):\n    ",
    hint: "Repeat 2 times: right(4), down(1), left(4), down(1).",
    solution: "for i in range(2):\n    right(4)\n    down(1)\n    left(4)\n    down(1)",
    par: 5,
    snippets: ["for i in range(2):", "right(4)", "left(4)", "down(1)"],
  },
  {
    id: 10,
    title: "Pattern Maker",
    concept: "loops + text",
    lesson: 'You can multiply text! "*" * 3 makes "***". range(1, 5) counts 1, 2, 3, 4.',
    example: 'print("*" * 3)',
    task: "Print this triangle:\n*\n**\n***\n****",
    expectedOutput: ["*", "**", "***", "****"],
    starter: "for i in range(1, 5):\n    ",
    hint: 'Inside the loop: print("*" * i)',
    solution: 'for i in range(1, 5):\n    print("*" * i)',
    par: 2,
    snippets: ["for i in range(1, 5):", 'print("*" * i)'],
  },
]

// ------------------------------------------------------------------ world

export type World = {
  width: number
  height: number
  start: Pos
  goal: Pos | null
  gems: Pos[]
  cell: (p: Pos) => string
}

export function parseMap(map: string[] = []): World {
  let start: Pos = { x: 0, y: 0 }
  let goal: Pos | null = null
  const gems: Pos[] = []
  map.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === "S") start = { x, y }
      if (c === "G") goal = { x, y }
      if (c === "*") gems.push({ x, y })
    })
  )
  return {
    width: Math.max(0, ...map.map((r) => r.length)),
    height: map.length,
    start,
    goal,
    gems,
    cell: ({ x, y }) => map[y]?.[x] ?? " ",
  }
}

const delta: Record<Dir, Pos> = { right: { x: 1, y: 0 }, left: { x: -1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } }

export type QuestResult = {
  events: QuestEvent[]
  output: string[]
  error: PyError | null
  success: boolean
  message: string
  lines: number
}

/** Runs the child's code on the island and says whether the level is solved. */
export function simulate(level: Level, code: string): QuestResult {
  const world = parseMap(level.map)
  const events: QuestEvent[] = []
  const output: string[] = []
  const gemsLeft = new Set(world.gems.map((g) => `${g.x},${g.y}`))
  let pos = { ...world.start }

  const mover =
    (dir: Dir): Builtin =>
    (args, line) => {
      if (!level.map) throw new PyError("NameError", line, `Line ${line}: Monty doesn’t need to move in this level. Use print().`)
      const n = args.length ? args[0] : 1
      if (typeof n !== "number" || !Number.isInteger(n) || n < 0)
        throw new PyError("TypeError", line, `Line ${line}: ${dir}() needs a whole number, like ${dir}(3).`)
      for (let s = 0; s < n; s++) {
        const next = { x: pos.x + delta[dir].x, y: pos.y + delta[dir].y }
        const c = world.cell(next)
        if (c === " ") throw new PyError("Bump", line, `Line ${line}: Oops! Monty can’t leave the island. 🏝️`)
        if (c === "#") throw new PyError("Bump", line, `Line ${line}: Bonk! Monty bumped into a tree. 🌳`)
        if (c === "~") throw new PyError("Bump", line, `Line ${line}: Splash! Monty can’t swim. 🌊`)
        pos = next
        const key = `${pos.x},${pos.y}`
        const gem = gemsLeft.delete(key)
        events.push({ k: "move", to: { ...pos }, dir, line, gem })
      }
    }

  const builtins: Record<string, Builtin> = {
    right: mover("right"),
    left: mover("left"),
    up: mover("up"),
    down: mover("down"),
    print: (args, line) => {
      const text = args.map(pyStr).join(" ")
      output.push(text)
      events.push({ k: "print", text, line })
    },
    say: (args, line) => {
      const text = args.map(pyStr).join(" ")
      events.push({ k: "say", text, line })
    },
  }

  let error: PyError | null = null
  try {
    run(code, { builtins })
  } catch (e) {
    error = e instanceof PyError ? e : new PyError("Error", 1, "Something went wrong. Check your code.")
  }

  const lines = codeLines(code)
  if (error) return { events, output, error, success: false, message: error.message, lines }

  if (level.expectedOutput) {
    const ok = output.length === level.expectedOutput.length && output.every((l, i) => l === level.expectedOutput![i])
    return {
      events,
      output,
      error,
      lines,
      success: ok,
      message: ok ? "🎉 Perfect pattern!" : `Not quite. Your code printed ${output.length} line(s). Compare it with the pattern above.`,
    }
  }
  if (level.requirePrint && !output.some((t) => t.trim())) {
    return { events, output, error, lines, success: false, message: "Use print() with some words inside the quotes." }
  }
  if (world.goal) {
    if (level.collectAll && gemsLeft.size)
      return {
        events,
        output,
        error,
        lines,
        success: false,
        message: `Almost! Monty still needs ${gemsLeft.size} more gem${gemsLeft.size > 1 ? "s" : ""} 💎.`,
      }
    if (pos.x !== world.goal.x || pos.y !== world.goal.y) {
      const away = Math.abs(pos.x - world.goal.x) + Math.abs(pos.y - world.goal.y)
      return { events, output, error, lines, success: false, message: `Monty is ${away} step${away > 1 ? "s" : ""} away from the apple 🍎. Keep going!` }
    }
  }
  return { events, output, error, lines, success: true, message: world.goal ? "🎉 Monty reached the apple!" : "🎉 Great job!" }
}

/** 3★ within the line goal, 2★ solved, 1★ solved after looking at the answer. */
export function questStars(result: QuestResult, level: Level, usedSolution: boolean) {
  if (!result.success) return 0
  if (usedSolution) return 1
  return result.lines <= level.par ? 3 : 2
}
