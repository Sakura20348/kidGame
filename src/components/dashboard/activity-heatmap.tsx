import { useMemo, useState } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { dayKey, readActivity, sampleActivity, type ActivityKind, type ActivityLog } from "@/lib/activity"
import { useAuth } from "@/lib/contexts"
import { cn } from "@/lib/utils"

type Tab = "all" | ActivityKind

const tabs: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lesson", label: "Lessons" },
  { id: "game", label: "Games" },
  { id: "assignment", label: "Assignments" },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const LEVELS = [
  "bg-[#E9EEF5] dark:bg-white/8",
  "bg-[#CFE3FB] dark:bg-[#2F7BDD]/35",
  "bg-[#9CC6F5] dark:bg-[#2F7BDD]/60",
  "bg-[#5A9CEB] dark:bg-[#3B8BE8]/85",
  "bg-[#1F5FBF] dark:bg-[#8DBBFF]",
]

/** GitHub-style year of activity: one square per day, darker = busier. */
export function ActivityHeatmap({ className }: { className?: string }) {
  const { email } = useAuth()
  const [today] = useState(() => new Date())
  const [real] = useState<ActivityLog>(() => readActivity(email))
  const realDays = Object.keys(real).length
  const usingSample = realDays < 5 // show example history until real activity builds up

  const years = useMemo(() => {
    const ys = new Set([today.getFullYear(), today.getFullYear() - 1])
    Object.keys(real).forEach((k) => ys.add(Number(k.slice(0, 4))))
    return [...ys].sort((a, b) => b - a)
  }, [real, today])

  const [year, setYear] = useState(today.getFullYear())
  const [tab, setTab] = useState<Tab>("all")
  const [hover, setHover] = useState<string | null>(null)

  const log = useMemo(() => {
    if (!usingSample) return real
    // real days always win over the example ones
    return { ...sampleActivity(year, today), ...real }
  }, [usingSample, real, year, today])

  const count = (k: string) => {
    const d = log[k]
    if (!d) return 0
    return tab === "all" ? d.lesson + d.game + d.assignment : d[tab]
  }

  // weeks (columns) × 7 days (rows, Sun → Sat)
  const { weeks, monthCols } = useMemo(() => {
    const start = new Date(year, 0, 1)
    start.setDate(start.getDate() - start.getDay())
    const weeks: (Date | null)[][] = []
    const monthCols: { col: number; label: string }[] = []
    for (let d = new Date(start); d.getFullYear() <= year; ) {
      const week: (Date | null)[] = []
      for (let i = 0; i < 7; i++) {
        week.push(d.getFullYear() === year ? new Date(d) : null)
        if (d.getFullYear() === year && d.getDate() === 1) monthCols.push({ col: weeks.length, label: MONTHS[d.getMonth()] })
        d.setDate(d.getDate() + 1)
      }
      weeks.push(week)
      if (d.getFullYear() > year) break
    }
    return { weeks, monthCols }
  }, [year])

  const max = Math.max(1, ...weeks.flat().map((d) => (d ? count(dayKey(d)) : 0)))
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)))

  // yearly summary + streaks
  const days = weeks.flat().filter((d): d is Date => !!d && d <= today)
  const total = days.reduce((s, d) => s + count(dayKey(d)), 0)
  const activeDays = days.filter((d) => count(dayKey(d)) > 0).length
  let longest = 0
  let run = 0
  for (const d of days) {
    run = count(dayKey(d)) > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  let current = 0
  for (let i = days.length - 1; i >= 0 && count(dayKey(days[i])) > 0; i--) current++

  const hovered = hover ? log[hover] : null
  const hoverDate = hover ? new Date(`${hover}T12:00:00`) : null

  return (
    <section className={cn("rounded-[24px] bg-card p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Activity type" className="flex gap-1 rounded-[12px] bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-8 rounded-[9px] px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                tab === t.id ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {usingSample && (
            <span className="rounded-full bg-[#FFF1D6] px-3 py-1 text-xs font-semibold text-[#8B5A2B] dark:bg-white/10 dark:text-[#FFD166]" title="Your real activity appears here as you use LittleReaderLab">
              Sample data
            </span>
          )}
          <Select value={String(year)} onValueChange={(v) => v && setYear(Number(v))}>
            <SelectTrigger aria-label="Year" className="h-9 w-24 rounded-[10px] border-border bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-[12px]">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* the calendar */}
      <div className="mt-5 overflow-x-auto pb-1" data-lenis-prevent>
        <div className="grid min-w-[720px] grid-cols-[34px_1fr] gap-x-2">
          <div />
          <div className="relative mb-1 h-5 text-xs text-muted-foreground">
            {monthCols.map((m) => (
              <span key={m.label} className="absolute" style={{ left: `${(m.col / weeks.length) * 100}%` }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="grid grid-rows-7 gap-[3px] text-xs text-muted-foreground">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
              <span key={i} className="flex items-center leading-none">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }} onMouseLeave={() => setHover(null)}>
            {weeks.flatMap((week, wi) =>
              week.map((d, di) => {
                if (!d) return <span key={`${wi}-${di}`} className="aspect-square" />
                const k = dayKey(d)
                const n = d <= today ? count(k) : 0
                const future = d > today
                return (
                  <span
                    key={k}
                    onMouseEnter={() => setHover(k)}
                    title={`${n} ${n === 1 ? "activity" : "activities"} on ${d.toDateString()}`}
                    className={cn(
                      "aspect-square rounded-[3px] transition-transform hover:scale-125",
                      future ? "bg-[#EBEEEA]/50 dark:bg-white/4" : LEVELS[level(n)],
                      k === dayKey(today) && "ring-2 ring-[#2F7BDD] ring-offset-1 ring-offset-card"
                    )}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* hover details + legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="min-h-5 text-muted-foreground" aria-live="polite">
          {hovered && hoverDate
            ? `${hoverDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}: ${hovered.lesson} lessons · ${hovered.game} games · ${hovered.assignment} assignments`
            : hover && hoverDate
              ? `${hoverDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}: no activity`
              : `${total} activities · ${activeDays} active days · 🔥 ${current}-day streak (best ${longest})`}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Less
          {LEVELS.map((c) => (
            <span key={c} className={cn("size-3 rounded-[3px]", c)} />
          ))}
          More
        </span>
      </div>
    </section>
  )
}
