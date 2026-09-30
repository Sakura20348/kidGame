import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon, IdCardIcon, Loading03Icon, Mail01Icon } from "@hugeicons/core-free-icons"

import { AuthShell } from "@/components/auth/auth-shell"
import { Field } from "@/components/auth/field"
import { FormError } from "@/components/auth/form-error"
import { PasswordField } from "@/components/auth/password-field"
import { RolePicker } from "@/components/auth/role-picker"
import { Button } from "@/components/ui/button"
import { EMAIL_RE, homeFor, isStudentId, type Role } from "@/lib/accounts"
import { useAuth } from "@/lib/contexts"
import { afterAuthPath } from "@/lib/classes"

type Errors = { email?: string; password?: string }

function validate(email: string, password: string, role: Role): Errors {
  const errors: Errors = {}
  const value = email.trim()
  if (role === "student") {
    // students use their 6-digit ID (older student accounts may still use an email)
    if (!value) errors.email = "Enter your student ID"
    else if (!isStudentId(value) && !EMAIL_RE.test(value)) errors.email = "Your student ID has 6 numbers, e.g. 482913"
  } else if (!value) errors.email = "Enter your email address"
  else if (!EMAIL_RE.test(value)) errors.email = "Enter a valid email address"

  if (!password) errors.password = "Enter your password"
  else if (password.length < 6) errors.password = "Password must be at least 6 characters"
  return errors
}

export default function AuthPage() {
  const { email: signedIn, role: signedInRole, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState<Role>("teacher")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (signedIn && !loading) return <Navigate to={homeFor(signedInRole)} replace />

  async function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setFormError(null)
    const next = validate(email, password, role)
    setErrors(next)
    if (next.email || next.password) return

    setLoading(true)
    try {
      await signIn(email.trim(), password, role)
      const from = (location.state as { from?: string } | null)?.from
      navigate(afterAuthPath(email.trim(), role, from), { replace: true, state: { from } })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Sign in to your workspace"
      subtitle="Continue building meaningful learning experiences."
    >
      <form noValidate onSubmit={onSubmit} className="mt-10">
        <p className="mb-2 text-sm font-bold text-foreground">I am a</p>
        <RolePicker
          value={role}
          onChange={(r) => {
            setRole(r)
            setEmail("")
            setErrors({})
          }}
          compact
        />

        <div className="mt-5.5 space-y-5.5">
          {role === "student" ? (
            <Field
              key="student-id"
              id="email"
              label="Student ID"
              icon={IdCardIcon}
              error={errors.email}
              inputProps={{
                inputMode: "numeric",
                autoComplete: "username",
                placeholder: "6 numbers, e.g. 482913",
                value: email,
                onChange: (e) => setEmail(e.target.value.replace(/\s/g, "")),
              }}
            />
          ) : (
            <Field
              key="email"
              id="email"
              label="Email address"
              icon={Mail01Icon}
              error={errors.email}
              inputProps={{
                type: "email",
                autoComplete: "email",
                placeholder: "you@example.com",
                value: email,
                onChange: (e) => setEmail(e.target.value),
              }}
            />
          )}
          <PasswordField
            id="password"
            label="Password"
            error={errors.password}
            inputProps={{
              autoComplete: "current-password",
              placeholder: "At least 6 characters",
              value: password,
              onChange: (e) => setPassword(e.target.value),
            }}
          />
        </div>

        {formError && <FormError message={formError} />}

        <Button
          type="submit"
          disabled={loading}
          className="mt-7 h-15 w-full gap-2.5 rounded-[12px] text-lg font-bold disabled:opacity-70"
        >
          {loading ? (
            <HugeiconsIcon icon={Loading03Icon} className="size-5.5 animate-spin" />
          ) : (
            <>
              Sign in as {role}
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
            </>
          )}
        </Button>

        <p className="mt-6 text-center text-[15px] text-muted-foreground">
          New to LittleReaderLab?{" "}
          <Link to="/signup" state={location.state} className="font-bold text-link hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
