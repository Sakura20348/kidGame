// Teachers confirm each sign-in with a 6-digit code sent to their email.
// The server makes, emails and checks the code (POST /api/auth/send-code and /api/auth/verify-code).
// In development without an email service, the server sends the code back and the Verify page shows it.

import { findAccount } from "@/lib/accounts"
import { api } from "@/lib/api"

const SESSION_KEY = "pragmalab.verify.session"

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function read<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null")
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable
  }
}

export type SentCode = { sent: boolean; email: string; devCode?: string; verified?: boolean; sentAt: number }

/** Asks the server to email a new code. */
export async function sendCode(): Promise<SentCode> {
  const res = await api<Omit<SentCode, "sentAt">>("/api/auth/send-code", { method: "POST" })
  return { ...res, sentAt: Date.now() }
}

/** Checks the code on the server; on success this sign-in is verified. Throws a friendly message otherwise. */
export async function verifyCode(email: string, code: string) {
  await api("/api/auth/verify-code", { body: { code: code.trim() } })
  markVerified(email)
}

/** Remembers on this device that this sign-in entered its code (the server knows it too). */
export function markVerified(email: string) {
  write(SESSION_KEY, [...verifiedList().filter((v) => !same(v, email)), email])
}

/** Accounts that entered their email code since signing in (one per open sign-in). */
function verifiedList(): string[] {
  const v = read<string | string[]>(SESSION_KEY)
  return Array.isArray(v) ? v : v ? [v] : []
}

/** Has this teacher entered their email code since signing in? */
export function isVerifiedSession(email: string | null) {
  return !!email && verifiedList().some((v) => same(v, email))
}

/** Forget this account's verified sign-in (on sign-out) – other tabs' accounts stay signed in. */
export function clearVerification(email: string | null) {
  write(SESSION_KEY, verifiedList().filter((v) => !email || !same(v, email)))
}

/** A teacher who has confirmed their email at least once (their class is open). */
export const isVerifiedTeacher = (email: string) => !!findAccount(email)?.verifiedAt
