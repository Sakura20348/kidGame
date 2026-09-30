import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

/** Red message box for errors that aren't tied to one field. */
export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-5 flex animate-in items-start gap-3 rounded-[12px] border border-destructive/30 bg-destructive/8 px-4 py-3 text-[15px] text-destructive fade-in-0 slide-in-from-top-1"
    >
      <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-5 shrink-0" />
      {message}
    </div>
  )
}
