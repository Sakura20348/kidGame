import { useEffect, useEffectEvent, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { dayKey, readActivity } from "@/lib/activity"
import { classStudents } from "@/lib/classes"
import { useAuth, useProjects } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { readLessonResults } from "@/lib/lesson-results"
import { noticesFor } from "@/lib/messages"
import { daysBetween, newSince, readMemo, readPrefs, writeMemo } from "@/lib/notify"
import { classSubmissions, readSubmissions } from "@/lib/submissions"

const WEEK_MS = 7 * 86400000

/**
 * Pop-up notifications, following Settings → Notifications:
 * students – new lessons / messages / test papers, a daily lesson reminder, a weekly progress report;
 * teachers – new student work, students joining, a weekly class report.
 * (Game achievements are cheered in the games themselves.)
 */
export function Notifier() {
  const { email, role } = useAuth()
  const { resources } = useProjects()
  const navigate = useNavigate()
  const teacher = role === "teacher"
  // wait until this account's data has arrived, so nothing already there looks "new"
  const ready = useRef(false)

  const check = useEffectEvent(() => {
    if (!email || !ready.current) return
    if (teacher) checkTeacher()
    else checkStudent()
  })

  // ------------------------------------------------------------ students
  function checkStudent() {
    const prefs = readPrefs(email, false)

    // new lessons from the teacher (only lessons for this student's class are in `resources`)
    const lessons = newSince(email, "lessons", resources.map((r) => r.id))
    if (prefs.assignments && !lessons.firstTime)
      for (const id of lessons.fresh.slice(0, 3)) {
        const r = resources.find((x) => x.id === id)
        if (r) toast("📬 New lesson from your teacher", { description: r.title, action: { label: "Open", onClick: () => navigate(`/lesson/${r.id}`) } })
      }

    // new messages and test papers
    const notices = noticesFor(email)
    const fresh = newSince(email, "notices", notices.map((n) => n.id))
    if (prefs.assignments && !fresh.firstTime)
      for (const id of fresh.fresh.slice(0, 3)) {
        const n = notices.find((x) => x.id === id)!
        toast(n.kind === "paper" ? "📕 New test paper" : n.personal ? "💌 Message from your teacher" : "📣 Message to your class", {
          description: n.text,
          action: n.link ? { label: "Open", onClick: () => navigate(n.link!) } : undefined,
        })
      }

    const today = dayKey(new Date())
    const memo = readMemo(email)

    // daily reminder: lessons are waiting and nothing was done today yet
    if (prefs.reminders && memo.lastReminder !== today) {
      const done = new Set(readLessonResults(email).map((r) => r.resourceId))
      const waiting = resources.filter((r) => !done.has(r.id))
      const a = readActivity(email)[today]
      const busyToday = !!a && a.lesson + a.game + a.assignment > 0
      if (waiting.length > 0 && !busyToday) {
        writeMemo(email, { ...readMemo(email), lastReminder: today })
        toast(`📚 You have ${waiting.length} ${waiting.length === 1 ? "lesson" : "lessons"} waiting`, {
          description: "A few minutes of learning a day makes a big difference. Let’s go!",
          action: { label: "Start", onClick: () => navigate(`/lesson/${waiting[0].id}`) },
        })
      }
    }

    // weekly progress report
    if (prefs.report && (!memo.lastReport || daysBetween(memo.lastReport, new Date()) >= 7)) {
      writeMemo(email, { ...readMemo(email), lastReport: new Date().toISOString() })
      const since = Date.now() - WEEK_MS
      const log = readActivity(email)
      let activities = 0
      for (let i = 0; i < 7; i++) {
        const d = log[dayKey(new Date(Date.now() - i * 86400000))]
        if (d) activities += d.lesson + d.game + d.assignment
      }
      const results = readLessonResults(email).filter((r) => new Date(r.takenAt).getTime() >= since)
      const avg = results.length ? Math.round(results.reduce((n, r) => n + (r.points ?? r.score * 20), 0) / results.length) : null
      let stars = 0
      try {
        stars = JSON.parse(localStorage.getItem(kidsKey(email, "kids")) ?? "{}").stars ?? 0
      } catch {
        // ignore
      }
      toast("📊 Your week in LittleReaderLab", {
        duration: 12000,
        description: `${activities} activities · ${results.length} ${results.length === 1 ? "lesson" : "lessons"} finished${avg !== null ? ` · test average ${avg}/100` : ""} · ⭐ ${stars} game stars in total`,
        action: { label: "My progress", onClick: () => navigate("/student/progress") },
      })
    }
  }

  // ------------------------------------------------------------ teachers
  function checkTeacher() {
    const prefs = readPrefs(email, true)

    const work = classSubmissions(email)
    const freshWork = newSince(email, "work", work.map((w) => w.id))
    if (prefs.work && !freshWork.firstTime)
      for (const id of freshWork.fresh.slice(0, 3)) {
        const w = work.find((x) => x.id === id)!
        toast(`📥 ${w.student.name} sent work`, { description: w.title })
      }

    const students = classStudents(email)
    const joined = newSince(email, "joins", students.map((s) => s.id))
    if (prefs.joins && !joined.firstTime)
      for (const id of joined.fresh.slice(0, 5)) {
        const s = students.find((x) => x.id === id)!
        toast(`👋 ${s.name} joined your class`, { action: { label: "Team", onClick: () => navigate("/dashboard/team") } })
      }

    const memo = readMemo(email)
    if (prefs.report && students.length > 0 && (!memo.lastReport || daysBetween(memo.lastReport, new Date()) >= 7)) {
      writeMemo(email, { ...readMemo(email), lastReport: new Date().toISOString() })
      const since = Date.now() - WEEK_MS
      const weekDays = Array.from({ length: 7 }, (_, i) => dayKey(new Date(Date.now() - i * 86400000)))
      const active = students.filter((s) => {
        const log = readActivity(s.id)
        return weekDays.some((d) => log[d] && log[d].lesson + log[d].game + log[d].assignment > 0)
      }).length
      const lessons = students.reduce((n, s) => n + readLessonResults(s.id).filter((r) => new Date(r.takenAt).getTime() >= since).length, 0)
      const sent = students.reduce((n, s) => n + readSubmissions(s.id).filter((x) => new Date(x.createdAt).getTime() >= since).length, 0)
      toast("📊 Your class this week", {
        duration: 12000,
        description: `${active} of ${students.length} students were active · ${lessons} lessons finished · ${sent} pieces of work sent`,
        action: { label: "Student view", onClick: () => navigate("/dashboard/students") },
      })
    }
  }

  // check a moment after opening (so this account's data has synced), after every sync, and when lessons change
  useEffect(() => {
    ready.current = false
    const id = window.setTimeout(() => {
      ready.current = true
      check()
    }, 2500)
    const onSync = () => check()
    window.addEventListener("pragmalab:sync", onSync)
    window.addEventListener("pragmalab:classes", onSync)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener("pragmalab:sync", onSync)
      window.removeEventListener("pragmalab:classes", onSync)
    }
  }, [email])

  useEffect(() => {
    check()
  }, [resources.length])

  return null
}
