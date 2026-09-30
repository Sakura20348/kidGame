import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, Download04Icon, File01Icon, Mail01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { assignments } from "@/data/assignments"
import { isStudentId } from "@/lib/accounts"
import { useAuth } from "@/lib/contexts"
import { formatDate } from "@/lib/format"
import { classSubmissions, markSeen, prettySize, type InboxItem } from "@/lib/submissions"
import { cn } from "@/lib/utils"

const titleOf = (s: InboxItem) => assignments.find((a) => a.id === s.assignmentId)?.title ?? "Other work"

/** Teacher's ✉ button: work students sent with "Submit work", with a count of new ones. */
export function InboxButton({ className }: { className?: string }) {
  const { email } = useAuth()
  const [items, setItems] = useState(() => classSubmissions(email))
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<InboxItem | null>(null)

  // new work can arrive from students' devices (sync server) at any time
  useEffect(() => {
    const refresh = () => setItems(classSubmissions(email))
    const onSync = (e: Event) => {
      const keys = (e as CustomEvent<string[]>).detail ?? []
      if (keys.some((k) => k.includes("submissions") || k.includes("classes"))) refresh()
    }
    const openInbox = () => setOpen(true) // e.g. the dashboard's "Open inbox" button
    window.addEventListener("pragmalab:open-inbox", openInbox)
    window.addEventListener("pragmalab:sync", onSync)
    window.addEventListener("pragmalab:submissions", refresh)
    window.addEventListener("pragmalab:classes", refresh)
    return () => {
      window.removeEventListener("pragmalab:open-inbox", openInbox)
      window.removeEventListener("pragmalab:sync", onSync)
      window.removeEventListener("pragmalab:submissions", refresh)
      window.removeEventListener("pragmalab:classes", refresh)
    }
  }, [email])

  const unseen = items.filter((s) => !s.seenAt).length

  function openItem(s: InboxItem) {
    markSeen(s.student.id, s.id)
    setCurrent({ ...s, seenAt: s.seenAt ?? new Date().toISOString() })
  }

  return (
    <>
      <Button
        variant="ghost"
        aria-label={unseen ? `Student work, ${unseen} new` : "Student work"}
        title="Work your students sent"
        className={cn("relative", className)}
        onClick={() => {
          setItems(classSubmissions(email))
          setCurrent(null)
          setOpen(true)
        }}
      >
        <HugeiconsIcon icon={Mail01Icon} className="size-5" />
        {unseen > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF4D6D] px-1 text-[11px] font-bold text-white ring-2 ring-card">
            {unseen > 9 ? "9+" : unseen}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85svh] max-w-[calc(100%-2rem)] flex-col rounded-[28px] bg-card p-6 sm:max-w-[600px]">
          {current ? (
            <>
              <DialogHeader>
                <button type="button" onClick={() => setCurrent(null)} className="mb-1 flex w-fit items-center gap-1.5 text-sm font-semibold text-link hover:underline">
                  <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
                  All work
                </button>
                <DialogTitle className="text-2xl">{current.title}</DialogTitle>
                <DialogDescription>
                  {current.student.name}
                  {isStudentId(current.student.id) && ` · ID ${current.student.id}`} · {titleOf(current)} · {formatDate(current.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="-mx-1 mt-2 min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
                {current.text ? (
                  <p className="rounded-[16px] bg-muted/50 p-4 text-[16px] leading-relaxed whitespace-pre-wrap text-foreground">{current.text}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No message.</p>
                )}
                {current.files.length > 0 && (
                  <ul className="space-y-2">
                    {current.files.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-[14px] border border-border px-3 py-2.5">
                        <HugeiconsIcon icon={File01Icon} className="size-5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium text-foreground">{f.name}</span>
                          <span className="text-xs text-muted-foreground">{prettySize(f.size)}</span>
                        </span>
                        {f.dataUrl ? (
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-[10px] dark:bg-transparent" render={<a href={f.dataUrl} download={f.name} />} nativeButton={false}>
                            <HugeiconsIcon icon={Download04Icon} className="size-4" />
                            Open
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Too big to keep</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Student work 📬</DialogTitle>
                <DialogDescription>{unseen ? `${unseen} new · ` : ""}Everything your class sent with “Submit work”.</DialogDescription>
              </DialogHeader>
              {items.length === 0 ? (
                <p className="mt-2 rounded-[16px] bg-muted/50 p-5 text-sm text-muted-foreground">Nothing yet. When students send work from “Submit work”, it arrives here.</p>
              ) : (
                <ul className="-mx-1 mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 pb-1">
                  {items.map((s) => (
                    <li key={`${s.student.id}-${s.id}`}>
                      <button
                        type="button"
                        onClick={() => openItem(s)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-[16px] px-4 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30",
                          s.seenAt ? "bg-muted/40" : "bg-link/8"
                        )}
                      >
                        <span className={cn("mt-2 size-2.5 shrink-0 rounded-full", s.seenAt ? "bg-transparent" : "bg-[#FF4D6D]")} aria-label={s.seenAt ? undefined : "New"} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className={cn("truncate text-[15px] text-foreground", !s.seenAt && "font-semibold")}>{s.student.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
                          </span>
                          <span className={cn("block truncate text-[15px] text-foreground", !s.seenAt && "font-semibold")}>{s.title}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {titleOf(s)}
                            {s.files.length > 0 && ` · 📎 ${s.files.length}`}
                            {s.text && ` · ${s.text}`}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
