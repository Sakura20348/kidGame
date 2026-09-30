import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, Loading03Icon, UserGroupIcon } from "@hugeicons/core-free-icons"

import { AuthShell } from "@/components/auth/auth-shell"
import { Field } from "@/components/auth/field"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { cleanCode, hasAccess, joinClass } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"

/** Students join their teacher's class with a code – that's how they get access. */
export default function JoinClassPage() {
  const { email, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (role !== "student") return <Navigate to="/verify" replace />
  if (hasAccess(email, role) && !loading) return <Navigate to={from ?? "/discover"} replace />

  async function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const room = await joinClass(code)
      const teacher = room.teacher.name || room.teacher.email
      toast.success(`You joined ${teacher}’s class! 🎉`)
      navigate(from ?? "/discover", { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="ONE LAST STEP" title="Join your class" subtitle="Ask your teacher for the class code. Students don’t pay — your teacher’s plan covers you.">
      <form noValidate onSubmit={onSubmit} className="mt-10">
        <Field
          id="code"
          label="Class code"
          icon={UserGroupIcon}
          inputProps={{
            autoComplete: "off",
            autoCapitalize: "characters",
            placeholder: "6 letters and numbers, e.g. K7M2QX",
            value: code,
            onChange: (e) => setCode(cleanCode(e.target.value)),
          }}
        />

        {error && <FormError message={error} />}

        <Button type="submit" disabled={loading || code.length !== 6} className="mt-7 h-15 w-full gap-2.5 rounded-[12px] text-lg font-bold disabled:opacity-70">
          {loading ? (
            <HugeiconsIcon icon={Loading03Icon} className="size-5.5 animate-spin" />
          ) : (
            <>
              Join class
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
            </>
          )}
        </Button>

        <p className="mt-6 text-center text-[15px] text-muted-foreground">
          Wrong account?{" "}
          <button
            type="button"
            className="font-bold text-link hover:underline"
            onClick={() => {
              signOut()
              navigate("/login", { replace: true })
            }}
          >
            Sign out
          </button>
        </p>
      </form>
    </AuthShell>
  )
}
