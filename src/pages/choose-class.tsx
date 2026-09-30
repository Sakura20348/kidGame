import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, Loading03Icon } from "@hugeicons/core-free-icons"

import { AuthShell } from "@/components/auth/auth-shell"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { findAccount, grades, needsClass } from "@/lib/accounts"
import { api } from "@/lib/api"
import { afterAuthPath } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"
import { syncNow } from "@/lib/sync"
import { cn } from "@/lib/utils"

const emoji = ["🐣", "🌱", "🌼", "🚀", "⭐"]

/** Students from older accounts (Class 5–11 or adults) choose their class 0–4 once. */
export default function ChooseClassPage() {
  const { email, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [grade, setGrade] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!loading && !needsClass(findAccount(email))) return <Navigate to={email ? afterAuthPath(email, role, from) : "/login"} replace />

  async function save() {
    if (grade === null) return
    setError(null)
    setLoading(true)
    try {
      await api("/api/auth/me", { method: "PATCH", body: { grade } })
      await syncNow()
      toast.success(`Welcome to Class ${grade}! 🎉`)
      navigate(afterAuthPath(email!, role, from), { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="ONE QUICK QUESTION"
      title="Which class are you in?"
      subtitle="LittleReaderLab is now made for Class 0 to Class 4. Choose your class so your games and lessons fit you."
    >
      <div role="radiogroup" aria-label="Your class" className="mt-10 grid grid-cols-5 gap-3">
        {grades.map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={grade === g}
            onClick={() => setGrade(g)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[16px] border-2 py-4 text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
              grade === g ? "border-link bg-link/10" : "border-border bg-field hover:border-link/50"
            )}
          >
            <span aria-hidden className="text-3xl">
              {emoji[g]}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">Class</span>
            <span className="font-serif text-3xl leading-none font-bold">{g}</span>
          </button>
        ))}
      </div>

      {error && <FormError message={error} />}

      <Button disabled={loading || grade === null} onClick={save} className="mt-7 h-15 w-full gap-2.5 rounded-[12px] text-lg font-bold disabled:opacity-70">
        {loading ? (
          <HugeiconsIcon icon={Loading03Icon} className="size-5.5 animate-spin" />
        ) : (
          <>
            {grade === null ? "Choose your class" : `I’m in Class ${grade}`}
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
    </AuthShell>
  )
}
