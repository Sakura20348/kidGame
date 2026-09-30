import { useEffect, useRef, type ComponentProps, type ReactNode } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { ScrollContext } from "@/lib/contexts"

type Props = Omit<ComponentProps<"main">, "children"> & {
  children: ReactNode
  /** Classes for the inner content wrapper */
  contentClassName?: string
}

/**
 * A <main> scroll area with momentum ("inertia") scrolling: the page keeps
 * gliding after the wheel stops and eases to a halt. Honors reduced motion.
 */
export function SmoothScrollArea({ children, contentClassName, ...props }: Props) {
  const wrapperRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return
    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      autoRaf: true,
      lerp: 0.085, // lower = smoother, longer glide
      wheelMultiplier: 1,
      smoothWheel: true,
      allowNestedScroll: true, // dropdowns, tables etc. can still scroll
      respectReducedMotion: true,
    })
    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  function scrollTo(target: HTMLElement, offset = -24) {
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset, duration: 1.1 })
    else target.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <ScrollContext.Provider value={{ scrollTo }}>
      <main ref={wrapperRef} {...props}>
        <div ref={contentRef} className={contentClassName}>
          {children}
        </div>
      </main>
    </ScrollContext.Provider>
  )
}
