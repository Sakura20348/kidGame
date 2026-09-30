import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { CloudUploadIcon, Delete02Icon, Download04Icon, FileAttachmentIcon, SentIcon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { EmptyState } from "@/components/resources/section"
import { Button } from "@/components/ui/button"
import { classStudents } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"
import { formatDate } from "@/lib/format"
import { downloadCount, downloadPaper, fileKind, MAX_PAPER_BYTES, readPapers, savePapers, type TestPaper } from "@/lib/papers"
import { prettySize, readAsDataUrl } from "@/lib/submissions"
import { cn } from "@/lib/utils"

/** Teachers upload a test paper and send it to the whole class; students download it. */
export default function TestPapersPage() {
  const { email } = useAuth()
  const [papers, setPapers] = useState(() => readPapers(email))
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const students = classStudents(email).length

  // download counts change when students download (synced from other devices)
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  function pick(f: File | undefined) {
    if (!f) return
    if (f.size > MAX_PAPER_BYTES) {
      toast.error(`“${f.name}” is ${prettySize(f.size)}. Please choose a file up to ${prettySize(MAX_PAPER_BYTES)}.`)
      return
    }
    setFile(f)
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "))
  }

  async function send() {
    if (!email || !file || !title.trim()) return
    setSending(true)
    try {
      const paper: TestPaper = {
        id: `paper-${Date.now()}`,
        title: title.trim(),
        note: note.trim(),
        file: { name: file.name, size: file.size, type: file.type, dataUrl: await readAsDataUrl(file) },
        sentAt: new Date().toISOString(),
      }
      const next = [paper, ...papers]
      if (!savePapers(email, next)) {
        toast.error("There isn’t enough space for this file. Delete an old paper or choose a smaller file.")
        return
      }
      setPapers(next)
      setTitle("")
      setNote("")
      setFile(null)
      toast.success(`“${paper.title}” was sent to ${students} ${students === 1 ? "student" : "students"}`)
    } finally {
      setSending(false)
    }
  }

  function remove(p: TestPaper) {
    if (!email) return
    const next = papers.filter((x) => x.id !== p.id)
    savePapers(email, next)
    setPapers(next)
    toast(`“${p.title}” was removed. Students can’t download it any more.`)
  }

  const kind = file ? fileKind(file.type, file.name) : null

  return (
    <div className="w-full">
      <Reveal>
        <h1 className="text-[40px] leading-tight font-medium text-foreground @min-[700px]:text-[48px]">Test papers</h1>
        <p className="mt-1 text-lg text-muted-foreground">Upload a test or worksheet and send it to your class. Students download it from their Settings.</p>
      </Reveal>

      <div className="mt-6 grid gap-6 @min-[1100px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @min-[1100px]:items-start">
        {/* ---------------------------------------------------------------- upload */}
        <Reveal as="section" delay={80} className="rounded-[24px] border border-border bg-card p-6">
          <p className="text-lg font-semibold text-foreground">Send a new paper</p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pick(e.dataTransfer.files[0])
            }}
            className={cn(
              "mt-4 flex w-full flex-col items-center gap-2 rounded-[18px] border-2 border-dashed px-4 py-8 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
              dragging ? "border-link bg-link/8" : "border-border hover:border-link/50 hover:bg-muted/40"
            )}
          >
            {file && kind ? (
              <>
                <span className="text-5xl" aria-hidden>
                  {kind.emoji}
                </span>
                <span className="max-w-full truncate font-semibold text-foreground">{file.name}</span>
                <span className="text-sm text-muted-foreground">
                  {kind.label} · {prettySize(file.size)} · click to change
                </span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon={CloudUploadIcon} className="size-10 text-link" />
                <span className="font-semibold text-foreground">Drop a file here or click to choose</span>
                <span className="text-sm text-muted-foreground">PDF, Word, slides or pictures · up to {prettySize(MAX_PAPER_BYTES)}</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.odt,.rtf,.ppt,.pptx,.xls,.xlsx,.csv,.txt,image/*"
            onChange={(e) => {
              pick(e.target.files?.[0])
              e.target.value = ""
            }}
          />

          <label className="mt-5 block text-sm font-semibold text-foreground" htmlFor="paper-title">
            Title
          </label>
          <input
            id="paper-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unit 3 test – Past Simple"
            className="mt-1.5 h-12 w-full rounded-[12px] border border-border bg-field px-3.5 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-link"
          />
          <label className="mt-4 block text-sm font-semibold text-foreground" htmlFor="paper-note">
            Note for students <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="paper-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Print it and bring it on Monday. You have 40 minutes."
            className="mt-1.5 w-full resize-none rounded-[12px] border border-border bg-field px-3.5 py-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-link"
          />

          <Button className="mt-5 h-12 w-full gap-2 rounded-[12px] text-base font-bold" disabled={!file || !title.trim() || sending} onClick={send}>
            <HugeiconsIcon icon={SentIcon} className="size-5" />
            {sending ? "Sending…" : `Send to my class (${students})`}
          </Button>
          {students === 0 && <p className="mt-2 text-center text-sm text-muted-foreground">No students yet – share your class code from the Team page.</p>}
        </Reveal>

        {/* ---------------------------------------------------------------- sent */}
        <Reveal as="section" delay={140} className="rounded-[24px] border border-border bg-card p-6">
          <p className="text-lg font-semibold text-foreground">
            Sent papers <span className="font-normal text-muted-foreground">({papers.length})</span>
          </p>
          {papers.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={FileAttachmentIcon} title="No papers sent yet" message="Papers you send appear here, with how many students downloaded them." />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {papers.map((p) => {
                const k = fileKind(p.file.type, p.file.name)
                const got = downloadCount(email, p.id)
                return (
                  <li key={p.id} className="flex flex-col gap-3 rounded-[18px] border border-border bg-field p-4 @min-[600px]:flex-row @min-[600px]:items-center">
                    <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-card text-3xl">
                      {k.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{p.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {p.file.name} · {prettySize(p.file.size)} · sent {formatDate(p.sentAt)}
                      </p>
                      {p.note && <p className="mt-1 line-clamp-2 text-sm text-foreground/80">“{p.note}”</p>}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${students ? (got / students) * 100 : 0}%` }} />
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {got}/{students} downloaded
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 rounded-[8px] dark:bg-transparent" onClick={() => downloadPaper(p)}>
                        <HugeiconsIcon icon={Download04Icon} className="size-4" />
                        Open
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 rounded-[8px] text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(p)}>
                        <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                        Remove
                      </Button>
                    </div>
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
