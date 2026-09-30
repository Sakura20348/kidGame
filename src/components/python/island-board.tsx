import type { Pos, World } from "@/lib/python-quest"
import { cn } from "@/lib/utils"

type Props = {
  world: World
  monty: Pos
  facingLeft: boolean
  collected: Set<string>
  bubble: string | null
  bumped: boolean
  won: boolean
  /** ms for one step – keeps the glide in time with the animation speed */
  stepMs: number
}

/** The island: tiles + Monty gliding between them. */
export function IslandBoard({ world, monty, facingLeft, collected, bubble, bumped, won, stepMs }: Props) {
  const { width, height } = world
  const pct = (n: number, of: number) => `${(n / of) * 100}%`

  return (
    <div className="rounded-[28px] bg-[#3FA7D6] p-3 shadow-[0_10px_0_rgba(0,0,0,0.15)] sm:p-4 dark:bg-[#1D4E6B]">
      <div
        className="@container relative mx-auto w-full overflow-visible"
        style={{ aspectRatio: `${width} / ${height}`, maxWidth: `${width * 88}px` }}
      >
        <div
          className="grid size-full overflow-hidden rounded-[18px]"
          style={{ gridTemplateColumns: `repeat(${width}, 1fr)`, gridTemplateRows: `repeat(${height}, 1fr)` }}
        >
          {Array.from({ length: height }, (_, y) =>
            Array.from({ length: width }, (_, x) => {
              const c = world.cell({ x, y })
              const light = (x + y) % 2 === 0
              const gemHere = c === "*" && !collected.has(`${x},${y}`)
              return (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    "relative flex items-center justify-center",
                    c === "~"
                      ? "bg-[#6FC8F0] dark:bg-[#2A6F95]"
                      : light
                        ? "bg-[#A8E28F] dark:bg-[#3E7A4A]"
                        : "bg-[#95D67A] dark:bg-[#356B40]"
                  )}
                >
                  <span className="text-[min(9cqw,52px)] leading-none select-none" aria-hidden>
                    {c === "#" ? "🌳" : c === "~" ? "🌊" : c === "G" ? (won ? "✨" : "🍎") : gemHere ? "💎" : ""}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Monty */}
        <div
          className="pointer-events-none absolute top-0 left-0 flex items-center justify-center"
          style={{
            width: pct(1, width),
            height: pct(1, height),
            transform: `translate(${monty.x * 100}%, ${monty.y * 100}%)`,
            transition: `transform ${stepMs}ms cubic-bezier(0.45, 0, 0.25, 1)`,
          }}
        >
          <span
            className={cn(
              "block text-[min(10cqw,58px)] leading-none drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-transform duration-200",
              facingLeft ? "-scale-x-100" : "",
              bumped && "animate-kid-shake",
              won && "animate-kid-pop"
            )}
            aria-label="Monty the python"
          >
            🐍
          </span>
          {bubble && (
            <span
              key={bubble}
              className="absolute bottom-[92%] left-1/2 z-10 max-w-[240px] -translate-x-1/2 animate-bubble-in rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 font-kids text-base font-semibold whitespace-pre-wrap text-[#2B2140] shadow-lg"
            >
              {bubble}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
