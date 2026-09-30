import { useEffect, useState } from "react"

import { moodEmoji, type Mood, type Opponent } from "@/data/chess-opponents"
import { cn } from "@/lib/utils"

/** Big animal face in a gradient circle, with a little mood badge. */
export function OpponentAvatar({
  opponent,
  mood,
  size = "lg",
  talkKey,
}: {
  opponent: Opponent
  mood?: Mood
  size?: "sm" | "lg"
  /** changes whenever they say something – makes the face bounce */
  talkKey?: number
}) {
  return (
    <span className="relative shrink-0">
      <span
        key={talkKey}
        className={cn(
          "flex items-center justify-center rounded-full bg-linear-to-br shadow-[0_5px_0_rgba(0,0,0,0.15)]",
          opponent.tile,
          size === "lg" ? "size-24 text-6xl" : "size-12 text-3xl",
          talkKey !== undefined && "animate-kid-pop"
        )}
        aria-hidden
      >
        {opponent.face}
      </span>
      {mood && (
        <span
          aria-hidden
          className={cn(
            "absolute -right-1 -bottom-1 flex items-center justify-center rounded-full bg-white shadow-md dark:bg-[#2B2140]",
            size === "lg" ? "size-9 text-xl" : "size-6 text-sm"
          )}
        >
          {moodEmoji[mood]}
        </span>
      )}
    </span>
  )
}

/** Speech bubble that types its text out, like the opponent is talking. */
export function SpeechBubble({ text, id }: { text: string; id: number }) {
  return <Typewriter key={id} text={text} />
}

function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const id = setInterval(
      () =>
        setShown((n) => {
          if (reduce || n >= text.length) {
            clearInterval(id)
            return text.length
          }
          return n + 1
        }),
      22
    )
    return () => clearInterval(id)
  }, [text])

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative animate-bubble-in rounded-[22px] rounded-tl-md bg-white px-5 py-4 text-lg leading-snug shadow-[0_6px_0_rgba(43,33,64,0.08)] dark:bg-white/10"
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.slice(0, shown)}
        {shown < text.length && <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 animate-pulse bg-current" />}
      </span>
    </div>
  )
}
