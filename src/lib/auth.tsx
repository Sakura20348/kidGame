import { useEffect, useState, type ReactNode } from "react"

import { EMAIL_RE, findAccount, type Account, type Role } from "@/lib/accounts"
import { api, ApiError, getToken, pinToken, setToken, SIGNED_OUT_EVENT, type Me } from "@/lib/api"
import { AuthContext } from "@/lib/contexts"
import { markAway, nameFromEmail, touch } from "@/lib/presence"
import { syncNow } from "@/lib/sync"
import { clearVerification, markVerified } from "@/lib/verify"

const EMAIL_KEY = "pragmalab.email"
const ROLE_KEY = "pragmalab.role"

// Each browser tab keeps its own sign-in (sessionStorage), so a teacher and a
// student can be open side by side and a reload keeps each tab's account.
// localStorage only remembers the last sign-in, so a brand-new tab starts there.
// Accounts, passwords and sessions live on the API server (server/ – see /api/auth).
function read(key: string) {
  try {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, value)
      localStorage.setItem(key, value)
    }
  } catch {
    // storage unavailable – keep the session in memory only
  }
}

function toInitials(name: string, email: string | null) {
  const words = name.split(" ").filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0][0].toUpperCase() // one name, e.g. "Muslima" → "M" (not the student ID)
  const local = email?.split("@")[0] ?? ""
  return local ? local.slice(0, 2).toUpperCase() : "?"
}

/** Reads a session value and copies it into this tab's own storage. */
function pin(key: string) {
  const value = read(key)
  try {
    if (value !== null) sessionStorage.setItem(key, value)
  } catch {
    // ignore
  }
  return value
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // pin this tab to the account (and token) it opened with, so sign-ins in other tabs don't move it
  const [email, setEmail] = useState<string | null>(() => {
    pinToken()
    // a sign-in from before the API server has no token: sign in again
    return getToken() ? pin(EMAIL_KEY) : null
  })
  const [role, setRole] = useState<Role | null>(() => (getToken() ? (pin(ROLE_KEY) as Role | null) : null))
  const [, setVersion] = useState(0) // re-render after account changes
  const refresh = () => setVersion((v) => v + 1)

  function clearLocal() {
    clearVerification(email) // teachers get a new email code next time
    setToken(null)
    write(EMAIL_KEY, null)
    write(ROLE_KEY, null)
    setEmail(null)
    setRole(null)
  }

  // The server ended this sign-in (expired, password changed elsewhere…): sign this tab out.
  useEffect(() => {
    const onSignedOut = () => clearLocal()
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut)
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut)
  })

  // Check the session once when the app opens (teachers: was the email code already entered?).
  useEffect(() => {
    if (!email || !getToken()) return
    api<Me>("/api/auth/me")
      .then((me) => {
        if (me.verified) markVerified(me.user.email)
        refresh()
      })
      .catch(() => {
        // offline: keep working with what this device has
      })
    // only on first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Presence: tell the server "I'm here" every minute while the app is open.
  useEffect(() => {
    if (!email) return
    touch(email)
    const id = setInterval(() => touch(email), 60_000)
    const leave = () => markAway(email)
    window.addEventListener("pagehide", leave)
    return () => {
      clearInterval(id)
      window.removeEventListener("pagehide", leave)
    }
  }, [email])

  /** Keeps the new sign-in and fetches this account's data before the app moves on. */
  async function start(me: Me, nextRole: Role) {
    setToken(me.token ?? null)
    write(EMAIL_KEY, me.user.email)
    write(ROLE_KEY, nextRole)
    if (me.verified) markVerified(me.user.email)
    await syncNow()
    setEmail(me.user.email)
    setRole(nextRole)
  }

  async function signIn(value: string, password: string, nextRole: Role) {
    const me = await api<Me>("/api/auth/login", { body: { email: value.trim(), password, role: nextRole } })
    await start(me, nextRole)
  }

  async function signUp({ password, ...data }: Omit<Account, "createdAt" | "passwordHash"> & { password: string }) {
    // students get their 6-digit ID from the server
    const me = await api<Me>("/api/auth/signup", {
      body: {
        role: data.role,
        email: data.role === "teacher" ? data.email : undefined,
        name: data.name,
        password,
        grade: data.grade,
        ageGroup: data.ageGroup,
        school: data.school,
      },
    })
    await start(me, data.role)
    return me.user.email
  }

  async function updateName(next: string) {
    if (!email) return
    const clean = next.trim().replace(/\s+/g, " ")
    if (clean.length < 2) throw new Error("Your name needs at least 2 letters.")
    await api("/api/auth/me", { method: "PATCH", body: { name: clean } })
    await syncNow()
    refresh()
  }

  async function changeEmail(next: string) {
    if (!email) return
    const clean = next.trim()
    if (!EMAIL_RE.test(clean)) throw new Error("Enter a valid email address.")
    if (clean.toLowerCase() === email.toLowerCase()) throw new Error("That’s already your email.")
    // the server moves the account, class and saved data; this device then fetches them under the new email
    const me = await api<Me>("/api/auth/email", { body: { email: clean } })
    clearVerification(email)
    if (me.verified) markVerified(me.user.email)
    write(EMAIL_KEY, me.user.email)
    await syncNow()
    setEmail(me.user.email)
  }

  async function changePassword(current: string, next: string) {
    if (!email) return
    if (next.length < 6) throw new Error("The new password needs at least 6 characters.")
    await api("/api/auth/password", { body: { current, next } })
  }

  function signOut() {
    if (email) markAway(email)
    if (getToken()) void api("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => undefined)
    clearLocal()
  }

  const name = findAccount(email)?.name || nameFromEmail(email)

  return (
    <AuthContext.Provider
      value={{
        email,
        initials: toInitials(name, email),
        name,
        role,
        signIn,
        signUp,
        signOut,
        updateName,
        changeEmail,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { ApiError }
