const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})

/** "Sun, Mar 16 2025, 03:38pm" */
export function formatDate(iso: string) {
  const p = Object.fromEntries(dateFormat.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return `${p.weekday}, ${p.month} ${p.day} ${p.year}, ${p.hour}:${p.minute}${String(p.dayPeriod).toLowerCase()}`
}

/** [1, 2, 3, "…", 8, 9, 10] */
export function pageList(count: number, current: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const set = new Set([1, 2, 3, count - 2, count - 1, count, current, current - 1, current + 1])
  const pages = [...set].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  const out: (number | "…")[] = []
  pages.forEach((p, i) => {
    if (i && p - pages[i - 1] > 1) out.push("…") 
    out.push(p)
  })
  return out
}
