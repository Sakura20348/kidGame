import { cn } from "@/lib/utils"

const COLORS = ["#FF5E5B", "#FF9F1C", "#FFD23F", "#3DC96E", "#2EA8F5", "#7B61FF", "#FF6FB5"]

/** Shade a hex colour: amount < 0 darker, > 0 lighter. */
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
  const r = mix(n >> 16),
    g = mix((n >> 8) & 255),
    b = mix(n & 255)
  return `rgb(${r} ${g} ${b})`
}

/** One 3D letter block: front face, a lighter top and a darker right side. */
function Cube({ x, y, s, color, letter, tilt = 0 }: { x: number; y: number; s: number; color: string; letter: string; tilt?: number }) {
  const d = s * 0.28 // depth of the top / side
  return (
    <g transform={`rotate(${tilt} ${x + s / 2} ${y + s / 2})`}>
      {/* shadow */}
      <rect x={x + d * 0.6} y={y + d * 0.9} width={s} height={s} rx={s * 0.16} fill="rgb(40 30 80 / 0.18)" />
      {/* top and side */}
      <path d={`M${x} ${y} l${d} ${-d} h${s} l${-d} ${d} z`} fill={shade(color, 0.35)} />
      <path d={`M${x + s} ${y} l${d} ${-d} v${s} l${-d} ${d} z`} fill={shade(color, -0.28)} />
      {/* front */}
      <rect x={x} y={y} width={s} height={s} rx={s * 0.14} fill={color} />
      <rect x={x + s * 0.08} y={y + s * 0.08} width={s * 0.84} height={s * 0.3} rx={s * 0.1} fill="white" opacity="0.18" />
      <text
        x={x + s / 2}
        y={y + s * 0.74}
        textAnchor="middle"
        fontFamily="'Fredoka Variable', 'Fredoka', system-ui, sans-serif"
        fontWeight="700"
        fontSize={s * 0.66}
        fill="white"
        stroke={shade(color, -0.45)}
        strokeWidth={s * 0.05}
        paintOrder="stroke"
      >
        {letter}
      </text>
    </g>
  )
}

/** "WORD BUILDER" in colourful 3D letter blocks – the Word Builder icon for Class 4+. */
export function WordBuilderArt({ className }: { className?: string }) {
  const top = "BUILDER".split("")
  const bottom = "WORD".split("")
  return (
    <svg viewBox="0 0 120 100" role="img" aria-label="Word Builder" className={cn("inline-block", className)}>
      <defs>
        <linearGradient id="wb-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF9EE" />
          <stop offset="1" stopColor="#FFE9CF" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="118" height="98" rx="20" fill="url(#wb-bg)" />
      {/* confetti dots */}
      {[
        [12, 14, "#7B61FF"],
        [108, 18, "#3DC96E"],
        [14, 86, "#FF9F1C"],
        [104, 86, "#2EA8F5"],
        [60, 8, "#FF6FB5"],
      ].map(([cx, cy, c]) => (
        <circle key={`${cx}-${cy}`} cx={cx as number} cy={cy as number} r="3" fill={c as string} opacity="0.55" />
      ))}
      {/* BUILDER – small blocks on a gentle arc */}
      {top.map((l, i) => {
        const s = 13
        const x = 12 + i * 13.6
        const y = 24 + Math.pow(i - 3, 2) * 1.1
        return <Cube key={`t${i}`} x={x} y={y} s={s} color={COLORS[i % COLORS.length]} letter={l} tilt={(i - 3) * 4} />
      })}
      {/* WORD – big blocks */}
      {bottom.map((l, i) => {
        const s = 21
        const x = 13 + i * 23.5
        const y = 58 - (i === 1 || i === 2 ? 2 : 0)
        return <Cube key={`b${i}`} x={x} y={y} s={s} color={COLORS[(i * 2 + 1) % COLORS.length]} letter={l} tilt={(i - 1.5) * 3} />
      })}
    </svg>
  )
}
