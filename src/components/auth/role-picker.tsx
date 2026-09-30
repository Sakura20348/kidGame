import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, StudentIcon, TeacherIcon } from "@hugeicons/core-free-icons"

import type { Role } from "@/lib/accounts"
import { cn } from "@/lib/utils"

const roles = [
  { id: "student", label: "Student", hint: "I’m here to learn", icon: StudentIcon },
  { id: "teacher", label: "Teacher", hint: "I teach and assign lessons", icon: TeacherIcon },
] as const

/** Two big tappable cards for choosing Student or Teacher. */
export function RolePicker({
  value,
  onChange,
  compact = false,
}: {
  value: Role
  onChange: (role: Role) => void
  /** Smaller, single-line version for the sign-in form */
  compact?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="I am a" className="grid grid-cols-2 gap-3">
      {roles.map((r) => {
        const active = value === r.id
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(r.id)}
            className={cn(
              "relative flex rounded-[14px] border text-left outline-none transition-[border-color,background-color,box-shadow,transform] focus-visible:ring-3 focus-visible:ring-ring/30 active:scale-[0.98]",
              compact ? "h-14 items-center gap-3 px-4" : "flex-col gap-3 p-5",
              active
                ? "border-link bg-link/8 shadow-[0_0_0_1px_var(--link)]"
                : "border-border bg-field hover:border-link/50"
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-[12px] transition-colors",
                compact ? "size-9" : "size-12",
                active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
              )}
            >
              <HugeiconsIcon icon={r.icon} className={compact ? "size-5" : "size-6"} />
            </span>
            <span className="min-w-0">
              <span className={cn("block font-bold text-foreground", compact ? "text-[15px]" : "text-lg")}>
                {r.label}
              </span>
              {!compact && <span className="mt-0.5 block text-sm text-muted-foreground">{r.hint}</span>}
            </span>
            {active && (
              <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
