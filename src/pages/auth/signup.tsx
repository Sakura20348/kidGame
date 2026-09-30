import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight02Icon,
  Copy01Icon,
  Loading03Icon,
  Mail01Icon,
  School01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { AuthShell } from "@/components/auth/auth-shell"
import { Field } from "@/components/auth/field"
import { FormError } from "@/components/auth/form-error"
import { PasswordField } from "@/components/auth/password-field"
import { RolePicker } from "@/components/auth/role-picker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { bandForGrade, classNames, EMAIL_RE, homeFor, type Role } from "@/lib/accounts"
import { useAuth } from "@/lib/contexts"
import { afterAuthPath } from "@/lib/classes"
import { cn } from "@/lib/utils"

type Form = {
  name: string
  email: string
  password: string
  confirm: string
  ageGroup: string
  school: string
  terms: boolean
}

type Errors = Partial<Record<keyof Form, string>>

function validate(f: Form, role: Role): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = "Enter your full name"
  // students get a student ID instead of using an email
  if (role === "teacher") {
    if (!f.email.trim()) e.email = "Enter your email address"
    else if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address"
  }
  if (f.password.length < 6) e.password = "Password must be at least 6 characters"
  if (f.confirm !== f.password) e.confirm = "Passwords don’t match"
  if (role === "student" && !f.ageGroup) e.ageGroup = "Choose your class"
  if (!f.terms) e.terms = "Please accept the terms to continue"
  return e
}

/** 0–3: too short, weak, okay, strong */
function strength(pw: string) {
  if (pw.length < 6) return 0
  let score = 1
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw)) score++
  return Math.min(score, 3)
}
const strengthLabel = ["Too short", "Weak", "Okay", "Strong"]
const strengthColor = ["bg-muted", "bg-red-500", "bg-amber-500", "bg-emerald-500"]

export default function SignupPage() {
  const { email: signedIn, role: signedInRole, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState<Role>("student")
  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    ageGroup: "",
    school: "",
    terms: false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null) // shown once after a student signs up

  if (signedIn && !loading && !studentId) return <Navigate to={homeFor(signedInRole)} replace />

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))
  const pwStrength = strength(form.password)

  async function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setFormError(null)
    const next = validate(form, role)
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      // students get their 6-digit ID from the server
      const login = await signUp({
        email: role === "student" ? "" : form.email.trim(),
        name: form.name.trim(),
        role,
        // "Class 2" → grade 2 (each class is separate)
        ...(role === "student"
          ? { grade: Number(form.ageGroup.replace("Class ", "")), ageGroup: bandForGrade(Number(form.ageGroup.replace("Class ", ""))) }
          : {}),
        school: role === "teacher" ? form.school.trim() || undefined : undefined,
        password: form.password,
      })
      toast.success(`Welcome to LittleReaderLab, ${form.name.trim().split(" ")[0]}!`)
      if (role === "student") {
        setStudentId(login) // show the ID before going on
        return
      }
      goOn(login)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  function goOn(login: string) {
    const from = (location.state as { from?: string } | null)?.from
    navigate(afterAuthPath(login, role, from), { replace: true, state: { from } })
  }

  if (studentId) {
    return (
      <AuthShell eyebrow="YOU’RE IN" title="Here is your student ID" subtitle="You sign in with this number and your password. Write it down or ask a grown-up to keep it safe.">
        <div className="mt-10 rounded-[20px] border-2 border-dashed border-link/40 bg-link/6 p-6 text-center">
          <p className="text-sm font-bold tracking-[0.14em] text-muted-foreground">STUDENT ID</p>
          <p className="mt-2 font-mono text-5xl font-bold tracking-[0.2em] text-foreground tabular-nums">{studentId}</p>
          <Button
            variant="outline"
            className="mt-5 h-11 gap-2 rounded-[10px]"
            onClick={() => {
              navigator.clipboard?.writeText(studentId).then(
                () => toast.success("Student ID copied"),
                () => toast("Write the number down: " + studentId)
              )
            }}
          >
            <HugeiconsIcon icon={Copy01Icon} className="size-4.5" />
            Copy ID
          </Button>
        </div>
        <p className="mt-5 text-center text-[15px] text-muted-foreground">You can also find it later in Settings → Account.</p>
        <Button className="mt-7 h-15 w-full gap-2.5 rounded-[12px] text-lg font-bold" onClick={() => goOn(studentId)}>
          I’ve saved it — let’s go
          <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="GET STARTED"
      title="Create your account"
      subtitle="Join LittleReaderLab: interactive reading adventures for young English learners."
    >
      <form noValidate onSubmit={onSubmit} className="mt-8">
        <p className="mb-2 text-sm font-bold text-foreground">I am a</p>
        <RolePicker value={role} onChange={setRole} />

        <div className="mt-6 space-y-5">
          <Field
            id="name"
            label="Full name"
            icon={UserIcon}
            error={errors.name}
            inputProps={{
              autoComplete: "name",
              placeholder: role === "student" ? "e.g. Aziza Karimova" : "e.g. Mr. Jasur Tursunov",
              value: form.name,
              onChange: (e) => set("name", e.target.value),
            }}
          />
          {role === "teacher" && (
            <Field
              id="email"
              label="Email address"
              icon={Mail01Icon}
              error={errors.email}
              inputProps={{
                type: "email",
                autoComplete: "email",
                placeholder: "you@example.com",
                value: form.email,
                onChange: (e) => set("email", e.target.value),
              }}
            />
          )}

          {/* Role-specific field */}
          {role === "student" ? (
            <div key="student" className="animate-in fade-in-0 slide-in-from-top-1">
              <p className="mb-5 rounded-[12px] bg-link/8 px-4 py-3 text-sm text-foreground">
                🪪 No email needed — you’ll get a <b>6-digit student ID</b> to sign in with.
              </p>
              <Label className="mb-2 text-sm font-bold text-foreground">Your class</Label>
              <Select value={form.ageGroup || null} onValueChange={(v) => set("ageGroup", (v as string) ?? "")}>
                <SelectTrigger
                  aria-label="Your class"
                  aria-invalid={!!errors.ageGroup}
                  className="h-15! w-full rounded-[12px] border-border bg-field px-4 text-base aria-invalid:border-destructive aria-invalid:ring-0"
                >
                  <SelectValue placeholder="Choose your class (0–4)" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px]">
                  {classNames.map((a) => (
                    <SelectItem key={a} value={a} className="rounded-lg text-[15px]">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ageGroup && <p className="mt-2 ml-3 text-[13px] text-destructive">{errors.ageGroup}</p>}
            </div>
          ) : (
            <div key="teacher" className="animate-in fade-in-0 slide-in-from-top-1">
              <Field
                id="school"
                label="School or organisation (optional)"
                icon={School01Icon}
                inputProps={{
                  autoComplete: "organization",
                  placeholder: "e.g. School No. 12, Tashkent",
                  value: form.school,
                  onChange: (e) => set("school", e.target.value),
                }}
              />
            </div>
          )}

          <div>
            <PasswordField
              id="password"
              label="Password"
              error={errors.password}
              inputProps={{
                autoComplete: "new-password",
                placeholder: "At least 6 characters",
                value: form.password,
                onChange: (e) => set("password", e.target.value),
              }}
            />
            {form.password && (
              <div className="mt-2 flex items-center gap-3 px-1" aria-live="polite">
                <div className="flex flex-1 gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        n <= pwStrength ? strengthColor[pwStrength] : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="w-16 text-right text-xs text-muted-foreground">{strengthLabel[pwStrength]}</span>
              </div>
            )}
          </div>
          <PasswordField
            id="confirm"
            label="Confirm password"
            error={errors.confirm}
            inputProps={{
              autoComplete: "new-password",
              placeholder: "Type it again",
              value: form.confirm,
              onChange: (e) => set("confirm", e.target.value),
            }}
          />

          <div>
            <label className="flex cursor-pointer items-start gap-3 text-[15px] text-muted-foreground">
              <Checkbox
                checked={form.terms}
                onCheckedChange={(v) => set("terms", v)}
                aria-invalid={!!errors.terms}
                className="mt-0.5"
              />
              <span>I agree to the LittleReaderLab terms of use and privacy policy.</span>
            </label>
            {errors.terms && <p className="mt-2 ml-8 text-[13px] text-destructive">{errors.terms}</p>}
          </div>
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
              Create {role} account
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
            </>
          )}
        </Button>

        <p className="mt-6 text-center text-[15px] text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-bold text-link hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
