import { useLayoutEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { StopIcon, VolumeHighIcon } from "@hugeicons/core-free-icons"

import { useSpeech } from "@/hooks/use-speech"
import { cn } from "@/lib/utils"

type Token = { text: string; start: number; word: boolean }

/** Splits text into words and the spaces/punctuation between them. */
function tokenize(text: string): Token[] {
  const out: Token[] = []
  const re = /[A-Za-z’'-]+|[^A-Za-z’'-]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) out.push({ text: m[0], start: m.index, word: /[A-Za-z]/.test(m[0]) })
  return out
}

/**
 * Text a child can read along with: tap any word to hear it, or press
 * "Read to me" to hear it all with the spoken word highlighted.
 */
export function ReadAloud({ text, className, size = "lg" }: { text: string; className?: string; size?: "md" | "lg" | "xl" }) {
  const { supported, speak, stop, speaking, charIndex } = useSpeech()
  const [mode, setMode] = useState<"all" | "word">("all")
  const [tapped, setTapped] = useState<number | null>(null)
  const tokens = tokenize(text)
  const textRef = useRef<HTMLParagraphElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)

  // which word is being read right now (karaoke highlight)
  const current =
    speaking && mode === "all" && charIndex >= 0
      ? tokens.findLastIndex((t) => t.word && t.start <= charIndex)
      : speaking && mode === "word"
        ? tapped
        : null

  // One highlight "pill" that glides from word to word (instead of jumping).
  useLayoutEffect(() => {
    const pill = pillRef.current
    const el = current === null ? null : textRef.current?.querySelector<HTMLElement>(`[data-token="${current}"]`)
    if (!pill) return
    if (!el) {
      pill.style.opacity = "0"
      return
    }
    const sameLine = pill.dataset.top === String(el.offsetTop) && pill.style.opacity === "1"
    pill.style.transition = sameLine
      ? "transform 220ms cubic-bezier(0.22,1,0.36,1), width 220ms cubic-bezier(0.22,1,0.36,1), opacity 150ms"
      : "opacity 150ms" // new line: jump there, don't slide diagonally
    pill.style.transform = `translate(${el.offsetLeft - 4}px, ${el.offsetTop + 2}px)`
    pill.style.width = `${el.offsetWidth + 8}px`
    pill.style.height = `${el.offsetHeight - 4}px`
    pill.style.opacity = "1"
    pill.dataset.top = String(el.offsetTop)
  }, [current, text])

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={cn(
          "relative whitespace-pre-line",
          size === "xl" ? "text-3xl leading-[1.9] sm:text-4xl" : size === "md" ? "text-lg leading-[1.85] sm:text-xl" : "text-2xl leading-[1.9] sm:text-[28px]"
        )}
      >
        <span
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 rounded-[10px] bg-[#FFD166] opacity-0 shadow-[0_3px_0_#E0A800]"
        />
        {tokens.map((t, i) =>
          t.word ? (
            <button
              key={i}
              data-token={i}
              type="button"
              onClick={() => {
                setMode("word")
                setTapped(i)
                speak(t.text, 0.7)
              }}
              title={supported ? `Hear “${t.text}”` : undefined}
              className={cn(
                "relative rounded-lg px-0.5 outline-none transition-colors duration-200 hover:bg-[#FFD166]/40 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40",
                current === i && "text-[#2B2140] hover:bg-transparent",
                // karaoke: words already read turn purple
                mode === "all" && current !== null && i < current && "text-[#6C63FF] dark:text-[#B9B3FF]"
              )}
            >
              {t.text}
            </button>
          ) : (
            <span key={i}>{t.text}</span>
          )
        )}
      </p>

      {supported && (
        <button
          type="button"
          onClick={() => {
            if (speaking && mode === "all") return stop()
            setMode("all")
            speak(text)
          }}
          className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-[#6C63FF] px-5 text-lg font-semibold text-white shadow-[0_4px_0_#4B42D6] outline-none transition-transform active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
        >
          <HugeiconsIcon icon={speaking && mode === "all" ? StopIcon : VolumeHighIcon} className="size-5" />
          {speaking && mode === "all" ? "Stop" : "Read to me"}
        </button>
      )}
    </div>
  )
}
