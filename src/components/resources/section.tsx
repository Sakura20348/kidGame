import { Children, type ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[13px] font-extrabold tracking-[0.14em] text-muted-foreground", className)}>
      {children}
    </p>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow: string
  title: string
  trailing?: string
}) {
  return (
    <Reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-2.5 flex items-end gap-4">
        <h2 className="flex-1 font-serif text-[36px] leading-[1.15] text-foreground [font-variant-numeric:oldstyle-nums]">
          {title}
        </h2>
        {trailing && <span className="text-sm text-muted-foreground">{trailing}</span>}
      </div>
    </Reveal>
  )
}

/** Cards grid: 1 column on phones, 2 on tablets, 3 on wide content areas. */
export function ResourceGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 @min-[700px]:grid-cols-2 @min-[1300px]:grid-cols-3">
      {Children.map(children, (child, i) => (
        // cards in the same row arrive one after another
        <Reveal delay={(i % 3) * 90} className="flex *:flex-1">
          {child}
        </Reveal>
      ))}
    </div>
  )
}

export function Pagination({
  page,
  count,
  onChange,
}: {
  page: number
  count: number
  onChange: (page: number) => void
}) {
  const btn = "h-auto rounded-[12px] px-[18px] py-4 text-sm font-semibold dark:bg-transparent"
  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <Button variant="outline" className={btn} disabled={page <= 0} onClick={() => onChange(page - 1)}>
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
        Previous
      </Button>
      <span className="text-[15px] font-semibold text-foreground">
        {page + 1} / {count}
      </span>
      <Button
        variant="outline"
        className={btn}
        disabled={page >= count - 1}
        onClick={() => onChange(page + 1)}
      >
        Next
        <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
      </Button>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  icon: IconSvgElement
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  /** an optional second, quieter button next to the main one */
  secondaryLabel?: string
  onSecondary?: () => void
}) {
  return (
    <Reveal className="flex flex-col items-center rounded-[22px] border border-border bg-card px-6 py-12 text-center">
      <HugeiconsIcon icon={icon} className="size-10 text-link" />
      <h3 className="mt-3.5 font-serif text-[26px] text-foreground">{title}</h3>
      <p className="mt-2 max-w-[420px] text-[15px] leading-[1.6] text-muted-foreground">{message}</p>
      {((actionLabel && onAction) || (secondaryLabel && onSecondary)) && (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {actionLabel && onAction && (
            <Button className="h-auto rounded-[12px] px-[22px] py-4 font-semibold" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondary && (
            <Button variant="outline" className="h-auto rounded-[12px] px-[22px] py-4 font-semibold dark:bg-transparent" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </Reveal>
  )
}
