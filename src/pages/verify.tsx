import { useEffect, useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, Loading03Icon, MailValidation01Icon } from "@hugeicons/core-free-icons"

import { AuthShell } from "@/components/auth/auth-shell"
import { Field } from "@/components/auth/field"
import { FormError } from "@/components/auth/form-error"
import { Button } from "@/components/ui/button"
import { hasAccess } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"
import { syncNow } from "@/lib/sync"
import { sendCode, verifyCode, type SentCode } from "@/lib/verify"

const RESEND_AFTER_S = 30

/** Teachers type the 6-digit code from their email to finish signing in. */
export default function VerifyEmailPage() {
  const { email, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [sent, setSent] = useState<SentCode | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // ask the server to email a code as soon as the page opens
  useEffect(() => {
    if (!email || role === "student") return
    sendCode()
      .then(setSent)
      .catch((err: Error) => {
        // "wait 30 seconds" just means a code was sent a moment ago
        if (!/wait/i.test(err.message)) setError(err.message)
        setSent((prev) => prev ?? { sent: true, email, sentAt: Date.now() })
      })
  }, [email, role])

  if (role === "student") return <Navigate to="/join" replace />
  if (hasAccess(email, role) && !loading) return <Navigate to={from ?? "/dashboard"} replace />

  const wait = sent ? Math.max(0, RESEND_AFTER_S - Math.floor((now - sent.sentAt) / 1000)) : 0

  async function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    try {
      await verifyCode(email!, code)
      await syncNow() // the teacher's class and data
      toast.success("Email confirmed — welcome back! 👋")
      navigate(from ?? "/dashboard", { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  async function resend() {
    setCode("")
    setError(null)
    try {
      setSent(await sendCode())
      toast(`A new code was sent to ${email}`)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <AuthShell eyebrow="CHECK YOUR EMAIL" title="Enter your code" subtitle={`We sent a 6-digit code to ${email}. Type it below to open your workspace.`}>
      <form noValidate onSubmit={onSubmit} className="mt-10">
        <Field
          id="code"
          label="Email code"
          icon={MailValidation01Icon}
          inputProps={{
            inputMode: "numeric",
            autoComplete: "one-time-code",
            placeholder: "6 numbers",
            value: code,
            onChange: (e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6)),
          }}
        />

        {/* development without an email service: the server sends the code back so the flow can be used */}
        {sent?.devCode && (
          <p className="mt-4 rounded-[12px] border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Development mode: email sending isn’t set up on the server (SMTP in server/.env), so here is your code:{" "}
            <span className="font-mono text-base font-bold tracking-[0.2em] text-foreground">{sent.devCode}</span>
          </p>
        )}
        {sent && !sent.devCode && sent.sent && (
          <p className="mt-4 text-sm text-muted-foreground">📧 Check your inbox (and spam folder) for an email from LittleReaderLab.</p>
        )}

        {error && <FormError message={error} />}

        <Button type="submit" disabled={loading || code.length !== 6} className="mt-7 h-15 w-full gap-2.5 rounded-[12px] text-lg font-bold disabled:opacity-70">
          {loading ? (
            <HugeiconsIcon icon={Loading03Icon} className="size-5.5 animate-spin" />
          ) : (
            <>
              Confirm and continue
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
            </>
          )}
        </Button>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[15px] text-muted-foreground">
          <button type="button" disabled={wait > 0} onClick={resend} className="font-bold text-link hover:underline disabled:font-medium disabled:text-muted-foreground disabled:no-underline">
            {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
          </button>
          <button
            type="button"
            className="font-bold text-link hover:underline"
            onClick={() => {
              signOut()
              navigate("/login", { replace: true })
            }}
          >
            Use another account
          </button>
        </div>
      </form>
    </AuthShell>
  )
}
