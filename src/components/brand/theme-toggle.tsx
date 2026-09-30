import { useTheme } from "@/lib/theme"
import { HugeiconsIcon } from "@hugeicons/react"
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * Switches light/dark instantly. The icon shows the mode you'll switch to:
 * light mode = white moon on black, dark mode = yellow sun on sky blue.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const label = isDark ? "Switch to light mode" : "Switch to dark mode"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={label}
            className={cn(
              "rounded-full border shadow-sm transition-colors duration-200",
              isDark
                ? "border-sky-600/30 bg-sky-500 text-yellow-300 hover:bg-sky-600 hover:text-yellow-200 dark:bg-sky-500 dark:hover:bg-sky-600 dark:hover:text-yellow-200" // sun
                : "border-white/20 bg-black text-white hover:bg-neutral-900 hover:text-white dark:bg-black dark:hover:bg-neutral-900", // moon
              className
            )}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        }
      >
        <HugeiconsIcon
          key={String(isDark)}
          icon={isDark ? Sun03Icon : Moon02Icon}
          className="size-[22px] animate-in fade-in-0 spin-in-45 duration-200"
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
