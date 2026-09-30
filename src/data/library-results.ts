export const MAX_SCORE = 5

/** Emoji + label for a test score out of 5. */
export const scoreScale: { score: number; emoji: string; label: string }[] = [
  { score: 0, emoji: "😡", label: "Needs help" },
  { score: 1, emoji: "😠", label: "Keep trying" },
  { score: 2, emoji: "😕", label: "Getting there" },
  { score: 3, emoji: "😐", label: "Okay" },
  { score: 4, emoji: "😃", label: "Great" },
  { score: 5, emoji: "😁", label: "Excellent" },
]

export const scoreInfo = (score: number) => scoreScale[Math.max(0, Math.min(MAX_SCORE, score))]
