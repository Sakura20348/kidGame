import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

import { useAuth } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"

// Light / dark / system – saved per account ("pragmalab.theme:<account>"), so a teacher and a
// student open side by side each keep their own look. The key is synced like other account data,
// so the choice also follows the account to other devices.

export type ThemeChoice = "light" | "dark" | "system"
type ThemeContextValue = { theme: ThemeChoice; resolvedTheme: "light" | "dark"; setTheme: (t: ThemeChoice) => void }

const ThemeContext = createContext<ThemeContextValue | null>(null)
const LEGACY_KEY = "theme" // one setting for everyone, from before

const media = () => window.matchMedia("(prefers-color-scheme: dark)")

function readChoice(key: string): ThemeChoice {
  try {
    const v = localStorage.getItem(key) ?? localStorage.getItem(LEGACY_KEY)
    return v === "light" || v === "dark" || v === "system" ? v : "system"
  } catch {
    return "system"
  }
}

/** Switch the page's colours without every element animating its colour change. */
function apply(resolved: "light" | "dark") {
  const root = document.documentElement
  const calm = document.createElement("style")
  calm.appendChild(document.createTextNode("*,*::before,*::after{transition:none!important}"))
  document.head.appendChild(calm)
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
  void window.getComputedStyle(document.body).opacity // flush styles before transitions come back
  setTimeout(() => calm.remove(), 1)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { email } = useAuth()
  const key = kidsKey(email, "theme")
  const [theme, setThemeState] = useState<ThemeChoice>(() => readChoice(key))
  const [systemDark, setSystemDark] = useState(() => media().matches)
  const [shownFor, setShownFor] = useState(key)

  // another account signed in in this tab: show that account's choice
  if (shownFor !== key) {
    setShownFor(key)
    setThemeState(readChoice(key))
  }

  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme

  useEffect(() => apply(resolvedTheme), [resolvedTheme])

  // follow the computer's setting while on "system"
  useEffect(() => {
    const m = media()
    const onChange = () => setSystemDark(m.matches)
    m.addEventListener("change", onChange)
    return () => m.removeEventListener("change", onChange)
  }, [])

  // the same account changed it in another tab (or on another device, through sync)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setThemeState(readChoice(key))
    }
    const onSync = (e: Event) => {
      if (((e as CustomEvent<string[]>).detail ?? []).includes(key)) setThemeState(readChoice(key))
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("pragmalab:sync", onSync)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("pragmalab:sync", onSync)
    }
  }, [key])

  const setTheme = useCallback(
    (t: ThemeChoice) => {
      setThemeState(t)
      try {
        localStorage.setItem(key, t)
      } catch {
        // storage unavailable – keep it for this visit
      }
    },
    [key]
  )

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
}

/** The current account's theme: its choice, what is actually shown, and a way to change it. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
