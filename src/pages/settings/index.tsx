import { useState, type ReactNode } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { studentDefaults, teacherDefaults } from "@/lib/notify"
import { useTheme, type ThemeChoice } from "@/lib/theme"
import { toast } from "sonner"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ComputerIcon,
  CustomerSupportIcon,
  Delete02Icon,
  Download04Icon,
  LockIcon,
  Logout01Icon,
  Moon02Icon,
  Notification01Icon,
  Sun03Icon,
  UserIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"

import { AvatarEditor } from "@/components/brand/avatar-editor"
import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { findAccount, isStudentId } from "@/lib/accounts"
import { classOf, studentClass } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { formatDate } from "@/lib/format"
import { downloadPaper, fileKind, markDownloaded, papersForStudent, readDownloaded, type TestPaper } from "@/lib/papers"
import { prettySize } from "@/lib/submissions"
import { cn } from "@/lib/utils"

type SectionId = "account" | "notifications" | "appearance" | "privacy" | "help"

const sections: { id: SectionId; label: string; icon: IconSvgElement; keywords: string }[] = [
  { id: "account", label: "Account", icon: UserIcon, keywords: "profile name email role class code student id sign out logout" },
  { id: "notifications", label: "Notifications", icon: Notification01Icon, keywords: "reminders alerts assignments email report stars sounds" },
  { id: "appearance", label: "Appearance", icon: ViewIcon, keywords: "theme dark light mode system colours colors" },
  { id: "privacy", label: "Privacy & Security", icon: LockIcon, keywords: "password data download delete clear online privacy security" },
  { id: "help", label: "Help and Support", icon: CustomerSupportIcon, keywords: "faq questions help support problem contact version shortcuts" },
]

export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (sections.find((s) => s.id === params.get("tab"))?.id ?? null) as SectionId | null
  const active: SectionId = tab ?? "account"

  const open = (id: SectionId) => setParams({ tab: id }, { replace: true })

  return (
    <div>
      <Reveal className="mb-6">
        <h1 className="font-serif text-[36px] leading-[1.15] text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account, notifications and how LittleReaderLab looks.</p>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        {/* ---------------- menu (as in the design) */}
        <nav
          aria-label="Settings sections"
          className={cn(
            "rounded-[22px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:sticky lg:top-4",
            tab && "hidden lg:block" // on phones the open section replaces the menu
          )}
        >
          <ul className="space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => open(s.id)}
                  aria-current={active === s.id ? "page" : undefined}
                  className={cn(
                    "flex h-14 w-full items-center gap-4 rounded-[12px] px-3 text-left text-[16px] font-medium outline-none transition-[background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring/40",
                    active === s.id
                      ? // selected: brand green, like the sidebar glass
                        "bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8] text-white shadow-[0_4px_12px_-4px_rgba(47,123,221,0.6)]"
                      : "text-foreground hover:bg-[#3B8BE8]/12"
                  )}
                >
                  <HugeiconsIcon icon={s.icon} className="size-[22px]" />
                  <span className="flex-1">{s.label}</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ---------------- the open section */}
        <div className={cn(!tab && "hidden lg:block")}>
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className="mb-4 flex h-10 items-center gap-1.5 rounded-full px-2 text-[15px] font-semibold text-muted-foreground outline-none hover:text-foreground lg:hidden"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" /> All settings
          </button>
          <Reveal key={active} className="rounded-[22px] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
            {active === "account" && <AccountSection />}
            {active === "notifications" && <NotificationsSection />}
            {active === "appearance" && <AppearanceSection />}
            {active === "privacy" && <PrivacySection />}
            {active === "help" && <HelpSection />}
          </Reveal>
        </div>
      </div>
    </div>
  )
}

// =================================================================== shared

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-muted-foreground">{text}</p>
    </div>
  )
}

function Row({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Small per-account preference store (on this device). */
function usePref<T>(name: string, fallback: T) {
  const { email } = useAuth()
  const storageKey = kidsKey(email, `settings.${name}`)
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  })
  const update = (v: T) => {
    setValue(v)
    try {
      localStorage.setItem(storageKey, JSON.stringify(v))
    } catch {
      // ignore
    }
  }
  return [value, update] as const
}

// =================================================================== sections

function AccountSection() {
  const { name, email, role, signOut } = useAuth()
  const navigate = useNavigate()
  const room = role === "student" ? studentClass(email) : undefined

  return (
    <>
      <Heading title="Account" text="Your profile and class." />
      <div className="mb-6 flex items-center gap-4 rounded-[18px] bg-muted/50 p-4">
        <AvatarEditor className="size-16 text-xl" />
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold text-foreground">{name || email}</p>
          <p className="truncate text-muted-foreground">{isStudentId(email) ? `Student ID ${email}` : email}</p>
        </div>
      </div>
      <Row title="Role" text="Chosen when you signed in.">
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold capitalize">{role ?? "teacher"}</span>
      </Row>
      {role === "student" ? (
        <Row title="Class" text={room ? `You’re in ${findAccount(room.teacher)?.name || room.teacher}’s class.` : "Join your teacher’s class to get access."}>
          {room ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-sm font-semibold tracking-widest text-primary dark:text-link">{room.code}</span>
          ) : (
            <Button className="rounded-[10px]" render={<Link to="/join" />} nativeButton={false}>
              Join a class
            </Button>
          )}
        </Row>
      ) : (
      <Row title="Class code" text="Students type this code to join your class.">
        <Link to="/dashboard/team" className="rounded-full bg-primary/10 px-3 py-1 font-mono text-sm font-semibold tracking-widest text-primary hover:underline dark:text-link">
          {email ? classOf(email).code : "–"}
        </Link>
      </Row>
      )}
      <NameForm />
      <EmailForm />
      <PasswordForm />
      <Row title="Sign out" text="You can sign back in any time.">
        <Button
          variant="outline"
          className="gap-2 rounded-[10px] dark:bg-transparent"
          onClick={() => {
            signOut()
            navigate("/login", { replace: true })
          }}
        >
          <HugeiconsIcon icon={Logout01Icon} className="size-4" /> Sign out
        </Button>
      </Row>
    </>
  )
}

// ------------------------------------------------------------ account forms

const field =
  "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-link focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--link)_18%,transparent)] aria-invalid:border-destructive"

function FormBlock({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="border-t border-border py-5">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mb-3 text-sm text-muted-foreground">{text}</p>
      {children}
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="mt-2 text-sm text-destructive">
      {message}
    </p>
  ) : null
}

function NameForm() {
  const { name, updateName } = useAuth()
  const [value, setValue] = useState(name)
  const [error, setError] = useState("")
  const changed = value.trim() !== name
  return (
    <FormBlock title="Name" text="Shown on your avatar, ID card and in the Team list.">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await updateName(value)
            setError("")
            toast.success("Name saved")
          } catch (err) {
            setError((err as Error).message)
          }
        }}
      >
        <input value={value} onChange={(e) => setValue(e.target.value)} aria-label="Name" aria-invalid={!!error} autoComplete="name" className={field} />
        <Button type="submit" disabled={!changed} className="h-11 rounded-[10px] px-5">
          Save
        </Button>
      </form>
      <FieldError message={error} />
    </FormBlock>
  )
}

/** Students sign in with a student ID, which can't be changed. */
function StudentIdBlock({ id }: { id: string }) {
  return (
    <FormBlock title="Student ID" text="You sign in with this number and your password. Keep it safe — it can’t be changed.">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="flex h-11 items-center rounded-[10px] bg-muted px-4 font-mono text-xl font-bold tracking-[0.2em] text-foreground tabular-nums">{id}</p>
        <Button
          variant="outline"
          className="h-11 rounded-[10px] px-5"
          onClick={() => navigator.clipboard?.writeText(id).then(() => toast.success("Student ID copied"), () => toast(id))}
        >
          Copy
        </Button>
      </div>
    </FormBlock>
  )
}

function EmailForm() {
  const { email, changeEmail } = useAuth()
  if (isStudentId(email)) return <StudentIdBlock id={email!} />
  return <EmailFormFields email={email} changeEmail={changeEmail} />
}

function EmailFormFields({ email, changeEmail }: { email: string | null; changeEmail: (next: string) => Promise<void> }) {
  const [value, setValue] = useState(email ?? "")
  const [error, setError] = useState("")
  const changed = value.trim().toLowerCase() !== (email ?? "").toLowerCase()
  return (
    <FormBlock title="Email" text="You sign in with this email. Your stars, photo and plan move to the new email.">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await changeEmail(value)
            setError("")
            toast.success("Email changed — use it next time you sign in")
          } catch (err) {
            setError((err as Error).message)
          }
        }}
      >
        <input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Email"
          aria-invalid={!!error}
          autoComplete="email"
          className={field}
        />
        <Button type="submit" disabled={!changed} className="h-11 rounded-[10px] px-5">
          Save
        </Button>
      </form>
      <FieldError message={error} />
    </FormBlock>
  )
}

function PasswordForm() {
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const strength = next.length < 6 ? 0 : 1 + (next.length >= 10 ? 1 : 0) + (/[A-Z]/.test(next) && /\d/.test(next) ? 1 : 0)

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (next !== confirm) return setError("The new passwords don’t match.")
    setSaving(true)
    try {
      await changePassword(current, next)
      setError("")
      setCurrent("")
      setNext("")
      setConfirm("")
      toast.success("Password changed 🔒")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const type = show ? "text" : "password"
  return (
    <FormBlock title="Password" text="Use at least 6 characters. Longer with a capital letter and a number is stronger.">
      <form className="grid gap-2 sm:max-w-[420px]" onSubmit={submit}>
        <input type={type} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" aria-label="Current password" autoComplete="current-password" className={field} />
        <input type={type} value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password" aria-label="New password" autoComplete="new-password" className={field} />
        {next && (
          <div className="flex items-center gap-3 px-1" aria-live="polite">
            <div className="flex flex-1 gap-1.5">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={cn("h-1.5 flex-1 rounded-full", n <= strength ? ["", "bg-red-500", "bg-amber-500", "bg-emerald-500"][strength] : "bg-muted")}
                />
              ))}
            </div>
            <span className="w-16 text-right text-xs text-muted-foreground">{["Too short", "Weak", "Okay", "Strong"][strength]}</span>
          </div>
        )}
        <input type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" aria-label="Confirm new password" autoComplete="new-password" aria-invalid={!!confirm && confirm !== next} className={field} />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4 accent-[#2F7BDD]" />
          Show passwords
        </label>
        <Button type="submit" disabled={saving || !next || !confirm} className="mt-1 h-11 w-fit rounded-[10px] px-5">
          {saving ? "Saving…" : "Change password"}
        </Button>
      </form>
      <FieldError message={error} />
    </FormBlock>
  )
}

function NotificationsSection() {
  const { role } = useAuth()
  const teacher = role === "teacher"
  const [prefs, setPrefs] = usePref<Record<string, boolean>>(teacher ? "teacherNotifications" : "notifications", teacher ? teacherDefaults : studentDefaults)
  const items: { id: string; title: string; text: string }[] = teacher
    ? [
        { id: "work", title: "New student work", text: "A pop-up when a student sends you work." },
        { id: "joins", title: "Students joining", text: "When a new student joins your class with the code." },
        { id: "report", title: "Weekly class report", text: "Once a week: who was active, lessons finished and work sent." },
      ]
    : [
        { id: "reminders", title: "Lesson reminders", text: "Once a day, when lessons are waiting and you haven’t learned yet today." },
        { id: "assignments", title: "New lessons and messages", text: "When your teacher sends a lesson, a message or a test paper." },
        { id: "report", title: "Weekly progress report", text: "Once a week: your activities, lessons, test scores and stars." },
        { id: "kids", title: "Game achievements", text: "A cheer when you earn new stars in a game." },
      ]
  return (
    <>
      <Heading title="Notifications" text="Choose what you want to hear about." />
      {items.map((it) => (
        <Row key={it.id} title={it.title} text={it.text}>
          <Switch
            checked={!!prefs[it.id]}
            onCheckedChange={(v) => {
              setPrefs({ ...prefs, [it.id]: v })
              toast(`${it.title} ${v ? "on" : "off"}`)
            }}
            aria-label={it.title}
          />
        </Row>
      ))}
      <p className="mt-2 text-sm text-muted-foreground">Saved with your account – the same on all your devices.</p>
    </>
  )
}

const themes: { value: ThemeChoice; label: string; icon: IconSvgElement }[] = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "system", label: "System", icon: ComputerIcon },
]

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <Heading title="Appearance" text="Choose how LittleReaderLab looks for your account." />
      <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
        {themes.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={theme === t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-[16px] border-2 p-5 text-[15px] font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
              theme === t.value ? "border-primary bg-primary/6 text-foreground dark:border-link" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={t.icon} className="size-7" />
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">“System” follows your computer or phone’s setting.</p>
    </>
  )
}

function PrivacySection() {
  const { email, signOut, role } = useAuth()
  const student = role === "student"
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  const myKeys = () => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith("pragmalab.")) keys.push(k)
    }
    return keys
  }

  function download() {
    const data = Object.fromEntries(myKeys().map((k) => [k, localStorage.getItem(k)]))
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "pragmalab-data.json"
    a.click()
    URL.revokeObjectURL(url)
    toast("Your data was downloaded")
  }

  function clearDevice() {
    myKeys().forEach((k) => localStorage.removeItem(k))
    signOut()
    toast("All LittleReaderLab data was removed from this device")
    navigate("/login", { replace: true })
  }

  return (
    <>
      <Heading title="Privacy & Security" text="Control your data on this device." />
      {student ? (
        <StudentDownloads />
      ) : (
        <Row title="Download my data" text={`Everything LittleReaderLab saved on this device for ${email}.`}>
          <Button variant="outline" className="gap-2 rounded-[10px] dark:bg-transparent" onClick={download}>
            <HugeiconsIcon icon={Download04Icon} className="size-4" /> Download
          </Button>
        </Row>
      )}
      <Row title="Clear data on this device" text="Removes saved progress, stars, projects and settings, and signs you out.">
        {confirming ? (
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-[10px] dark:bg-transparent" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="gap-2 rounded-[10px]" onClick={clearDevice}>
              <HugeiconsIcon icon={Delete02Icon} className="size-4" /> Yes, clear it
            </Button>
          </div>
        ) : (
          <Button variant="destructive" className="gap-2 rounded-[10px]" onClick={() => setConfirming(true)}>
            <HugeiconsIcon icon={Delete02Icon} className="size-4" /> Clear data
          </Button>
        )}
      </Row>
    </>
  )
}

/** Students: test papers their teacher sent, ready to download. */
function StudentDownloads() {
  const { email } = useAuth()
  const [papers] = useState(() => papersForStudent(email))
  const [downloaded, setDownloaded] = useState(() => readDownloaded(email))

  function get(p: TestPaper) {
    downloadPaper(p)
    markDownloaded(email, p.id)
    setDownloaded((d) => (d.includes(p.id) ? d : [...d, p.id]))
    toast.success(`“${p.title}” was downloaded`)
  }

  return (
    <div className="border-b border-border pb-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-foreground">Downloads from your teacher</p>
        {papers.length > 0 && <span className="text-sm text-muted-foreground">{papers.length} {papers.length === 1 ? "paper" : "papers"}</span>}
      </div>
      <p className="text-sm text-muted-foreground">Test papers and worksheets your teacher sent to your class.</p>

      {papers.length === 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { emoji: "📕", title: "Test papers", text: "Your teacher’s tests will appear here." },
            { emoji: "📘", title: "Worksheets", text: "Download, print and bring them to class." },
          ].map((c) => (
            <div key={c.title} className="relative overflow-hidden rounded-[18px] border border-dashed border-border bg-field p-5">
              <span className="absolute top-3 right-3 rounded-full bg-[#FFF1D6] px-2.5 py-0.5 text-xs font-bold text-[#7A4E00]">Coming soon</span>
              <span className="text-4xl opacity-70" aria-hidden>
                {c.emoji}
              </span>
              <p className="mt-3 font-semibold text-foreground">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.text}</p>
              <Button disabled variant="outline" className="mt-4 w-full gap-2 rounded-[10px] dark:bg-transparent">
                <HugeiconsIcon icon={Download04Icon} className="size-4" /> Nothing to download yet
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {papers.map((p) => {
            const k = fileKind(p.file.type, p.file.name)
            const isNew = !downloaded.includes(p.id)
            return (
              <div key={p.id} className="relative flex flex-col rounded-[18px] border border-border bg-field p-5">
                {isNew && <span className="absolute top-3 right-3 rounded-full bg-link px-2.5 py-0.5 text-xs font-bold text-white">New</span>}
                <span className="text-4xl" aria-hidden>
                  {k.emoji}
                </span>
                <p className="mt-3 pr-12 font-semibold text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {k.label} · {prettySize(p.file.size)} · {formatDate(p.sentAt)}
                </p>
                {p.note && <p className="mt-2 rounded-[10px] bg-card px-3 py-2 text-sm text-foreground/85">💬 {p.note}</p>}
                <div className="flex-1" />
                <Button variant={isNew ? "default" : "outline"} className="mt-4 w-full gap-2 rounded-[10px] dark:bg-transparent data-[new=true]:dark:bg-primary" data-new={isNew} onClick={() => get(p)}>
                  <HugeiconsIcon icon={Download04Icon} className="size-4" /> {isNew ? "Download" : "Download again"}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const faqs: { q: string; a: string }[] = [
  { q: "How do I start a lesson?", a: "Open Discover, pick a resource card and press “Start lesson”." },
  { q: "Where are the kids games?", a: "Choose “Kids games” in the sidebar. Each child signs in with their own student ID so their stars are kept separately." },
  { q: "Why is my progress missing on another device?", a: "Progress is saved on the device you use. Syncing between devices will come with LittleReaderLab accounts on the server." },
  { q: "How do I switch between light and dark mode?", a: "Use the sun/moon button in the top bar, or Settings → Appearance." },
  { q: "Can I use LittleReaderLab offline?", a: "Yes, once the app has loaded, games, saved items and projects keep working without internet." },
]

function HelpSection() {
  const { role } = useAuth()
  return (
    <>
      <Heading title="Help and Support" text="Answers to common questions." />
      {/* the Help center lives in the teacher dashboard */}
      {role !== "student" && (
        <Button className="mb-5 h-11 gap-2 rounded-[10px] bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8] text-white" render={<Link to="/dashboard/help" />} nativeButton={false}>
          Open Help &amp; Guides
        </Button>
      )}
      <div className="space-y-2">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-[14px] border border-border px-4 py-3 open:bg-muted/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-foreground">
              {f.q}
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-5 shrink-0 transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-2 text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="mt-6 rounded-[16px] bg-muted/50 p-4">
        <p className="font-medium text-foreground">Keyboard shortcuts</p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>
            <kbd className="rounded bg-card px-1.5 py-0.5 font-mono">Ctrl</kbd> + <kbd className="rounded bg-card px-1.5 py-0.5 font-mono">F</kbd> — search on the dashboard
          </li>
          <li>
            <kbd className="rounded bg-card px-1.5 py-0.5 font-mono">Ctrl</kbd> + <kbd className="rounded bg-card px-1.5 py-0.5 font-mono">Enter</kbd> — run code in Python Quest
          </li>
          <li>
            <kbd className="rounded bg-card px-1.5 py-0.5 font-mono">Esc</kbd> — restart a Typing Race
          </li>
        </ul>
      </div>
    </>
  )
}
