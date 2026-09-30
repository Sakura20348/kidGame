import { useEffect, useState, type RefObject } from "react"

import { cn } from "@/lib/utils"

type Position = "in" | "below" | "above"

/**
 * Scroll-reveal for any element (divs, cards, table rows…): it slides into
 * place whenever it enters the screen, in both scroll directions – from below
 * while scrolling down, from above while scrolling up.
 * "Reduce motion" turns it off (see `.reveal` in index.css).
 *
 *   const ref = useRef<HTMLTableRowElement>(null)
 *   const reveal = useReveal(ref, i * 40)
 *   <tr ref={ref} className={reveal.className} style={reveal.style} />
 */
export function useReveal(ref: RefObject<HTMLElement | null>, delay = 0) {
  const [pos, setPos] = useState<Position>("below")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPos("in")
        else setPos(entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) ? "above" : "below")
      },
      { rootMargin: "-4% 0px -4% 0px", threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref])

  return {
    style: { transitionDelay: pos === "in" ? `${delay}ms` : "0ms" },
    className: cn(
      "reveal transition-[opacity,translate,scale] duration-900 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,translate]",
      pos === "in" && "translate-y-0 scale-100 opacity-100",
      pos === "below" && "translate-y-14 scale-[0.97] opacity-0",
      pos === "above" && "-translate-y-14 scale-[0.97] opacity-0"
    ),
  }
}
