import { Reveal } from "@/components/motion/reveal"
import { Eyebrow } from "@/components/resources/section"
import { findAccount } from "@/lib/accounts"
import { getAvatar } from "@/lib/avatar"
import { studentClass } from "@/lib/classes"
import { readLessonResults } from "@/lib/lesson-results"
import { cn } from "@/lib/utils"

export type TestLearner = {
  id: string
  name: string
  photo: string | null
  tests: number // lesson tests taken
  average: number | null // average test score, 0–100 (null = no tests yet)
  best: number | null
  me: boolean
}

// study lessons score 0–100 points; kid lessons score 0–5 quiz answers (×20)
const pointsOf = (r: { points?: number; score: number }) => r.points ?? r.score * 20

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** My class ranked by lesson test results: best average first; students without tests at the end. */
export function testRanking(email: string | null): TestLearner[] {
  const classmates = studentClass(email)?.students.map((s) => s.id) ?? []
  const ids = email && !classmates.some((c) => same(c, email)) ? [...classmates, email] : classmates
  return rankByTests(ids, email)
}

/** Any list of students (e.g. a teacher's class) ranked by their test average. */
export function rankByTests(ids: string[], me: string | null = null): TestLearner[] {
  const email = me
  return ids
    .map((id) => {
      const results = readLessonResults(id)
      const scores = results.map(pointsOf)
      return {
        id,
        name: findAccount(id)?.name || id,
        photo: getAvatar(id),
        tests: results.length,
        average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        best: scores.length ? Math.max(...scores) : null,
        me: !!email && same(id, email),
      }
    })
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1) || b.tests - a.tests || a.name.localeCompare(b.name))
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?"

/** "My place in class": my test average next to the class average and the top student. */
export function ClassPlace({ ranking }: { ranking: TestLearner[] }) {
  const myIndex = ranking.findIndex((l) => l.me)
  const me = ranking[myIndex]
  const tested = ranking.filter((l) => l.average !== null)
  if (!me) return null

  if (me.average === null)
    return (
      <Reveal as="section" className="rounded-[22px] border border-border bg-card p-6 @min-[700px]:p-8">
        <Eyebrow>MY PLACE IN CLASS</Eyebrow>
        <p className="mt-3 font-serif text-[28px] text-foreground">Not ranked yet</p>
        <p className="mt-2 text-[15px] text-muted-foreground">Finish your first lesson test to join the class ranking. 📝</p>
      </Reveal>
    )

  const top = tested[0]
  const classAverage = Math.round(tested.reduce((n, l) => n + (l.average ?? 0), 0) / tested.length)
  const ahead = myIndex > 0 ? ranking[myIndex - 1] : null
  const percentile = tested.length > 1 ? Math.round(((tested.length - 1 - myIndex) / (tested.length - 1)) * 100) : 100
  const rows = [
    { label: "Me", value: me.average, bar: "bg-[#FFB35C]", strong: true },
    { label: "Class average", value: classAverage, bar: "bg-[#7B7BF0]" },
    { label: `Top: ${top.me ? "me! 🏆" : top.name.split(" ")[0]}`, value: top.average ?? 0, bar: "bg-[#2BC0A4]" },
  ]

  return (
    <Reveal as="section" className="rounded-[22px] border border-border bg-card p-6 @min-[700px]:p-8">
      <div className="grid gap-8 @min-[900px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @min-[900px]:items-center">
        <div>
          <Eyebrow>MY PLACE IN CLASS · TESTS</Eyebrow>
          <p className="mt-3 font-serif text-[64px] leading-none font-bold text-foreground tabular-nums">
            #{myIndex + 1}
            <span className="text-[26px] text-muted-foreground"> of {tested.length}</span>
          </p>
          <p className="mt-3 text-[15px] text-muted-foreground">
            {tested.length === 1
              ? "You’re the only one with test results so far!"
              : myIndex === 0
                ? `You have the best test average in your class! 🎉`
                : `Better than ${percentile}% of your class.${ahead?.average != null ? ` ${ahead.average - me.average + 1} more points on average to pass ${ahead.name.split(" ")[0]}! 💪` : ""}`}
          </p>
        </div>
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={r.strong ? "font-bold text-foreground" : "text-muted-foreground"}>{r.label}</span>
                <span className="font-semibold text-foreground tabular-nums">{r.value} / 100</span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${r.bar} transition-[width] duration-700`} style={{ width: `${Math.max(2, r.value)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}

/** Everyone in my class, ranked by their lesson test average. */
export function TestRanking({ ranking }: { ranking: TestLearner[] }) {
  return (
    <Reveal as="section" className="rounded-[22px] border border-border bg-card p-6 @min-[700px]:p-8">
      <Eyebrow>CLASS RANKING · TESTS</Eyebrow>
      <h2 className="mt-2 font-serif text-[26px] leading-tight text-foreground">Who’s doing best in the tests</h2>
      <p className="mt-1 text-sm text-muted-foreground">Average score of all finished lesson tests, out of 100.</p>

      <div className="mt-5 hidden grid-cols-[3rem_minmax(0,1fr)_6rem_6rem_minmax(8rem,12rem)] gap-3 px-3 text-xs font-bold tracking-wide text-muted-foreground uppercase @min-[700px]:grid">
        <span>#</span>
        <span>Student</span>
        <span className="text-right">Tests</span>
        <span className="text-right">Best</span>
        <span className="text-right">Average</span>
      </div>
      <ol className="mt-2 space-y-2">
        {ranking.map((l, i) => {
          const ranked = l.average !== null
          return (
            <li
              key={l.id}
              className={cn(
                "grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] px-3 py-2.5 @min-[700px]:grid-cols-[3rem_minmax(0,1fr)_6rem_6rem_minmax(8rem,12rem)]",
                l.me ? "bg-[#FFD166]/20 ring-2 ring-[#FFD166]" : "bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-base font-bold",
                  !ranked ? "text-muted-foreground" : i === 0 ? "bg-[#FF9A3C] text-white" : i === 1 ? "bg-[#3B8BF5] text-white" : i === 2 ? "bg-[#8A84F5] text-white" : "bg-card text-foreground"
                )}
              >
                {ranked ? i + 1 : "–"}
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F2B46B] text-sm font-bold text-green-900">
                  {l.photo ? <img src={l.photo} alt="" className="size-full object-cover" /> : initials(l.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">
                    {l.name}
                    {l.me && <span className="ml-1.5 rounded-full bg-[#FFD166] px-1.5 text-[10px] font-bold text-[#2B2140]">YOU</span>}
                  </span>
                  <span className="text-xs text-muted-foreground @min-[700px]:hidden">
                    {l.tests} {l.tests === 1 ? "test" : "tests"}
                    {l.best !== null && ` · best ${l.best}`}
                  </span>
                </span>
              </span>
              <span className="hidden text-right text-sm text-foreground tabular-nums @min-[700px]:block">{l.tests}</span>
              <span className="hidden text-right text-sm text-foreground tabular-nums @min-[700px]:block">{l.best ?? "–"}</span>
              <span className="flex items-center justify-end gap-2">
                {ranked && (
                  <span className="hidden h-2 w-20 overflow-hidden rounded-full bg-card @min-[700px]:block">
                    <span className="block h-full rounded-full bg-[#2BC0A4]" style={{ width: `${l.average}%` }} />
                  </span>
                )}
                <span className="w-10 text-right font-bold text-foreground tabular-nums">{ranked ? l.average : "–"}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </Reveal>
  )
}
