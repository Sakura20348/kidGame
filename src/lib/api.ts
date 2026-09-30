// Talks to the LittleReaderLab API server (server/). Each browser tab keeps its own sign-in token,
// like it keeps its own account (see auth.tsx), so a teacher and a student can be open side by side.
//
// VITE_API_URL (see .env) is where the API lives. Leave it empty in development:
// the Vite dev server then forwards /api to the local server.

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")
export const TOKEN_KEY = "pragmalab.token"

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token === null) {
      sessionStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_KEY)
    } else {
      sessionStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(TOKEN_KEY, token)
    }
  } catch {
    // storage unavailable
  }
}

/** Keeps a new tab on the token it opened with (like the account). */
export function pinToken() {
  const t = getToken()
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t)
  } catch {
    // ignore
  }
}

export const apiUrl = (path: string) => `${BASE}${path}`

export function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/** The sign-in ended on the server (expired, signed out elsewhere): the app signs this tab out. */
export const SIGNED_OUT_EVENT = "pragmalab:signed-out"

/** JSON request to the API. Throws ApiError with the server's friendly message. */
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown; keepalive?: boolean } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(apiUrl(path), {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers: { ...(options.body === undefined ? {} : { "Content-Type": "application/json" }), ...authHeaders() },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      keepalive: options.keepalive,
    })
  } catch {
    throw new ApiError("We can’t reach the LittleReaderLab server. Check your internet (or start it with `npm run server`) and try again.", 0)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && getToken()) window.dispatchEvent(new Event(SIGNED_OUT_EVENT))
    const detail = data?.detail
    const message = typeof detail === "string" ? detail : Array.isArray(detail) ? "Please check the form and try again." : `Something went wrong (${res.status}).`
    throw new ApiError(message, res.status)
  }
  return data as T
}

/** What the server tells us about the signed-in account. */
export type Me = {
  user: { email: string; name: string; role: "student" | "teacher"; grade?: number; ageGroup?: string; school?: string; createdAt: string; verifiedAt?: string }
  verified: boolean
  classCode: string | null
  token?: string
}
