import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import type { KidsGame } from "@/data/kids-games"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/reveal"
import { GameIcon } from "@/components/kids/game-icon"

type ShellProps = {
  game: KidsGame
  /** 0-based index of the current round */
  round: number
  total: number
  score: number
  children: ReactNode
  /** Use the full panel width (e.g. the typing game) */
  wide?: boolean
  /** Hide the progress bar and score (for games with their own counters) */
  hideProgress?: boolean
}

export function GameShell({ game, round, total, score, children, wide, hideProgress }: ShellProps) {
  return (
    <div className={cn("mx-auto", wide ? "max-w-[1400px]" : "max-w-[860px]")}>
      <div className="flex items-center gap-3">
        <Link
          to="/kids"
          aria-label="Back to all games"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_0_rgba(0,0,0,0.08)] outline-none transition-transform hover:-translate-x-0.5 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-6" />
        </Link>
        <span aria-hidden className="text-4xl">
          <GameIcon game={game} imageClassName="h-10 w-12 align-middle" />
        </span>
        <h1 className="flex-1 text-3xl font-semibold">{game.title}</h1>
        {!hideProgress && (
          <span className="rounded-full bg-white px-4 py-2 text-lg font-semibold shadow-[0_4px_0_rgba(0,0,0,0.08)] dark:bg-white/10">
            ✅ {score}
          </span>
        )}
      </div>

      {/* progress */}
      {!hideProgress && (
        <>
          <div
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={Math.min(round, total)}
            className="mt-5 h-4 overflow-hidden rounded-full bg-white shadow-inner dark:bg-white/10"
          >
            <div
              className={cn("h-full rounded-full bg-linear-to-r transition-[width] duration-500", game.tile)}
              style={{ width: `${(Math.min(round, total) / total) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-right text-sm font-medium opacity-70">
            {Math.min(round + 1, total)} / {total}
          </p>
        </>
      )}

      <Reveal className="mt-4">{children}</Reveal>
    </div>
  )
}

export function ResultScreen({
  game,
  stars,
  message,
  onReplay,
}: {
  game: KidsGame
  stars: number
  message: string
  onReplay: () => void
}) {
  const cheer = ["Good try!", "Nice work!", "Great job!", "Superstar!"][stars]

  return (
    <div className="animate-kid-pop relative overflow-hidden rounded-[32px] bg-white p-8 text-center shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-12 dark:bg-white/5">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-4 flex justify-around text-3xl opacity-80">
        <span className="animate-kid-float">🎉</span>
        <span className="animate-kid-float [animation-delay:0.6s]">✨</span>
        <span className="animate-kid-float [animation-delay:1.2s]">🎈</span>
        <span className="animate-kid-float [animation-delay:0.3s]">🎊</span>
      </div>
      <p className="mt-8 text-5xl font-semibold">{cheer}</p>
      <p className="mt-3 text-xl opacity-75" aria-live="polite">
        {message}
      </p>
      <div className="mt-6 flex justify-center gap-3 text-6xl" aria-label={`${stars} of 3 stars`}>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            aria-hidden
            className={cn("animate-kid-pop", n > stars && "opacity-25 grayscale")}
            style={{ animationDelay: `${n * 0.15}s` }}
          >
            ⭐
          </span>
        ))}
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <KidButton className={cn("bg-linear-to-br text-white", game.tile)} onClick={onReplay}>
          Play again
        </KidButton>
        <Link
          to="/kids"
          className="flex h-16 items-center justify-center rounded-[20px] bg-[#F1ECFF] px-8 text-xl font-semibold text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] outline-none transition-transform active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"
        >
          More games
        </Link>
      </div>
    </div>
  )
}

type KidButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  state?: "idle" | "right" | "wrong" | "dim"
}

/** Big, chunky, tappable button with a 3D "press" effect. */
export function KidButton({ className, state = "idle", ...props }: KidButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-16 items-center justify-center rounded-[20px] px-8 text-xl font-semibold shadow-[0_5px_0_rgba(0,0,0,0.15)] outline-none transition-[transform,box-shadow,background-color,opacity] focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 active:translate-y-1 active:shadow-[0_1px_0_rgba(0,0,0,0.15)] disabled:cursor-default",
        state === "right" && "animate-kid-pop bg-[#2BC0A4]! text-white!",
        state === "wrong" && "animate-kid-shake bg-[#FF5E7E]! text-white!",
        state === "dim" && "opacity-40",
        className
      )}
      {...props}
    />
  )
}
