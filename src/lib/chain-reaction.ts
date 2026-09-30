// Butterfly Effect: 5 stages × 5 levels of long chain-reaction courses.
// Levels are generated from a seed out of proven building blocks, then
// verified offline (see the seed table in src/data/butterfly-seeds.ts).
import Matter from "matter-js"

const { Bodies, Body, Composite, Constraint, Engine, Events } = Matter

export const VIEW = { w: 1000, h: 600 } // what the camera shows (world units)
export const GROUND = 560
export const LAUNCHER = { x: 70, y: 505 }
export const BALL_R = 11
export const MAX_THROWS = 3
const DOMINO_H = 80
const GAP = 45 // domino spacing

// ------------------------------------------------------------------ stages

export type Stage = {
  id: number
  name: string
  emoji: string
  blurb: string
  tile: string
  theme: "garden" | "beach" | "forest" | "snow" | "night"
}

export const stages: Stage[] = [
  { id: 1, name: "Flower Garden", emoji: "🌷", blurb: "Dominoes and stairs", tile: "from-[#8FD3FF] to-[#7CC46A]", theme: "garden" },
  { id: 2, name: "Sunset Beach", emoji: "🏖️", blurb: "Marbles roll down slides", tile: "from-[#FFB36B] to-[#FF6F91]", theme: "beach" },
  { id: 3, name: "Deep Forest", emoji: "🌲", blurb: "Balloons join the chain", tile: "from-[#6FCF97] to-[#1F6B4F]", theme: "forest" },
  { id: 4, name: "Snowy Peaks", emoji: "❄️", blurb: "Longer, trickier courses", tile: "from-[#CFE8FF] to-[#6A8FD8]", theme: "snow" },
  { id: 5, name: "Starry Night", emoji: "🌌", blurb: "The biggest butterfly effects", tile: "from-[#6A5ACD] to-[#1B1F4B]", theme: "night" },
]

// ------------------------------------------------------------------ level spec

export type Item =
  | { t: "block"; x: number; y: number; w: number; h: number } // static, x/y = centre
  | { t: "glass"; x: number; y: number; w: number; h: number }
  | { t: "rock"; x: number; y: number; w: number; h: number } // obstacle in the ball's way
  | { t: "ramp"; from: [number, number]; to: [number, number] }
  | { t: "domino"; x: number; base: number }
  | { t: "marble"; x: number; y: number }
  | { t: "balloon"; x: number; y: number; hang: { x: number; y: number } } // holds a marble

export type LevelSpec = {
  stage: number
  level: number
  seed: number
  width: number
  items: Item[]
  flower: { x: number; y: number }
  /** x where the glass ceiling starts (everything after is covered) */
  coverFrom: number
}

/** Small seeded random generator (same seed → same level everywhere). */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type SegKind = "run" | "steps" | "slide" | "balloon"

// Tested geometry (see the transition tests): step drops of 45 always pass the
// push on; a marble slide must end in a small drop-off so the marble hits the
// next domino high up instead of rolling into its feet.
const STEP_DROP = 45
const DROP_OFF = 55

/** Builds a long course for stage/level from a seed. */
export function generateLevel(stage: number, level: number, seed: number): LevelSpec {
  const rand = rng(seed * 7919 + stage * 131 + level)
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
  const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1))

  const items: Item[] = []
  const kinds: SegKind[] =
    stage === 1 ? ["run", "steps"] : stage === 2 ? ["run", "steps", "slide"] : ["run", "steps", "slide", "balloon"]
  const segments = 3 + stage + Math.floor(level / 2) // 4 … 10 segments → very long courses

  const topY = stage === 1 ? 300 : stage === 2 ? 260 : 230 // first tower surface
  let y = topY
  const startX = 330
  let x = startX // where the next domino goes
  let lastDomino = x

  const platform = (from: number, to: number, surface: number) =>
    items.push({ t: "block", x: (from + to) / 2, y: (surface + GROUND + 40) / 2, w: to - from, h: GROUND + 40 - surface })

  const dominoRun = (n: number, surface: number) => {
    for (let i = 0; i < n; i++) {
      items.push({ t: "domino", x, base: surface })
      lastDomino = x
      x += GAP
    }
  }

  /** marble after the last domino → slide → drop-off → dominoes */
  const slide = (drop: number) => {
    // +58/+64: tested so the last domino hits the marble but can't pin it
    items.push({ t: "marble", x: lastDomino + 58, y: y - 16 })
    const edge = lastDomino + 64
    platform(lastDomino + 20, edge, y)
    const len = Math.round(drop * 1.25)
    items.push({ t: "ramp", from: [edge, y + 5], to: [edge + len, y + drop] })
    return { end: edge + len, landing: y + drop + DROP_OFF }
  }

  // 1) first segment on a tall tower – the ball has to reach it
  dominoRun(int(4, 6), y)
  platform(startX - 30, lastDomino + 25, y)
  let coverFrom = lastDomino + 30

  let lastKind: SegKind = "run"
  for (let s = 1; s < segments; s++) {
    let kind = pick(kinds)
    const room = GROUND - y
    if (kind === "steps" && room < STEP_DROP) kind = "run"
    if (kind === "slide" && room < 110 + DROP_OFF) kind = room >= STEP_DROP ? "steps" : "run"
    if (kind === "balloon" && room < 2 * (110 + DROP_OFF)) kind = room >= 110 + DROP_OFF ? "slide" : "run"
    if (kind === "run" && lastKind === "run" && room >= STEP_DROP) kind = "steps"

    if (kind === "run") {
      const from = lastDomino + 25
      dominoRun(int(5, 9), y)
      platform(from, lastDomino + 25, y)
    } else if (kind === "steps") {
      const steps = Math.min(int(2, 4), Math.floor(room / STEP_DROP))
      for (let k = 0; k < steps; k++) {
        const from = lastDomino + 22
        y += STEP_DROP
        dominoRun(3, y)
        platform(from, lastDomino + 25, y)
      }
    } else if (kind === "slide") {
      const drop = Math.min(int(110, 170), room - DROP_OFF)
      const { end, landing } = slide(drop)
      y = landing
      x = end + 25
      dominoRun(int(4, 7), y)
      platform(end - 5, lastDomino + 25, y)
    } else {
      // marble A rolls into a balloon; the pop drops marble B onto a second slide
      const d1 = Math.min(int(110, 140), Math.floor((room - 2 * DROP_OFF) / 2))
      const first = slide(d1)
      y = first.landing
      const flatTo = first.end + 140
      platform(first.end - 5, flatTo, y)
      items.push({ t: "balloon", x: flatTo - 30, y: y - 22, hang: { x: flatTo + 30, y: y - 70 } })
      const d2 = Math.min(int(110, 140), GROUND - y - DROP_OFF)
      const len = Math.round(d2 * 1.25)
      items.push({ t: "ramp", from: [flatTo, y + 5], to: [flatTo + len, y + d2] })
      y = y + d2 + DROP_OFF
      x = flatTo + len + 25
      dominoRun(int(4, 6), y)
      platform(flatTo + len - 5, lastDomino + 25, y)
    }
    lastKind = kind
  }

  const flower = { x: lastDomino + 88, y: y - 22 }
  platform(lastDomino + 25, lastDomino + 200, y)
  const width = Math.max(VIEW.w + 400, lastDomino + 280)

  // glass ceiling over everything after the first tower, with a flap at its start
  const ceilY = topY - 135
  items.push({ t: "glass", x: (coverFrom + width) / 2, y: ceilY, w: width - coverFrom, h: 12 })
  items.push({ t: "glass", x: coverFrom, y: ceilY + 20, w: 10, h: 40 })
  // rocks hanging from the ceiling along the whole course
  for (let rx = coverFrom + 220; rx < width - 160; rx += int(200, 320)) {
    items.push({ t: "rock", x: rx, y: ceilY + 26, w: int(36, 64), h: int(36, 52) })
  }

  // obstacles between the launcher and the first tower – more on harder levels
  const obstacles = 1 + Math.floor(stage / 2) + Math.floor(level / 3) // 1 … 4
  for (let i = 0; i < obstacles; i++) {
    const ox = int(150, startX - 50)
    const oy = int(Math.max(120, topY - 120), 440)
    const tall = rand() < 0.5
    items.push({ t: "rock", x: ox, y: oy, w: tall ? int(24, 34) : int(60, 100), h: tall ? int(70, 130) : int(20, 28) })
  }
  return { stage, level, seed, width, items, flower, coverFrom: coverFrom - 5 }
}

// ------------------------------------------------------------------ physics

export type Balloon = { sensor: Matter.Body; tie: Matter.Constraint; hung: Matter.Body; popped: boolean }

export type Built = {
  engine: Matter.Engine
  spec: LevelSpec
  statics: Matter.Body[]
  dominoes: Matter.Body[]
  marbles: Matter.Body[]
  boxes: Matter.Body[]
  balloons: Balloon[]
  flower: Matter.Body
  balls: Matter.Body[]
  won: { at: number | null }
  onEvent?: (e: "pop" | "win" | "hit") => void
}

export function buildLevel(spec: LevelSpec): Built {
  const engine = Engine.create({ enableSleeping: true })
  engine.gravity.y = 1
  const statics: Matter.Body[] = []
  const dominoes: Matter.Body[] = []
  const marbles: Matter.Body[] = []
  const boxes: Matter.Body[] = []
  const balloons: Balloon[] = []
  const add = (b: Matter.Body | Matter.Constraint) => Composite.add(engine.world, b)
  const W = spec.width

  const ground = Bodies.rectangle(W / 2, GROUND + 40, W + 400, 80, { isStatic: true, label: "ground", friction: 0.8 })
  const left = Bodies.rectangle(-30, VIEW.h / 2 - 300, 60, VIEW.h * 3, { isStatic: true, label: "wall" })
  const right = Bodies.rectangle(W + 30, VIEW.h / 2 - 300, 60, VIEW.h * 3, { isStatic: true, label: "wall" })
  statics.push(ground)
  ;[ground, left, right].forEach(add)

  const marbleOpts = { label: "marble", density: 0.01, friction: 0.01, frictionAir: 0.002, restitution: 0.2 }

  for (const it of spec.items) {
    if (it.t === "block" || it.t === "glass" || it.t === "rock") {
      const b = Bodies.rectangle(it.x, it.y, it.w, it.h, {
        isStatic: true,
        label: it.t,
        friction: it.t === "glass" ? 0.2 : 0.8,
        chamfer: it.t === "rock" ? { radius: 8 } : undefined,
      })
      statics.push(b)
      add(b)
    } else if (it.t === "ramp") {
      const [x1, y1] = it.from
      const [x2, y2] = it.to
      const len = Math.hypot(x2 - x1, y2 - y1)
      const b = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2 + 7, len, 14, {
        isStatic: true,
        angle: Math.atan2(y2 - y1, x2 - x1),
        label: "ramp",
        friction: 0.02,
      })
      statics.push(b)
      add(b)
    } else if (it.t === "domino") {
      const d = Bodies.rectangle(it.x, it.base - DOMINO_H / 2, 16, DOMINO_H, { label: "domino", density: 0.004, friction: 0.5, restitution: 0.05 })
      dominoes.push(d)
      add(d)
    } else if (it.t === "marble") {
      const m = Bodies.circle(it.x, it.y, 16, marbleOpts)
      marbles.push(m)
      add(m)
    } else if (it.t === "balloon") {
      const sensor = Bodies.circle(it.x, it.y, 26, { isStatic: true, isSensor: true, label: "balloon" })
      const hung = Bodies.circle(it.hang.x, it.hang.y, 16, marbleOpts)
      marbles.push(hung)
      const tie = Constraint.create({ pointA: { x: it.hang.x, y: it.hang.y - 60 }, bodyB: hung, length: 44, stiffness: 0.9, damping: 0.1 })
      balloons.push({ sensor, tie, hung, popped: false })
      ;[sensor, hung, tie].forEach(add)
    }
  }

  const flower = Bodies.circle(spec.flower.x, spec.flower.y, 26, { isStatic: true, isSensor: true, label: "flower" })
  add(flower)

  const built: Built = { engine, spec, statics, dominoes, marbles, boxes, balloons, flower, balls: [], won: { at: null } }
  const marbleStart = new Map(marbles.map((m) => [m, { ...m.position }]))
  /** every marble must have rolled and every balloon popped – no shortcuts! */
  const chainComplete = () =>
    balloons.every((b) => b.popped) &&
    marbles.every((m) => Math.hypot(m.position.x - marbleStart.get(m)!.x, m.position.y - marbleStart.get(m)!.y) > 30)

  Events.on(engine, "collisionStart", (ev) => {
    for (const { bodyA, bodyB } of ev.pairs) {
      for (const [a, b] of [
        [bodyA, bodyB],
        [bodyB, bodyA],
      ]) {
        if (a.label === "balloon" && !b.isStatic) {
          const bl = balloons.find((x) => x.sensor === a)
          if (bl && !bl.popped) {
            bl.popped = true
            Composite.remove(engine.world, [bl.sensor, bl.tie])
            Matter.Sleeping.set(bl.hung, false)
            built.onEvent?.("pop")
          }
        }
        // the chain must reach the flower – the thrown ball itself doesn’t count
        if (a.label === "flower" && !b.isStatic && b.label !== "ball" && built.won.at === null && chainComplete()) {
          built.won.at = engine.timing.timestamp
          built.onEvent?.("win")
        }
        if (a.label === "ball" && (b.label === "domino" || b.label === "marble")) built.onEvent?.("hit")
      }
    }
  })
  return built
}

export function throwVelocity(aim: { x: number; y: number }) {
  const dx = aim.x - LAUNCHER.x
  const dy = aim.y - LAUNCHER.y
  const dist = Math.hypot(dx, dy) || 1
  const power = Math.min(dist, 520) * 0.042
  return { x: (dx / dist) * power, y: (dy / dist) * power }
}

export function throwBall(built: Built, aim: { x: number; y: number }) {
  const ball = Bodies.circle(LAUNCHER.x, LAUNCHER.y, BALL_R, { label: "ball", density: 0.03, restitution: 0.35, friction: 0.1, frictionAir: 0.004 })
  Composite.add(built.engine.world, ball)
  Body.setVelocity(ball, throwVelocity(aim))
  built.balls.push(ball)
  return ball
}

/** Rough flight path for the aiming dots (matches the engine’s gravity). */
export function previewPath(aim: { x: number; y: number }, steps = 26) {
  const v = throwVelocity(aim)
  const g = 0.001 * (1000 / 60) ** 2
  const pts: { x: number; y: number }[] = []
  let x = LAUNCHER.x
  let y = LAUNCHER.y
  let vx = v.x
  let vy = v.y
  for (let i = 0; i < steps * 3; i++) {
    vy += g
    vx *= 0.996
    vy *= 0.996
    x += vx
    y += vy
    if (i % 3 === 2) pts.push({ x, y })
    if (y > GROUND) break
  }
  return pts
}

export function settled(built: Built) {
  return Composite.allBodies(built.engine.world).every((b) => b.isStatic || b.isSleeping || b.speed < 0.15)
}

/** The right-most thing that is still moving (the camera follows it). */
export function actionFront(built: Built) {
  let front = -Infinity
  for (const b of Composite.allBodies(built.engine.world)) {
    if (b.isStatic || b.isSleeping || b.speed < 0.3) continue
    front = Math.max(front, b.position.x)
  }
  return front === -Infinity ? null : front
}

/** 1st ball = 3★, 2nd = 2★, 3rd = 1★. */
export const chainStars = (throwsUsed: number) => Math.max(1, 4 - throwsUsed)
