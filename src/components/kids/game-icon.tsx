import { WordBuilderArt } from "@/components/kids/word-builder-art"
import type { KidsGame } from "@/data/kids-games"
import { isYoungAge } from "@/data/lesson-guides"
import { findAccount } from "@/lib/accounts"
import { useAuth } from "@/lib/contexts"
import { cn } from "@/lib/utils"

/**
 * A game's icon: the emoji for Class 0–3, and the game's picture (if it has one)
 * for Class 4 – e.g. Word Builder shows 🔤 to young children and letter blocks to Class 4.
 * `className` sizes the emoji (text size); `imageClassName` sizes the picture.
 */
export function GameIcon({ game, className, imageClassName }: { game: KidsGame; className?: string; imageClassName?: string }) {
  const { email } = useAuth()
  const band = findAccount(email)?.ageGroup
  const older = !!band && !isYoungAge(band)
  if (older && game.artForOlder === "word-builder") return <WordBuilderArt className={cn("drop-shadow-[0_6px_0_rgba(0,0,0,0.12)]", imageClassName)} />
  return <span className={className}>{game.emoji}</span>
}
