import { useEffect, useRef, useState, type DragEvent } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Delete02Icon, File01Icon, FileUploadIcon, SentIcon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { assignments } from "@/data/assignments"
import { findAccount } from "@/lib/accounts"
import { logActivity } from "@/lib/activity"
import { useAuth } from "@/lib/contexts"
import {
  KEEP_FILE_BYTES,
  MAX_FILE_BYTES,
  prettySize,
  readAsDataUrl,
  readSubmissions,
  saveSubmissions,
  type Submission,
  type SubmittedFile,
} from "@/lib/submissions"
import { cn } from "@/lib/utils"

const field =
  "w-full rounded-[12px] border border-border bg-card px-4 text-[16px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-link focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--link)_18%,transparent)] aria-invalid:border-destructive"

export default function SubmitWorkPage() {
  const { email } = useAuth()
  const myAge = findAccount(email)?.ageGroup
  const choices = assignments.filter((a) => !myAge || a.age === myAge)
  const [list, setList] = useState<Submission[]>(() => readSubmissions(email))

  // the teacher opening the work (on their device) arrives through the sync server
  useEffect(() => {
    const onSync = (e: Event) => {
      if (((e as CustomEvent<string[]>).detail ?? []).some((k) => k.includes("submissions"))) setList(readSubmissions(email))
    }
    window.addEventListener("pragmalab:sync", onSync)
    return () => window.removeEventListener("pragmalab:sync", onSync)
  }, [email])
  const [assignment, setAssignment] = useState<string>("other")
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [files, setFiles] = useState<(SubmittedFile & { key: string })[]>([])
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({})
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  async function addFiles(incoming: FileList | null) {
    if (!incoming) return
    const next: (SubmittedFile & { key: string })[] = []
    for (const f of Array.from(incoming)) {
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`${f.name} is too big (max ${prettySize(MAX_FILE_BYTES)}).`)
        continue
      }
      next.push({
        key: `${f.name}-${f.size}-${f.lastModified}`,
        name: f.name,
        size: f.size,
        type: f.type,
        dataUrl: f.size <= KEEP_FILE_BYTES ? await readAsDataUrl(f) : undefined,
      })
    }
    setFiles((cur) => [...cur, ...next.filter((n) => !cur.some((c) => c.key === n.key))].slice(0, 6))
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    void addFiles(e.dataTransfer.files)
  }

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (title.trim().length < 3) errs.title = "Give your work a title (at least 3 letters)."
    if (!text.trim() && files.length === 0) errs.body = "Write something or attach at least one file."
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSending(true)
    // TODO: send to your API so the teacher receives it.
    await new Promise((r) => setTimeout(r, 700))
    const item: Submission = {
      id: `s-${Date.now()}`,
      title: title.trim(),
      assignmentId: assignment === "other" ? null : assignment,
      text: text.trim(),
      files: files.map(({ key: _k, ...f }) => f),
      createdAt: new Date().toISOString(),
      status: "sent",
    }
    const next = [item, ...list]
    const fullyKept = saveSubmissions(email, next)
    setList(next)
    logActivity(email, "assignment")
    setTitle("")
    setText("")
    setFiles([])
    setAssignment("other")
    setSending(false)
    toast.success(fullyKept ? "Your work was sent! 📤" : "Sent! (Big files are listed by name only on this device.)")
  }

  function withdraw(id: string) {
    const next = list.filter((s) => s.id !== id)
    setList(next)
    saveSubmissions(email, next)
    toast("Submission withdrawn")
  }

  return (
    <div>
      <Reveal>
        <h1 className="font-serif text-[36px] leading-[1.15] text-foreground">Submit work</h1>
        <p className="mt-1 text-lg text-muted-foreground">Hand in your writing, photos of your notebook or files for your teacher.</p>
      </Reveal>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        {/* ---------------- form */}
        <Reveal className="rounded-[22px] border border-border bg-card p-6 sm:p-8">
          <form noValidate onSubmit={submit}>
            <label className="block text-sm font-semibold text-foreground">Which assignment is this for?</label>
            <Select value={assignment} onValueChange={(v) => setAssignment((v as string) ?? "other")}>
              <SelectTrigger aria-label="Assignment" className="mt-2 h-12! w-full rounded-[12px] border-border bg-card px-4 text-[16px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-[12px]">
                <SelectItem value="other">📝 Other work</SelectItem>
                {choices.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.emoji} {a.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label htmlFor="sub-title" className="mt-5 block text-sm font-semibold text-foreground">
              Title
            </label>
            <input
              id="sub-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My essay about fast food"
              aria-invalid={!!errors.title}
              className={cn(field, "mt-2 h-12")}
            />
            {errors.title && <p className="mt-1.5 text-sm text-destructive">{errors.title}</p>}

            <div className="mt-5 flex items-end justify-between">
              <label htmlFor="sub-text" className="block text-sm font-semibold text-foreground">
                Your writing
              </label>
              <span className="text-xs text-muted-foreground">{words} words</span>
            </div>
            <textarea
              id="sub-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Type or paste your work here…"
              aria-invalid={!!errors.body}
              className={cn(field, "mt-2 resize-y py-3 leading-relaxed")}
              data-lenis-prevent
            />

            {/* files */}
            <p className="mt-5 text-sm font-semibold text-foreground">Attach files</p>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
              className={cn(
                "mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed px-6 py-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                dragging ? "border-[#2F7BDD] bg-[#3B8BE8]/10" : "border-border hover:border-[#2F7BDD]/60 hover:bg-[#3B8BE8]/5"
              )}
            >
              <HugeiconsIcon icon={FileUploadIcon} className="size-9 text-[#2F7BDD]" />
              <p className="font-medium text-foreground">Drop files here or tap to choose</p>
              <p className="text-sm text-muted-foreground">Photos, PDF or documents · up to {prettySize(MAX_FILE_BYTES)} each · max 6 files</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.txt"
              hidden
              onChange={(e) => {
                void addFiles(e.target.files)
                e.target.value = ""
              }}
            />
            {files.length > 0 && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {files.map((f) => (
                  <li key={f.key} className="flex items-center gap-3 rounded-[12px] border border-border p-2 pr-3">
                    {f.dataUrl && f.type.startsWith("image/") ? (
                      <img src={f.dataUrl} alt="" className="size-12 rounded-lg object-cover" />
                    ) : (
                      <span className="flex size-12 items-center justify-center rounded-lg bg-muted">
                        <HugeiconsIcon icon={File01Icon} className="size-6 text-muted-foreground" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{prettySize(f.size)}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => setFiles((cur) => cur.filter((x) => x.key !== f.key))}
                      className="rounded-full p-1.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {errors.body && <p className="mt-3 text-sm text-destructive">{errors.body}</p>}

            <Button type="submit" disabled={sending} className="mt-6 h-12 gap-2 rounded-[12px] bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8] px-6 text-base font-semibold text-white">
              <HugeiconsIcon icon={SentIcon} className="size-5" />
              {sending ? "Sending…" : "Send to teacher"}
            </Button>
          </form>
        </Reveal>

        {/* ---------------- history */}
        <Reveal delay={100} className="rounded-[22px] border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground">My submissions</h2>
          {list.length === 0 ? (
            <p className="mt-3 text-muted-foreground">Nothing sent yet. Your work will appear here.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {list.map((s) => {
                const a = assignments.find((x) => x.id === s.assignmentId)
                return (
                  <li key={s.id} className="rounded-[16px] border border-border p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden>
                        {a?.emoji ?? "📝"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {a ? a.title : "Other work"} · {new Date(s.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      {s.seenAt ? (
                        <span className="rounded-full bg-[#E4E1FF] px-2.5 py-0.5 text-xs font-semibold text-[#4B3F8F] dark:bg-[#6C63FF]/25 dark:text-[#CFCBFF]" title={`Opened ${new Date(s.seenAt).toLocaleString()}`}>
                          Seen by teacher 👀
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#DDF7EF] px-2.5 py-0.5 text-xs font-semibold text-[#16664A] dark:bg-[#2BC0A4]/20 dark:text-[#8BF0CF]">Sent ✓</span>
                      )}
                    </div>
                    {s.text && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.text}</p>}
                    {s.files.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {s.files.map((f) => (
                          <li key={f.name}>
                            {f.dataUrl ? (
                              <a href={f.dataUrl} download={f.name} className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full bg-muted px-2.5 py-1 text-xs text-foreground hover:underline">
                                📎 {f.name}
                              </a>
                            ) : (
                              <span className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">📎 {f.name}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => withdraw(s.id)}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-destructive outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" /> Withdraw
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Reveal>
      </div>
    </div>
  )
}
