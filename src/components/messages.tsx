import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Message01Icon, Notification03Icon, SentIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { classStudents } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"
import { formatDate } from "@/lib/format"
import { deleteMessage, isRead, markAllRead, noticesFor, readCount, readSentMessages, sendMessage, unreadCount } from "@/lib/messages"
import { cn } from "@/lib/utils"

/** Re-renders when messages or papers change here or arrive from another device. */
function useMessagesTick() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    const onSync = (e: Event) => {
      const keys = (e as CustomEvent<string[]>).detail ?? []
      if (keys.some((k) => k.includes("messages") || k.includes("papers") || k.includes("classes"))) bump()
    }
    window.addEventListener("pragmalab:messages", bump)
    window.addEventListener("pragmalab:papers", bump)
    window.addEventListener("pragmalab:sync", onSync)
    return () => {
      window.removeEventListener("pragmalab:messages", bump)
      window.removeEventListener("pragmalab:papers", bump)
      window.removeEventListener("pragmalab:sync", onSync)
    }
  }, [])
  return tick
}

const MAX_LENGTH = 500

// =================================================================== teacher

/** Teacher's top-bar button: write a message to the whole class or one student. */
export function TeacherMessageButton({ className }: { className?: string }) {
  const { email } = useAuth()
  useMessagesTick()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [to, setTo] = useState<"all" | string>("all")
  const students = classStudents(email)
  const sent = readSentMessages(email)

  function send() {
    if (!email || !text.trim()) return
    sendMessage(email, text, to)
    const who = to === "all" ? `your class (${students.length})` : (students.find((s) => s.id === to)?.name ?? to)
    toast.success(`Message sent to ${who}`)
    setText("")
  }

  return (
    <>
      <Button variant="ghost" aria-label="Message students" title="Message students" className={className} onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={Message01Icon} className="size-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[88svh] max-w-[calc(100%-2rem)] flex-col rounded-[24px] bg-card p-6 sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Message your students</DialogTitle>
            <DialogDescription>Students see it in their 🔔 notifications.</DialogDescription>
          </DialogHeader>

          <label className="mt-2 text-sm font-semibold text-foreground" htmlFor="msg-to">
            To
          </label>
          <select
            id="msg-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-[12px] border border-border bg-field px-3 text-[15px] outline-none focus-visible:border-link"
          >
            <option value="all">👥 Whole class ({students.length})</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                🧑‍🎓 {s.name}
              </option>
            ))}
          </select>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send()
            }}
            rows={4}
            autoFocus
            placeholder="e.g. Don’t forget: the Unit 3 test is on Monday. Good luck! 🍀"
            aria-label="Message"
            className="mt-3 w-full resize-none rounded-[12px] border border-border bg-field px-3.5 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-link"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {text.length}/{MAX_LENGTH} · Ctrl + Enter to send
            </span>
            <Button className="gap-2 rounded-[10px] font-bold" disabled={!text.trim() || students.length === 0} onClick={send}>
              <HugeiconsIcon icon={SentIcon} className="size-4" /> Send
            </Button>
          </div>
          {students.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No students yet – share your class code from the Team page.</p>}

          <p className="mt-5 text-sm font-semibold text-foreground">Sent ({sent.length})</p>
          <ul className="-mx-1 mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-1">
            {sent.length === 0 && <li className="rounded-[14px] bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">No messages yet.</li>}
            {sent.map((m) => {
              const r = readCount(email, m)
              return (
                <li key={m.id} className="rounded-[14px] bg-muted/50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <p className="min-w-0 flex-1 text-[15px] whitespace-pre-line text-foreground">{m.text}</p>
                    <button
                      type="button"
                      aria-label="Delete message"
                      onClick={() => email && deleteMessage(email, m.id)}
                      className="shrink-0 rounded-md p-1 text-muted-foreground outline-none hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {m.to === "all" ? "Whole class" : (students.find((s) => s.id === m.to)?.name ?? m.to)} · {formatDate(m.sentAt)} ·{" "}
                    <span className={r.read === r.total && r.total > 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                      ✓ read by {r.read}/{r.total}
                    </span>
                  </p>
                </li>
              )
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}

// =================================================================== student

/** Student's 🔔: messages from the teacher and new test papers, with an unread count. */
export function StudentBell({ className }: { className?: string }) {
  const { email } = useAuth()
  useMessagesTick()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  // what was unread when the list was opened stays highlighted while it's open
  const [fresh, setFresh] = useState<string[]>([])
  const notices = noticesFor(email)
  const unread = unreadCount(email)

  function show() {
    setFresh(notices.filter((n) => !isRead(email, n.id)).map((n) => n.id))
    markAllRead(email)
    setOpen(true)
  }

  return (
    <>
      <Button variant="ghost" aria-label={unread ? `Notifications: ${unread} new` : "Notifications"} className={cn("relative", className)} onClick={show}>
        <HugeiconsIcon icon={Notification03Icon} className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5484D] px-1 text-[11px] font-bold text-white ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85svh] max-w-[calc(100%-2rem)] flex-col rounded-[24px] bg-card p-6 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Notifications</DialogTitle>
            <DialogDescription>Messages and test papers from your teacher.</DialogDescription>
          </DialogHeader>
          <ul className="-mx-1 mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-1">
            {notices.length === 0 && (
              <li className="rounded-[16px] bg-muted/50 px-4 py-10 text-center">
                <p className="text-4xl" aria-hidden>
                  🔕
                </p>
                <p className="mt-2 font-semibold text-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground">When your teacher sends a message, it shows up here.</p>
              </li>
            )}
            {notices.map((n) => {
              const isNew = fresh.includes(n.id)
              const body = (
                <>
                  <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-xl">
                    {n.kind === "paper" ? "📕" : n.personal ? "💌" : "📣"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      {n.title}
                      {isNew && <span className="rounded-full bg-[#E5484D] px-1.5 py-px text-[10px] font-bold text-white">NEW</span>}
                    </span>
                    <span className="mt-0.5 block text-[15px] whitespace-pre-line text-foreground">{n.text}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDate(n.at)}
                      {n.link && " · tap to download"}
                    </span>
                  </span>
                </>
              )
              const cls = cn("flex w-full gap-3 rounded-[16px] px-3.5 py-3 text-left", isNew ? "bg-link/10 ring-1 ring-link/30" : "bg-muted/50")
              return (
                <li key={n.id}>
                  {n.link ? (
                    <button
                      type="button"
                      className={cn(cls, "outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40")}
                      onClick={() => {
                        setOpen(false)
                        navigate(n.link!)
                      }}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}
