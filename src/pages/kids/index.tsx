import { useState } from "react"
import { Link } from "react-router-dom"

import { kidsGames } from "@/data/kids-games"
import { useAuth, useKids } from "@/lib/contexts"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/reveal"
import { GameIcon } from "@/components/kids/game-icon"

export default function KidsHubPage() {
  const { name } = useAuth()
  const { best } = useKids()
  const first = name.split(" ")[0]

  // A different "game of the day" each day
  const [day] = useState(() => Math.floor(Date.now() / 86_400_000))
  const today = kidsGames[day % kidsGames.length]

  return (
    <div>
      {/* Greeting */}
      <Reveal as="section" className="flex flex-col items-start gap-6 rounded-[32px] bg-white/80 p-6 shadow-[0_8px_0_rgba(43,33,64,0.06)] backdrop-blur sm:flex-row sm:items-center sm:p-8 dark:bg-white/5">
        <span aria-hidden className="animate-kid-float text-7xl sm:text-8xl">
          🦉
        </span>
        <div className="flex-1">
          <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">
            Hi{first ? `, ${first}` : ""}! Ready to play?
          </h1>
          <p className="mt-2 text-lg opacity-75 sm:text-xl">
            Pick a game, earn stars and beat your best score.
          </p>
        </div>
        <Link
          to={today.path}
          className={cn(
            "group flex items-center gap-3 rounded-[24px] bg-linear-to-br px-5 py-4 text-white shadow-[0_6px_0_rgba(0,0,0,0.18)] outline-none transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,0,0,0.18)]",
            today.tile
          )}
        >
          <span aria-hidden className="text-4xl transition-transform group-hover:scale-110">
            <GameIcon game={today} imageClassName="size-11" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-medium opacity-90">Game of the day</span>
            <span className="block text-xl font-semibold">{today.title}</span>
          </span>
        </Link>
      </Reveal>

      {/* Games */}
      <Reveal as="h2" className="mt-10 mb-4 text-2xl font-semibold">
        Let’s play
      </Reveal>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
        {kidsGames.map((g, i) => (
          <Reveal key={g.id} delay={i * 90} className="flex *:flex-1">
            <Link
              to={g.path}
              className={cn(
                "group relative flex min-h-[260px] flex-col overflow-hidden rounded-[32px] bg-linear-to-br p-6 text-white shadow-[0_8px_0_rgba(0,0,0,0.18)] outline-none transition-transform hover:-translate-y-1.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/50 active:translate-y-1 active:shadow-[0_3px_0_rgba(0,0,0,0.18)]",
                g.tile
              )}
            >
              {/* decorative bubbles */}
              <span aria-hidden className="absolute -top-10 -right-10 size-36 rounded-full bg-white/15" />
              <span aria-hidden className="absolute -bottom-12 -left-8 size-28 rounded-full bg-white/10" />

              <span className="relative w-fit rounded-full bg-white/25 px-3 py-1 text-sm font-semibold">{g.skill}</span>
              <span
                aria-hidden
                className={cn(
                  "relative my-4 self-center text-[88px] leading-none drop-shadow-[0_6px_0_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-110",
                  i % 2 ? "group-hover:rotate-6" : "group-hover:-rotate-6"
                )}
              >
                <GameIcon game={g} imageClassName="h-[96px] w-[118px] shadow-[0_6px_0_rgba(0,0,0,0.15)]" />
              </span>
              <span className="relative mt-auto text-2xl font-semibold">{g.title}</span>
              <span className="relative mt-3 flex gap-1 text-xl" aria-label={`Best: ${best[g.id] ?? 0} of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} aria-hidden className={n <= (best[g.id] ?? 0) ? "" : "opacity-35 grayscale"}>
                    ⭐
                  </span>
                ))}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
