import { useRef, type ElementType, type HTMLAttributes, type ReactNode } from "react"

import { useReveal } from "@/hooks/use-reveal"
import { cn } from "@/lib/utils"

type RevealProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  /** Delay before this item animates in, in ms – use it to stagger lists. */
  delay?: number
  /** Element or component to render, default "div" (e.g. "section", TableRow) */
  as?: ElementType
}

/**
 * Slides its content into place whenever it scrolls into view, in both
 * directions. Wrapper version of `useReveal`.
 */
export function Reveal({ children, delay = 0, className, style, as: Tag = "div", ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const reveal = useReveal(ref, delay)
  return (
    <Tag {...rest} ref={ref} style={{ ...style, ...reveal.style }} className={cn(reveal.className, className)}>
      {children}
    </Tag>
  )
}
