import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpen01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

type LogoProps = {
  onDark?: boolean
  size?: "md" | "lg"
  className?: string
}

/** LittleReaderLab: an open book on a sunny tile. */
export function Logo({ onDark = false, size = "lg", className }: LogoProps) {
  const lg = size === "lg"
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[12px] bg-sun text-[#173A6B] shadow-[0_3px_0_rgb(0_0_0/0.12)]",
          lg ? "size-11" : "size-10"
        )}
      >
        <HugeiconsIcon icon={BookOpen01Icon} className={lg ? "size-[22px]" : "size-5"} />
      </div>
      <span className={cn("truncate font-kids font-bold tracking-tight", lg ? "text-[26px]" : "text-[24px]", onDark ? "text-white" : "text-logo")}>
        Little<span className={onDark ? "text-sun" : "text-link"}>Reader</span>Lab
      </span>
    </div>
  )
}
