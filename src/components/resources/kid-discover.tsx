import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { Reveal } from "@/components/motion/reveal"
import { starsFor } from "@/data/kids-games"
import { guideFor } from "@/data/lesson-guides"
import type { Resource } from "@/data/resources"
import { useAuth, useLibrary, useProjects } from "@/lib/contexts"
import { readLessonResults } from "@/lib/lesson-results"
import { cn } from "@/lib/utils"

const agePill = "bg-[#C77DDB] text-white"
const topicPill = "bg-[#4FACFE] text-white"

/** Time left until midnight, "hh:mm:ss" – the lesson of the day changes then. */
function useUntilMidnight() {
  const calc = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(24, 0, 0, 0)
    const s = Math.floor((end.getTime() - now.getTime()) / 1000)
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":")
  }
  const [left, setLeft] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setLeft(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return left
}

/** Discover for young students (7–12): lesson of the day + big picture cards. */
export function KidDiscover() {
  const { name, email } = useAuth()
  const { resources } = useProjects()
  const { startLesson } = useLibrary()
  const [results] = useState(() => readLessonResults(email))
  const left = useUntilMidnight()

  // best quiz score per lesson → stars
  const best: Record<string, number> = {}
  for (const r of results) best[r.resourceId] = Math.max(best[r.resourceId] ?? 0, r.score)
  const starsOf = (id: string) => (id in best ? Math.max(1, starsFor(best[id], 5)) : 0)

  // lesson of the day: the first one not played yet (changes each day)
  const todo = resources.filter((r) => !(r.id in best))
  const pool = todo.length ? todo : resources
  const today = pool.length ? pool[new Date().getDate() % pool.length] : undefined

  return (
    <div className="font-kids">
      <Reveal>
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Hi{name ? `, ${name.split(" ")[0]}` : ""}! 👋</h1>
        <p className="mt-1 text-xl text-muted-foreground">What will we learn today?</p>
      </Reveal>

      <div className="mt-6 grid gap-5 @min-[900px]:grid-cols-[1.4fr_1fr]">
        {/* lesson of the day */}
        {today ? (
          <Reveal className="relative flex overflow-hidden rounded-[32px] bg-linear-to-br from-[#7ED957] to-[#3FB26B] p-6 text-white shadow-[0_8px_0_rgba(31,120,70,0.25)] sm:p-8">
            <span aria-hidden className="absolute -bottom-16 -left-10 size-56 rounded-full bg-white/15" />
            <div className="relative flex flex-1 flex-col">
              <p className="flex items-center gap-2 text-base font-semibold text-white/90">⏱ {left}</p>
              <p className="mt-2 text-2xl font-bold tracking-wide uppercase">Lesson of the day</p>
              <p className={cn("leading-tight font-bold uppercase", today.title.length > 26 ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl")}>{today.title}</p>
              <button
                type="button"
                onClick={() => startLesson(today)}
                className="mt-6 w-fit rounded-full bg-white px-7 py-3 sm:mt-auto text-lg font-bold text-[#2E8B57] uppercase shadow-[0_5px_0_rgba(0,0,0,0.12)] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-white/60 active:translate-y-1"
              >
                Start now
              </button>
            </div>
            <span className="relative ml-4 hidden size-44 shrink-0 items-center justify-center self-center overflow-hidden rounded-[28px] bg-white/90 text-[110px] shadow-[0_6px_0_rgba(0,0,0,0.1)] sm:flex">
              {today.image ? <img src={today.image} alt="" className="size-full object-cover" /> : guideFor(today).emoji}
            </span>
          </Reveal>
        ) : (
          <Reveal className="rounded-[32px] bg-linear-to-br from-[#7ED957] to-[#3FB26B] p-8 text-white">
            <p className="text-3xl font-bold">📬 No lessons yet</p>
            <p className="mt-2 text-lg text-white/90">When your teacher sends you lessons, they’ll show up here.</p>
          </Reveal>
        )}

        {/* games */}
        <Reveal delay={80}>
          <Link
            to="/kids"
            className="relative flex h-full min-h-56 flex-col overflow-hidden rounded-[32px] bg-linear-to-br from-[#8EC5FF] to-[#4FACFE] p-6 text-white shadow-[0_8px_0_rgba(40,110,190,0.25)] outline-none transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-white/60 sm:p-8"
          >
            <span className="w-fit rounded-full bg-[#FF9F43] px-3 py-1 text-sm font-bold uppercase">Play</span>
            <p className="mt-3 text-4xl leading-tight font-bold uppercase">Kids games</p>
            <p className="mt-auto w-fit rounded-full border-2 border-white/80 px-5 py-2 text-base font-bold uppercase">Let’s play ➜</p>
            <span aria-hidden className="absolute -right-4 -bottom-4 text-[130px] leading-none drop-shadow-[0_6px_0_rgba(0,0,0,0.12)]">
              🎮
            </span>
          </Link>
        </Reveal>
      </div>

      <h2 className="mt-10 text-2xl font-bold tracking-wide text-foreground uppercase">All lessons</h2>
      {resources.length === 0 ? (
        <p className="mt-4 rounded-[24px] bg-card p-6 text-lg text-muted-foreground">Your teacher hasn’t sent any lessons yet. Try the games meanwhile! 🎮</p>
      ) : (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
          {resources.map((r, i) => (
            <Reveal key={r.id} delay={(i % 5) * 60}>
              <KidLessonTile resource={r} stars={starsOf(r.id)} onOpen={() => startLesson(r)} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}

function KidLessonTile({ resource: r, stars, onOpen }: { resource: Resource; stars: number; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="group w-full text-left outline-none">
      <span className="relative flex aspect-square items-center justify-center rounded-[26px] border-2 border-[#CFE3F5] bg-white shadow-[0_6px_0_#CFE3F5] transition-transform group-hover:-translate-y-1 group-focus-visible:ring-4 group-focus-visible:ring-[#6C63FF]/40 group-active:translate-y-1 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_6px_0_rgba(255,255,255,0.06)]">
        <span className="absolute inset-4 rounded-[20px] opacity-40" style={{ backgroundColor: r.color }} />
        {r.image ? (
          <img src={r.image} alt="" className="absolute inset-4 size-[calc(100%-2rem)] rounded-[20px] object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <span aria-hidden className="relative text-[96px] leading-none transition-transform duration-300 group-hover:scale-110">
            {guideFor(r).emoji}
          </span>
        )}
        {stars === 0 ? (
          <span className="absolute top-3 left-3 rounded-full bg-[#2BC0A4] px-2.5 py-0.5 text-xs font-bold text-white uppercase">New</span>
        ) : (
          <span className="absolute top-3 right-3 text-lg" aria-label={`${stars} of 3 stars`}>
            {"⭐".repeat(stars)}
          </span>
        )}
      </span>
      <span className="mt-3 block text-lg leading-tight font-bold tracking-wide text-foreground uppercase">{r.title}</span>
      <span className="mt-2 flex flex-wrap gap-1.5">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold uppercase", agePill)}>{r.ageGroup}</span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold uppercase", topicPill)}>{r.topic}</span>
      </span>
    </button>
  )
}
