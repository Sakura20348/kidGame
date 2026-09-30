import { useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowRight02Icon,
  BookOpen01Icon,
  ChartColumnIcon,
  CheckmarkCircle02Icon,
  LibraryIcon,
} from "@hugeicons/core-free-icons"

import { Eyebrow } from "@/components/resources/section"
import { ReadingCorner } from "@/components/student/reading-corner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/contexts"
import { useProjects } from "@/lib/contexts"
import { Reveal } from "@/components/motion/reveal"
import { MAX_SCORE } from "@/data/library-results"
import { pendingAssignments } from "@/lib/assignment-progress"
import { readLessonResults } from "@/lib/lesson-results"

const quickStart = (count: number): { to: string; icon: IconSvgElement; title: string; text: string }[] => [
  {
    to: "/student/assignments",
    icon: BookOpen01Icon,
    title: "Open assignments",
    text: "Start linked authentic-source lessons",
  },
  {
    to: "/student/progress",
    icon: ChartColumnIcon,
    title: "See my progress",
    text: "Continue lessons and improve scores",
  },
  {
    to: "/discover",
    icon: LibraryIcon,
    title: "Explore resources",
    text: `Choose from ${count} guided lessons`,
  },
]

function IconTile({ icon, className = "size-[46px]" }: { icon: IconSvgElement; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[10px] bg-[#E4F5C9] text-green-900 dark:bg-lime/15 dark:text-lime ${className}`}
    >
      <HugeiconsIcon icon={icon} className="size-[22px]" />
    </span>
  )
}

export default function StudentOverviewPage() {
  const { name, email } = useAuth()
  const { resources } = useProjects()
  const firstName = name.split(" ")[0]
  const [allResults] = useState(() => readLessonResults(email))
  // only lessons the student still has – a lesson the teacher deleted no longer counts
  const results = allResults.filter((r) => resources.some((x) => x.id === r.resourceId))
  const lessonsDone = new Set(results.map((r) => r.resourceId)).size
  const average = results.length ? Math.round((results.reduce((n, r) => n + r.score, 0) / results.length / MAX_SCORE) * 100) : 0
  const stats: { icon: IconSvgElement; value: string; label: string }[] = [
    { icon: BookOpen01Icon, value: String(pendingAssignments(email)), label: "Available assignments" },
    { icon: CheckmarkCircle02Icon, value: String(lessonsDone), label: "Lessons completed" },
    { icon: ChartColumnIcon, value: `${average}%`, label: "Average test score" },
  ]

  return (
    <div>
      <Reveal className="flex flex-col gap-6 @min-[900px]:flex-row @min-[900px]:items-start @min-[900px]:justify-between">
        <div>
          <Eyebrow>STUDENT WORKSPACE</Eyebrow>
          <h1 className="mt-3 font-serif text-[36px] leading-[1.15] text-foreground @min-[700px]:text-[46px]">
            Welcome{firstName ? `, ${firstName}` : ""}.
          </h1>
        </div>
        <Button
          className="h-14 gap-2.5 self-start rounded-[12px] px-5 text-[15px] font-extrabold"
          nativeButton={false}
          render={<Link to="/discover" />}
        >
          <HugeiconsIcon icon={LibraryIcon} className="size-5" />
          Browse {resources.length} guided resources
        </Button>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-5 @min-[700px]:grid-cols-3">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90} className="rounded-[22px] border border-border bg-card p-[26px]">
            <IconTile icon={s.icon} />
            <p className="mt-6 font-serif text-[38px] leading-none font-bold text-foreground [font-variant-numeric:oldstyle-nums]">
              {s.value}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </Reveal>
        ))}
      </div>

      {/* words, sentences and a short story for every curriculum topic */}
      <ReadingCorner />

      <Reveal as="section" className="mt-6 rounded-[26px] border border-border bg-card p-6 @min-[700px]:p-9">
        <Eyebrow>QUICK START</Eyebrow>
        <h2 className="mt-3 font-serif text-[28px] leading-tight text-foreground @min-[700px]:text-[32px]">
          Continue your learning journey
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 @min-[1100px]:grid-cols-3">
          {quickStart(resources.length).map((q) => (
            <Link
              key={q.title}
              to={q.to}
              className="group flex items-center gap-3.5 rounded-[18px] border border-border bg-[#F7F8F4] p-[22px] outline-none transition-colors hover:border-link/40 focus-visible:border-link dark:bg-field"
            >
              <IconTile icon={q.icon} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[19px] font-bold text-foreground">{q.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{q.text}</p>
              </div>
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                className="size-5 text-link transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  )
}
