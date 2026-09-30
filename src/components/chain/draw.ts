// Canvas drawing for the Butterfly Effect (world units, camera scrolls on x).
import type Matter from "matter-js"

import { BALL_R, GROUND, LAUNCHER, VIEW, previewPath, type Built, type Stage } from "@/lib/chain-reaction"

export type Butterfly = { x: number; y: number; vx: number; vy: number; phase: number; size: number; hue: number }
export type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string }

export type Scene = {
  camX: number
  aim: { x: number; y: number } | null
  canThrow: boolean
  won: boolean
  butterflies: Butterfly[]
  sparks: Spark[]
  trails: Map<Matter.Body, { x: number; y: number }[]>
  time: number
  hintAim: { x: number; y: number } | null
  front: number | null
}

type Theme = {
  sky: [string, string, string]
  ground: string
  soil: string
  block: string
  blockTop: string
  ramp: string
}

const THEMES: Record<Stage["theme"], Theme> = {
  garden: { sky: ["#8FD3FF", "#CDEBFF", "#FFF6E5"], ground: "#7CC46A", soil: "#A9794F", block: "#B08968", blockTop: "#7CC46A", ramp: "#C8955F" },
  beach: { sky: ["#FF8E72", "#FFC38A", "#FFF0C2"], ground: "#F2D16B", soil: "#D9B25A", block: "#E0B973", blockTop: "#F7DD8F", ramp: "#B97A4A" },
  forest: { sky: ["#A8DDBF", "#D6F0E0", "#EEF8F1"], ground: "#4E8A3A", soil: "#6B4A2E", block: "#8B6B4A", blockTop: "#5E9B4E", ramp: "#9C6B3F" },
  snow: { sky: ["#BFDFFF", "#E2F0FF", "#F7FBFF"], ground: "#F4F9FF", soil: "#C9DCEE", block: "#CFE3F5", blockTop: "#FFFFFF", ramp: "#9BB7D4" },
  night: { sky: ["#0B1030", "#1C2257", "#33307A"], ground: "#4B3F7A", soil: "#2E2657", block: "#4B3F7A", blockTop: "#8C7CF0", ramp: "#6E5FC0" },
}

const DOMINO_COLORS = ["#FF6B6B", "#FFB347", "#FFD93D", "#6BCB77", "#4D96FF", "#9B72FF", "#FF7AC6"]

// deterministic "random" for scenery so it doesn't flicker
const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function shape(ctx: CanvasRenderingContext2D, b: Matter.Body) {
  ctx.beginPath()
  b.vertices.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)))
  ctx.closePath()
}

function emoji(ctx: CanvasRenderingContext2D, e: string, x: number, y: number, size: number) {
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(e, x, y)
}

// ------------------------------------------------------------------ backgrounds

/** Parallax scenery: far layers move slower than the course. */
function drawBackground(ctx: CanvasRenderingContext2D, stage: Stage, s: Scene) {
  const th = THEMES[stage.theme]
  const { w, h } = VIEW
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND)
  sky.addColorStop(0, th.sky[0])
  sky.addColorStop(0.55, th.sky[1])
  sky.addColorStop(1, th.sky[2])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)
  const t = s.time

  const hills = (factor: number, base: number, amp: number, color: string, period: number) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, GROUND)
    const off = s.camX * factor
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, base - Math.sin((x + off) / period) * amp - Math.sin((x + off) / (period * 0.37)) * amp * 0.4)
    ctx.lineTo(w, GROUND)
    ctx.fill()
  }

  switch (stage.theme) {
    case "garden":
      emoji(ctx, "☀️", 880, 80, 70)
      for (let i = 0; i < 4; i++) emoji(ctx, "☁️", ((i * 330 - s.camX * 0.1 + t * 0.01) % (w + 300) + w + 300) % (w + 300) - 150, 70 + i * 28, 56 - i * 6)
      hills(0.2, 430, 40, "#A8DC92", 180)
      hills(0.45, 480, 30, "#8FCF78", 130)
      for (let i = 0; i < 14; i++) {
        const x = ((i * 173 - s.camX * 0.6) % (w + 200) + w + 200) % (w + 200) - 100
        emoji(ctx, i % 3 ? "🌼" : "🌷", x, 520 + hash(i) * 20, 22)
      }
      break
    case "beach": {
      const sun = ctx.createRadialGradient(760, 380, 10, 760, 380, 120)
      sun.addColorStop(0, "rgba(255,230,150,1)")
      sun.addColorStop(1, "rgba(255,160,90,0)")
      ctx.fillStyle = sun
      ctx.fillRect(560, 240, 400, 280)
      ctx.fillStyle = "#FFD27A"
      ctx.beginPath()
      ctx.arc(760, 390, 55, 0, Math.PI * 2)
      ctx.fill()
      // sea with moving wave lines
      ctx.fillStyle = "#3FA7D6"
      ctx.fillRect(0, 440, w, GROUND - 440)
      ctx.strokeStyle = "rgba(255,255,255,0.5)"
      ctx.lineWidth = 2
      for (let r = 0; r < 4; r++) {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 10) ctx.lineTo(x, 455 + r * 25 + Math.sin((x + s.camX * 0.3 + t * 0.05) / 30 + r) * 3)
        ctx.stroke()
      }
      for (let i = 0; i < 6; i++) {
        const x = ((i * 260 - s.camX * 0.5) % (w + 300) + w + 300) % (w + 300) - 150
        emoji(ctx, "🌴", x, 470, 90)
      }
      emoji(ctx, "⛵", ((700 - s.camX * 0.15 + t * 0.008) % (w + 200) + w + 200) % (w + 200) - 100, 430, 40)
      break
    }
    case "forest":
      for (const [factor, base, size, alpha] of [
        [0.15, 380, 70, 0.35],
        [0.35, 430, 90, 0.6],
        [0.6, 480, 110, 0.9],
      ] as const) {
        ctx.globalAlpha = alpha
        for (let i = 0; i < 12; i++) {
          const x = ((i * 140 + hash(i + size) * 60 - s.camX * factor) % (w + 280) + w + 280) % (w + 280) - 140
          emoji(ctx, "🌲", x, base, size)
        }
      }
      ctx.globalAlpha = 1
      for (let i = 0; i < 16; i++) {
        const x = (hash(i) * w + Math.sin(t / 900 + i) * 30) % w
        const y = 180 + hash(i + 50) * 260 + Math.cos(t / 700 + i) * 20
        ctx.fillStyle = `rgba(255,240,140,${0.4 + Math.sin(t / 300 + i) * 0.3})`
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    case "snow":
      ctx.fillStyle = "#D5E6F7"
      ctx.beginPath()
      ctx.moveTo(0, GROUND)
      for (let x = 0; x <= w; x += 40) ctx.lineTo(x, 300 + Math.abs(Math.sin((x + s.camX * 0.15) / 160)) * 140)
      ctx.lineTo(w, GROUND)
      ctx.fill()
      hills(0.4, 470, 35, "#EAF3FC", 140)
      for (let i = 0; i < 60; i++) {
        const x = ((hash(i) * w + t * 0.02 * (1 + hash(i + 9)) - s.camX * 0.3) % w + w) % w
        const y = (hash(i + 3) * GROUND + t * 0.05 * (1 + hash(i + 7))) % GROUND
        ctx.fillStyle = "rgba(255,255,255,0.9)"
        ctx.beginPath()
        ctx.arc(x, y, 1.5 + hash(i + 1) * 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    case "night":
      for (let i = 0; i < 90; i++) {
        const x = ((hash(i) * w * 1.5 - s.camX * 0.05) % w + w) % w
        const y = hash(i + 5) * 380
        ctx.fillStyle = `rgba(255,255,255,${0.35 + Math.abs(Math.sin(t / 600 + i)) * 0.6})`
        ctx.beginPath()
        ctx.arc(x, y, hash(i + 2) * 1.8 + 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
      emoji(ctx, "🌙", 860, 90, 64)
      hills(0.25, 450, 45, "#2A2566", 170)
      hills(0.5, 495, 30, "#3A2F7A", 120)
      for (let i = 0; i < 10; i++) {
        const x = ((i * 190 - s.camX * 0.6) % (w + 200) + w + 200) % (w + 200) - 100
        emoji(ctx, "🍄", x, 530, 24)
      }
      break
  }
}

// ------------------------------------------------------------------ world

export function drawScene(ctx: CanvasRenderingContext2D, stage: Stage, built: Built, s: Scene) {
  const th = THEMES[stage.theme]
  drawBackground(ctx, stage, s)

  ctx.save()
  ctx.translate(-s.camX, 0)
  const W = built.spec.width

  // ground
  ctx.fillStyle = th.ground
  ctx.fillRect(-100, GROUND, W + 200, 14)
  ctx.fillStyle = th.soil
  ctx.fillRect(-100, GROUND + 14, W + 200, 60)

  // static pieces
  for (const b of built.statics) {
    if (b.label === "ground" || b.label === "wall" || b.label === "glass") continue
    if (b.position.x + 400 < s.camX || b.position.x - 1400 > s.camX + VIEW.w) continue
    if (b.label === "ramp") {
      shape(ctx, b)
      ctx.fillStyle = th.ramp
      ctx.fill()
      ctx.strokeStyle = "rgba(0,0,0,0.25)"
      ctx.lineWidth = 2
      ctx.stroke()
    } else if (b.label === "rock") {
      shape(ctx, b)
      const g = ctx.createLinearGradient(b.bounds.min.x, b.bounds.min.y, b.bounds.max.x, b.bounds.max.y)
      g.addColorStop(0, "#9AA3AF")
      g.addColorStop(1, "#5B6472")
      ctx.fillStyle = g
      ctx.fill()
      ctx.strokeStyle = "rgba(0,0,0,0.25)"
      ctx.lineWidth = 2
      ctx.stroke()
    } else {
      shape(ctx, b)
      ctx.fillStyle = th.block
      ctx.fill()
      ctx.fillStyle = th.blockTop
      ctx.beginPath()
      ctx.roundRect(b.bounds.min.x, b.bounds.min.y - 2, b.bounds.max.x - b.bounds.min.x, 10, 4)
      ctx.fill()
    }
  }

  // balloons
  for (const bl of built.balloons) {
    if (bl.popped) continue
    const { x, y } = bl.sensor.position
    const bob = Math.sin(s.time / 500) * 3
    ctx.strokeStyle = "rgba(60,60,60,0.6)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(bl.tie.pointA.x, bl.tie.pointA.y)
    ctx.lineTo(bl.hung.position.x, bl.hung.position.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(bl.tie.pointA.x, bl.tie.pointA.y)
    ctx.quadraticCurveTo(bl.tie.pointA.x - 20, bl.tie.pointA.y - 20, x, y - 30 + bob)
    ctx.stroke()
    ctx.save()
    ctx.translate(bl.tie.pointA.x - 6, bl.tie.pointA.y - 60 + bob)
    const g = ctx.createRadialGradient(-10, -12, 4, 0, 0, 34)
    g.addColorStop(0, "#FFB3C7")
    g.addColorStop(1, "#E8386D")
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // the popping target (where the marble must roll through)
    ctx.strokeStyle = "rgba(232,56,109,0.5)"
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    emoji(ctx, "📌", x, y, 20)
  }

  // dominoes
  built.dominoes.forEach((d, i) => {
    if (d.position.x + 100 < s.camX || d.position.x - 100 > s.camX + VIEW.w) return
    shape(ctx, d)
    ctx.fillStyle = DOMINO_COLORS[i % DOMINO_COLORS.length]
    ctx.fill()
    ctx.strokeStyle = "rgba(0,0,0,0.25)"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.save()
    ctx.translate(d.position.x, d.position.y)
    ctx.rotate(d.angle)
    ctx.fillStyle = "rgba(255,255,255,0.85)"
    for (const dy of [-16, 16]) {
      ctx.beginPath()
      ctx.arc(0, dy, 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  })

  // marbles
  for (const m of built.marbles) {
    const r = m.circleRadius ?? 16
    const g = ctx.createRadialGradient(m.position.x - r / 3, m.position.y - r / 3, 2, m.position.x, m.position.y, r)
    g.addColorStop(0, "#BFE3FF")
    g.addColorStop(1, "#2F6FEB")
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(m.position.x, m.position.y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // flower
  const f = built.flower.position
  if (s.won) emoji(ctx, "🌸", f.x, f.y - 8, 70 * (1 + Math.sin(s.time / 180) * 0.06))
  else {
    emoji(ctx, "🌷", f.x, f.y - 4, 52)
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + Math.sin(s.time / 300) * 0.3})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(f.x, f.y - 4, 36, 0, Math.PI * 2)
    ctx.stroke()
  }

  // balls + trails
  for (const ball of built.balls) {
    const trail = s.trails.get(ball) ?? []
    trail.forEach((p, i) => {
      ctx.fillStyle = `rgba(232,56,56,${(i / trail.length) * 0.35})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, BALL_R * (0.4 + (i / trail.length) * 0.6), 0, Math.PI * 2)
      ctx.fill()
    })
    redBall(ctx, ball.position.x, ball.position.y)
  }

  // glass ceiling (see-through, on top of the course)
  for (const b of built.statics) {
    if (b.label !== "glass") continue
    shape(ctx, b)
    ctx.fillStyle = "rgba(210,240,255,0.45)"
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.9)"
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // launcher, aim and hint
  const aimAngle = s.aim ? Math.atan2(s.aim.y - LAUNCHER.y, s.aim.x - LAUNCHER.x) : -Math.PI / 4
  ctx.save()
  ctx.translate(LAUNCHER.x, LAUNCHER.y)
  ctx.rotate(aimAngle)
  ctx.beginPath()
  ctx.roundRect(0, -9, 46, 18, 9)
  ctx.fillStyle = "#4B3F8F"
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = "#6C63FF"
  ctx.beginPath()
  ctx.arc(LAUNCHER.x, LAUNCHER.y + 8, 24, Math.PI, 0)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(LAUNCHER.x - 30, LAUNCHER.y + 8, 60, GROUND - LAUNCHER.y - 8, 6)
  ctx.fill()
  if (s.canThrow) redBall(ctx, LAUNCHER.x, LAUNCHER.y)
  if (s.aim && s.canThrow) {
    previewPath(s.aim).forEach((p, i, all) => {
      ctx.fillStyle = `rgba(255,255,255,${0.95 - (i / all.length) * 0.8})`
      ctx.strokeStyle = "rgba(0,0,0,0.25)"
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4.5 - (i / all.length) * 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
  }
  if (s.hintAim && s.canThrow) {
    const pulse = 1 + Math.sin(s.time / 200) * 0.2
    ctx.strokeStyle = "#FFD166"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(s.hintAim.x, s.hintAim.y, 18 * pulse, 0, Math.PI * 2)
    ctx.stroke()
    emoji(ctx, "👆", s.hintAim.x + 6, s.hintAim.y + 34, 30)
  }

  // effects
  for (const p of s.sparks) {
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  for (const b of s.butterflies) {
    ctx.save()
    ctx.translate(b.x, b.y)
    ctx.scale(0.35 + Math.abs(Math.sin(b.phase)) * 0.65, 1)
    ctx.filter = `hue-rotate(${b.hue}deg)`
    emoji(ctx, "🦋", 0, 0, b.size)
    ctx.restore()
  }
  ctx.filter = "none"
  ctx.restore()

  drawMiniMap(ctx, built, s)
}

function redBall(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const g = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, BALL_R)
  g.addColorStop(0, "#FF9A9A")
  g.addColorStop(1, "#D62828")
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, BALL_R, 0, Math.PI * 2)
  ctx.fill()
}

/** Little course map at the top: where the camera is and how far the flower is. */
function drawMiniMap(ctx: CanvasRenderingContext2D, built: Built, s: Scene) {
  const W = built.spec.width
  const mx = 300
  const mw = 400
  const my = 18
  ctx.fillStyle = "rgba(255,255,255,0.8)"
  ctx.beginPath()
  ctx.roundRect(mx - 14, my - 10, mw + 28, 20, 10)
  ctx.fill()
  ctx.fillStyle = "rgba(43,33,64,0.18)"
  ctx.fillRect(mx, my - 2, mw, 4)
  const k = mw / W
  ctx.strokeStyle = "#6C63FF"
  ctx.lineWidth = 2
  ctx.strokeRect(mx + s.camX * k, my - 7, VIEW.w * k, 14)
  if (s.front !== null) {
    ctx.fillStyle = "#D62828"
    ctx.beginPath()
    ctx.arc(mx + s.front * k, my, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  emoji(ctx, "🌷", mx + built.flower.position.x * k, my, 16)
  emoji(ctx, "🔴", mx + LAUNCHER.x * k, my, 10)
}

// ------------------------------------------------------------------ effects

export function stepEffects(s: Scene) {
  for (const b of s.butterflies) {
    b.phase += 0.35
    b.vx += (Math.random() - 0.5) * 0.3
    b.vy += (Math.random() - 0.55) * 0.25
    b.vx = Math.max(-3, Math.min(3, b.vx))
    b.vy = Math.max(-3, Math.min(1.5, b.vy))
    b.x += b.vx
    b.y += b.vy
  }
  s.butterflies = s.butterflies.filter((b) => b.y > -80)
  for (const p of s.sparks) {
    p.vy += 0.25
    p.x += p.vx
    p.y += p.vy
    p.life -= 0.03
  }
  s.sparks = s.sparks.filter((p) => p.life > 0)
}

export function burstButterflies(s: Scene, at: { x: number; y: number }, count = 26) {
  for (let i = 0; i < count; i++) {
    s.butterflies.push({
      x: at.x + (Math.random() - 0.5) * 40,
      y: at.y - 10,
      vx: (Math.random() - 0.6) * 3.5,
      vy: -1.5 - Math.random() * 2.2,
      phase: Math.random() * Math.PI,
      size: 26 + Math.random() * 20,
      hue: Math.floor(Math.random() * 360),
    })
  }
}

export function burstSparks(s: Scene, at: { x: number; y: number }) {
  const colors = ["#FF6B6B", "#FFD93D", "#FF7AC6", "#FFFFFF"]
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * Math.PI * 2
    const v = 2 + Math.random() * 4
    s.sparks.push({ x: at.x, y: at.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, color: colors[i % colors.length] })
  }
}
