// Sudoku generator + solver for 4×4, 6×6 and 9×9 boards.
// Every puzzle is checked to have exactly one solution.

export type Size = 4 | 6 | 9
export type Grid = number[] // row-major, 0 = empty

/** Box shape for each size: 4×4 → 2×2 boxes, 6×6 → 2×3, 9×9 → 3×3. */
export const boxOf = (size: Size) => (size === 4 ? { r: 2, c: 2 } : size === 6 ? { r: 2, c: 3 } : { r: 3, c: 3 })

/** Cells to remove: more empty cells = harder. */
const HOLES: Record<Size, number> = { 4: 9, 6: 20, 9: 46 }

function canPlace(g: Grid, size: Size, i: number, v: number) {
  const row = Math.floor(i / size)
  const col = i % size
  const { r, c } = boxOf(size)
  for (let k = 0; k < size; k++) {
    if (g[row * size + k] === v || g[k * size + col] === v) return false
  }
  const br = row - (row % r)
  const bc = col - (col % c)
  for (let y = br; y < br + r; y++) for (let x = bc; x < bc + c; x++) if (g[y * size + x] === v) return false
  return true
}

const shuffled = (n: number) => {
  const a = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Fills the grid in place (random order); returns false if impossible. */
function fill(g: Grid, size: Size): boolean {
  const i = g.indexOf(0)
  if (i === -1) return true
  for (const v of shuffled(size)) {
    if (canPlace(g, size, i, v)) {
      g[i] = v
      if (fill(g, size)) return true
      g[i] = 0
    }
  }
  return false
}

/** Counts solutions, stopping early at `limit`. */
export function countSolutions(g: Grid, size: Size, limit = 2): number {
  // pick the empty cell with the fewest options (fast)
  let best = -1
  let bestOpts: number[] = []
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== 0) continue
    const opts: number[] = []
    for (let v = 1; v <= size; v++) if (canPlace(g, size, i, v)) opts.push(v)
    if (opts.length === 0) return 0
    if (best === -1 || opts.length < bestOpts.length) {
      best = i
      bestOpts = opts
      if (opts.length === 1) break
    }
  }
  if (best === -1) return 1
  let total = 0
  for (const v of bestOpts) {
    g[best] = v
    total += countSolutions(g, size, limit - total)
    g[best] = 0
    if (total >= limit) break
  }
  return total
}

export type Puzzle = { size: Size; start: Grid; solution: Grid }

export function makePuzzle(size: Size): Puzzle {
  const solution: Grid = Array(size * size).fill(0)
  fill(solution, size)
  const start = solution.slice()
  // remove cells in random order, keeping the answer unique
  const order = shuffled(size * size).map((n) => n - 1)
  let removed = 0
  for (const i of order) {
    if (removed >= HOLES[size]) break
    const keep = start[i]
    start[i] = 0
    if (countSolutions(start.slice(), size) !== 1) start[i] = keep
    else removed++
  }
  return { size, start, solution }
}

/** Is value v at cell i clashing with another cell in its row/column/box? */
export function clashes(g: Grid, size: Size, i: number) {
  const v = g[i]
  if (!v) return false
  const saved = g[i]
  g[i] = 0
  const ok = canPlace(g, size, i, v)
  g[i] = saved
  return !ok
}
