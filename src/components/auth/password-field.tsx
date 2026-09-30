import { useState, type ComponentProps } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { LockPasswordIcon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons"

import { Field } from "@/components/auth/field"
import { Button } from "@/components/ui/button"

/** Password input with a show/hide toggle. */
export function PasswordField({
  id,
  label,
  error,
  inputProps,
}: {
  id: string
  label: string
  error?: string
  inputProps: ComponentProps<"input">
}) {
  const [hidden, setHidden] = useState(true)
  return (
    <Field
      id={id}
      label={label}
      icon={LockPasswordIcon}
      error={error}
      inputProps={{ ...inputProps, type: hidden ? "password" : "text" }}
      suffix={
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={hidden ? "Show password" : "Hide password"}
          className="text-muted-foreground"
          onClick={() => setHidden((v) => !v)}
        >
          <HugeiconsIcon icon={hidden ? ViewIcon : ViewOffSlashIcon} className="size-[22px]" />
        </Button>
      }
    />
  )
}
