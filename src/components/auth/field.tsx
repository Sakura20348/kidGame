import type { ComponentProps, ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type FieldProps = {
  id: string
  label: string
  icon: IconSvgElement
  error?: string
  suffix?: ReactNode
  inputProps: ComponentProps<"input">
}

export function Field({ id, label, icon, error, suffix, inputProps }: FieldProps) {
  return (
    <div>
      <Label htmlFor={id} className="mb-2 text-sm font-bold text-foreground">
        {label}
      </Label>
      <div className="relative">
        <HugeiconsIcon
          icon={icon}
          className={cn(
            "pointer-events-none absolute top-1/2 left-4 size-[22px] -translate-y-1/2",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        />
        <Input
          id={id}
          aria-invalid={!!error}
          className={cn(
            "h-15 rounded-[12px] border border-border bg-field pl-12 text-base text-foreground placeholder:text-hint",
            "focus-visible:border-link focus-visible:ring-0 focus-visible:[box-shadow:inset_0_0_0_0.5px_var(--link)]",
            "aria-invalid:border-destructive aria-invalid:ring-0",
            suffix && "pr-14"
          )}
          {...inputProps}
        />
        {suffix && (
          <div className="absolute top-1/2 right-1.5 -translate-y-1/2">{suffix}</div>
        )}
      </div>
      {error && <p className="mt-2 ml-3 text-[13px] text-destructive">{error}</p>}
    </div>
  )
}
