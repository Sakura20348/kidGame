import { useState, type ReactNode } from "react"

import { logActivity } from "@/lib/activity"
import { KidsContext } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { toast } from "sonner"
import { kidsGames } from "@/data/kids-games"
import { readPrefs } from "@/lib/notify"

// Progress is kept per account, so every child (email) has their own stars.
const LEGACY_KEY = "pragmalab.kids" // before progress was per account

type Progress = { stars: number; best: Record<string, number> }

function read(email: string | null): Progress {
  const empty: Progress = { stars: 0, best: {} }
  try {
    const key = kidsKey(email, "kids")
    let raw = localStorage.getItem(key)
    // one-time move of old shared progress to the first account that opens Kids
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (!raw && legacy) {
      raw = legacy
      localStorage.setItem(key, legacy)
      localStorage.removeItem(LEGACY_KEY)
    }
    return { ...empty, ...JSON.parse(raw ?? "{}") }
  } catch {
    return empty
  }
}

// TODO: save the child's progress through the API
export function KidsProvider({ email, children }: { email: string | null; children: ReactNode }) {
  const [progress, setProgress] = useState(() => read(email))

  function award(game: string, stars: number, best = stars) {
    logActivity(email, "game")
    // Settings → Notifications → game achievements
    if (stars > 0 && readPrefs(email, false).kids) {
      const title = kidsGames.find((g) => g.id === game)?.title ?? "the game"
      toast(`⭐ +${stars} ${stars === 1 ? "star" : "stars"} in ${title}!`, { description: "Great job — keep going! 🎉" })
    }
    setProgress((prev) => {
      const next = {
        stars: prev.stars + stars,
        best: { ...prev.best, [game]: Math.max(prev.best[game] ?? 0, best) },
      }
      try {
        localStorage.setItem(kidsKey(email, "kids"), JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  return <KidsContext.Provider value={{ ...progress, award }}>{children}</KidsContext.Provider>
}
