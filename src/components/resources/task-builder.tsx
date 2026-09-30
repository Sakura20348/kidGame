import { useRef, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon, Edit02Icon, ImageUploadIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { audienceFor, BLANK, blankTask, splitWords, CUBE_MAX, CUBE_MIN, cubeNumbers, cubePairs, MISSING_MAX, missingCards, cleanTask, kindInfo, kindsFor, taskProblem, taskSummary, type LessonTask, type TaskKind, type TaskMedia } from "@/data/lesson-tasks"
import { useSpeech } from "@/hooks/use-speech"
import { cn } from "@/lib/utils"

const fieldClass =
  "h-11 rounded-[12px] border border-border bg-field px-3.5 text-[15px] placeholder:text-hint focus-visible:border-link focus-visible:ring-0"

/** Shrinks an uploaded picture so many tasks still fit in storage. */
export function toSmallImage(file: File, max = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("That file isn’t a picture."))
    }
    img.src = url
  })
}

/** Shows a task's picture (uploaded image or emoji). */
export function MediaView({ media, className }: { media: TaskMedia; className?: string }) {
  if (media.image) return <img src={media.image} alt="" className={cn("size-full object-contain", className)} />
  return <span className={cn("leading-none", className)}>{media.emoji || "🖼️"}</span>
}

/** Teacher tool: build the tasks of a project, one design at a time. */
export function TaskBuilder({ tasks, onChange, error, startPicking, ageGroup }: { tasks: LessonTask[]; onChange: (t: LessonTask[]) => void; error?: string; startPicking?: boolean; ageGroup?: string }) {
  // picture designs for Class 0–3, study designs for Class 4
  const audience = audienceFor(ageGroup)
  // with no tasks yet, open straight on the design choice
  const [mode, setMode] = useState<"list" | "pick" | "edit">(startPicking && tasks.length === 0 ? "pick" : "list")
  const [draft, setDraft] = useState<LessonTask | null>(null)

  function save() {
    if (!draft) return
    const problem = taskProblem(draft)
    if (problem) return toast.error(problem)
    const clean = cleanTask(draft)
    onChange(tasks.some((t) => t.id === clean.id) ? tasks.map((t) => (t.id === clean.id ? clean : t)) : [...tasks, clean])
    setDraft(null)
    setMode("list")
  }

  return (
    <div className="rounded-[18px] border border-border p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground">
          Tasks <span className="font-normal text-muted-foreground">· {tasks.length} made</span>
        </p>
        {mode === "list" && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-[10px] dark:bg-transparent" onClick={() => setMode("pick")}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Add task
          </Button>
        )}
      </div>

      {mode === "list" &&
        (tasks.length === 0 ? (
          <p className={cn("mt-3 rounded-[12px] bg-muted/50 px-4 py-3 text-sm", error ? "text-destructive" : "text-muted-foreground")}>
            {error ?? "No tasks yet. Press “Add task” and choose a design — students will do these tasks in the lesson."}
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {tasks.map((t, i) => (
              <li key={t.id} className="flex items-center gap-3 rounded-[12px] bg-muted/50 px-3 py-2.5">
                <span className="text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                <span aria-hidden className="text-xl">
                  {kindInfo(t.kind).emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-muted-foreground">{kindInfo(t.kind).name}</span>
                  <span className="block truncate text-[15px] text-foreground">{taskSummary(t)}</span>
                </span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit task" onClick={() => { setDraft(t); setMode("edit") }}>
                  <HugeiconsIcon icon={Edit02Icon} className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete task" className="hover:text-destructive" onClick={() => onChange(tasks.filter((x) => x.id !== t.id))}>
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </Button>
              </li>
            ))}
          </ol>
        ))}

      {mode === "pick" && (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Choose a design for the new task · {audience === "kid" ? "picture designs for Class 0–3" : `designs for ${ageGroup ?? "older learners"}`}
          </p>
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
            {kindsFor(audience, ageGroup).map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => { setDraft(blankTask(k.kind)); setMode("edit") }}
                className="group rounded-[16px] border border-border p-3 text-left outline-none transition-colors hover:border-link hover:bg-link/5 focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <KindPreview kind={k.kind} />
                <p className="mt-3 font-semibold text-foreground">{k.name}</p>
                <p className="text-sm text-muted-foreground">{k.blurb}</p>
              </button>
            ))}
          </div>
          {tasks.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="mt-3 rounded-[10px]" onClick={() => setMode("list")}>
              Cancel
            </Button>
          )}
        </>
      )}

      {mode === "edit" && draft && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-link">
            {kindInfo(draft.kind).emoji} {kindInfo(draft.kind).name}
          </p>
          <div className="mt-3 space-y-4">
            <TaskEditor task={draft} onChange={setDraft} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="ghost" className="rounded-[10px]" onClick={() => { setDraft(null); setMode("list") }}>
              Cancel
            </Button>
            <Button type="button" className="rounded-[10px] font-bold" onClick={save}>
              Save task
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------ editors

function TaskEditor({ task: t, onChange }: { task: LessonTask; onChange: (t: LessonTask) => void }) {
  switch (t.kind) {
    case "choose":
      return (
        <>
          <MediaInput label="Picture" media={t.media} onChange={(media) => onChange({ ...t, media })} />
          <Labeled label={`Sentence — write ${BLANK} for the missing word`}>
            <Input value={t.sentence} onChange={(e) => onChange({ ...t, sentence: e.target.value })} placeholder={`The park was full of ${BLANK}.`} className={fieldClass} />
          </Labeled>
          <OptionsInput options={t.options} answer={t.answer} max={4} onChange={(options, answer) => onChange({ ...t, options, answer })} placeholder="Word" />
        </>
      )
    case "question":
      return (
        <>
          <MediaInput label="Picture" media={t.media} onChange={(media) => onChange({ ...t, media })} />
          <Labeled label="Question">
            <Input value={t.question} onChange={(e) => onChange({ ...t, question: e.target.value })} placeholder="Which number is this?" className={fieldClass} />
          </Labeled>
          <OptionsInput options={t.options} answer={t.answer} max={4} onChange={(options, answer) => onChange({ ...t, options, answer })} placeholder="Answer" />
        </>
      )
    case "pictures":
      return (
        <>
          <Labeled label="Question">
            <Input value={t.question} onChange={(e) => onChange({ ...t, question: e.target.value })} placeholder="Which one is a fruit?" className={fieldClass} />
          </Labeled>
          <p className="text-sm font-semibold text-foreground">Answers — tap the circle on the right one</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {t.options.map((o, i) => (
              <div key={i} className={cn("rounded-[14px] border p-3", t.answer === i ? "border-primary/60 bg-primary/5" : "border-border")}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                  <RightRadio checked={t.answer === i} onClick={() => onChange({ ...t, answer: i })} />
                </div>
                <MediaInput compact media={o.media} onChange={(media) => onChange({ ...t, options: t.options.map((x, j) => (j === i ? { ...x, media } : x)) })} />
                <Input value={o.label} onChange={(e) => onChange({ ...t, options: t.options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Word" className={cn(fieldClass, "mt-2")} />
              </div>
            ))}
          </div>
        </>
      )
    case "mcq":
      return (
        <>
          <Labeled label="Question">
            <Input value={t.question} onChange={(e) => onChange({ ...t, question: e.target.value })} placeholder="What is the speaker’s main argument?" className={fieldClass} />
          </Labeled>
          <OptionsInput options={t.options} answer={t.answer} max={4} onChange={(options, answer) => onChange({ ...t, options, answer })} placeholder="Answer" />
        </>
      )
    case "truefalse":
      return (
        <>
          <Labeled label="Statement">
            <Input value={t.statement} onChange={(e) => onChange({ ...t, statement: e.target.value })} placeholder="The speaker grew up in Nigeria." className={fieldClass} />
          </Labeled>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-foreground">The statement is…</p>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => onChange({ ...t, answer: v })}
                  className={cn("h-11 flex-1 rounded-[12px] border text-[15px] font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/30", t.answer === v ? "border-primary bg-primary/10 text-primary dark:text-link" : "border-border text-muted-foreground")}
                >
                  {v ? "✓ True" : "✗ False"}
                </button>
              ))}
            </div>
          </div>
        </>
      )
    case "gap":
      return (
        <>
          <Labeled label={`Sentence — write ${BLANK} for the missing word`}>
            <Input value={t.sentence} onChange={(e) => onChange({ ...t, sentence: e.target.value })} placeholder={`Stereotypes are not untrue, but they are ${BLANK}.`} className={fieldClass} />
          </Labeled>
          <Labeled label="Right answer — separate other accepted answers with /">
            <Input value={t.answers} onChange={(e) => onChange({ ...t, answers: e.target.value })} placeholder="incomplete / not complete" className={fieldClass} />
          </Labeled>
        </>
      )
    case "order":
      return (
        <>
          <Labeled label="Instruction (optional)">
            <Input value={t.prompt} onChange={(e) => onChange({ ...t, prompt: e.target.value })} placeholder="Put the events of the story in order." className={fieldClass} />
          </Labeled>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-foreground">Items in the RIGHT order — students get them mixed up</p>
            <div className="space-y-2">
              {t.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-right text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <Input value={item} onChange={(e) => onChange({ ...t, items: t.items.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`Step ${i + 1}`} className={cn(fieldClass, "flex-1")} />
                  {t.items.length > 3 && (
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => onChange({ ...t, items: t.items.filter((_, j) => j !== i) })}>
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {t.items.length < 8 && (
              <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5 rounded-[10px] dark:bg-transparent" onClick={() => onChange({ ...t, items: [...t.items, ""] })}>
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                Add item
              </Button>
            )}
          </div>
        </>
      )
    case "cube":
      return <CubeEditor task={t} onChange={onChange} />
    case "missing":
      return <MissingEditor task={t} onChange={onChange} />
    case "speak":
      return <SpeakEditor task={t} onChange={onChange} />
    case "sort":
      return (
        <>
          <Labeled label="Instruction">
            <Input value={t.prompt} onChange={(e) => onChange({ ...t, prompt: e.target.value })} placeholder="Sort the adverbs and adjectives." className={fieldClass} />
          </Labeled>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-foreground">Boxes — a name and its words, separated by commas</p>
            <div className="space-y-2.5">
              {t.groups.map((g, i) => (
                <div key={i} className="rounded-[14px] border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={g.name}
                      onChange={(e) => onChange({ ...t, groups: t.groups.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                      placeholder={`Box ${i + 1}, e.g. Nouns`}
                      className={cn(fieldClass, "flex-1 font-semibold")}
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">{splitWords(g.words).length} words</span>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove box" disabled={t.groups.length <= 2} onClick={() => onChange({ ...t, groups: t.groups.filter((_, j) => j !== i) })}>
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                    </Button>
                  </div>
                  <textarea
                    value={g.words}
                    onChange={(e) => onChange({ ...t, groups: t.groups.map((x, j) => (j === i ? { ...x, words: e.target.value } : x)) })}
                    rows={2}
                    placeholder="quickly, slowly, happily"
                    aria-label={`Words for ${g.name || `box ${i + 1}`}`}
                    className="mt-2 w-full resize-none rounded-[10px] border border-border bg-field px-3 py-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-link"
                  />
                </div>
              ))}
            </div>
            {t.groups.length < 3 && (
              <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5 rounded-[10px] dark:bg-transparent" onClick={() => onChange({ ...t, groups: [...t.groups, { name: "", words: "" }] })}>
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
                Add box
              </Button>
            )}
            <p className="mt-2 text-sm text-muted-foreground">Students see all the words mixed up and put each one in its box.</p>
          </div>
        </>
      )
    case "match":
      return (
        <>
          <p className="text-sm font-semibold text-foreground">Pairs — a picture and its word</p>
          <div className="space-y-2">
            {t.pairs.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-[14px] border border-border p-2.5">
                <MediaInput compact media={p.media} onChange={(media) => onChange({ ...t, pairs: t.pairs.map((x, j) => (j === i ? { ...x, media } : x)) })} />
                <span aria-hidden className="text-muted-foreground">↔</span>
                <Input value={p.label} onChange={(e) => onChange({ ...t, pairs: t.pairs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Word" className={cn(fieldClass, "flex-1")} />
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove pair" disabled={t.pairs.length <= 2} onClick={() => onChange({ ...t, pairs: t.pairs.filter((_, j) => j !== i) })}>
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          {t.pairs.length < 5 && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-[10px] dark:bg-transparent" onClick={() => onChange({ ...t, pairs: [...t.pairs, { label: "", media: {} }] })}>
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Add pair
            </Button>
          )}
        </>
      )
  }
}

function CubeEditor({ task: t, onChange }: { task: Extract<LessonTask, { kind: "cube" }>; onChange: (t: LessonTask) => void }) {
  const ok = !!cubePairs(t.numbers, t.target)
  const cells = [0, 1, 2, 3, -1, 4, 5, 6, 7]
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <Labeled label={`Number to make (${CUBE_MIN}–${CUBE_MAX})`}>
          <Input
            type="number"
            min={CUBE_MIN}
            max={CUBE_MAX}
            value={t.target}
            onChange={(e) => {
              const target = Math.max(CUBE_MIN, Math.min(CUBE_MAX, Math.round(Number(e.target.value) || CUBE_MIN)))
              // new target → new numbers that fit it
              onChange({ ...t, target, numbers: cubeNumbers(target) })
            }}
            className={cn(fieldClass, "w-32 text-lg font-bold")}
          />
        </Labeled>
        <Button type="button" variant="outline" className="h-11 gap-1.5 rounded-[10px] dark:bg-transparent" onClick={() => onChange({ ...t, numbers: cubeNumbers(t.target) })}>
          🎲 New numbers
        </Button>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground">The cube — 8 numbers that make 4 pairs of {t.target} (you can change them)</p>
        <div className="grid w-[210px] grid-cols-3 gap-1.5 rounded-[12px] border-2 border-foreground/70 p-1.5">
          {cells.map((c, k) =>
            c === -1 ? (
              <span key={k} className="flex aspect-square items-center justify-center text-3xl font-bold text-foreground">
                +
              </span>
            ) : (
              <input
                key={k}
                type="number"
                min={0}
                max={t.target}
                aria-label={`Number ${c + 1}`}
                value={Number.isNaN(t.numbers[c]) ? "" : t.numbers[c]}
                onChange={(e) => onChange({ ...t, numbers: t.numbers.map((n, j) => (j === c ? (e.target.value === "" ? Number.NaN : Math.round(Number(e.target.value))) : n)) })}
                className="aspect-square w-full [appearance:textfield] rounded-[8px] border border-border bg-field text-center text-2xl font-bold text-foreground outline-none focus-visible:border-link [&::-webkit-inner-spin-button]:appearance-none"
              />
            )
          )}
        </div>
        <p className={cn("mt-2 text-sm", ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          {ok
            ? `✓ ${cubePairs(t.numbers, t.target)!.map(([a, b]) => `${t.numbers[a]} + ${t.numbers[b]}`).join(" · ")}`
            : `These numbers don’t make 4 pairs of ${t.target} yet.`}
        </p>
      </div>
    </>
  )
}

function SpeakEditor({ task: t, onChange }: { task: Extract<LessonTask, { kind: "speak" }>; onChange: (t: LessonTask) => void }) {
  const { speak, stop, speaking } = useSpeech()
  const count = t.text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length
  return (
    <>
      <Labeled label="Instruction">
        <Input value={t.prompt} onChange={(e) => onChange({ ...t, prompt: e.target.value })} placeholder="Listen to the podcast line, then say it out loud." className={fieldClass} />
      </Labeled>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground">What students say — a sentence or a short part of the podcast</p>
        <textarea
          value={t.text}
          onChange={(e) => onChange({ ...t, text: e.target.value })}
          rows={3}
          placeholder="The best way to learn a language is to use it every single day."
          aria-label="Text to say"
          className="w-full resize-none rounded-[12px] border border-border bg-field px-3.5 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-link"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className={cn("text-sm", count > 60 ? "text-destructive" : "text-muted-foreground")}>{count} words · students need 80% of them right</span>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-[10px] dark:bg-transparent" disabled={count === 0} onClick={() => (speaking ? stop() : speak(t.text, 0.9))}>
            {speaking ? "⏹ Stop" : "🔊 Hear it"}
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Students hear it (🔊), then press 🎤 and say it. Each word turns green when it was said right, red when it was missed.</p>
      </div>
    </>
  )
}

function MissingEditor({ task: t, onChange }: { task: Extract<LessonTask, { kind: "missing" }>; onChange: (t: LessonTask) => void }) {
  const [max, setMax] = useState(10)
  const num = (v: string) => (v === "" ? Number.NaN : Math.round(Number(v)))
  const setCard = (i: number, card: { a: number; total: number }) => onChange({ ...t, cards: t.cards.map((c, j) => (j === i ? card : c)) })
  const field = "h-10 w-14 [appearance:textfield] rounded-[8px] border border-border bg-field text-center text-lg font-bold text-foreground outline-none focus-visible:border-link [&::-webkit-inner-spin-button]:appearance-none"
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <Labeled label="Numbers up to">
          <div className="flex gap-1.5">
            {[10, 15, 20].map((m) => (
              <Button key={m} type="button" variant={max === m ? "default" : "outline"} className="h-10 rounded-[10px] dark:bg-transparent data-[on=true]:dark:bg-primary" data-on={max === m} onClick={() => setMax(m)}>
                {m}
              </Button>
            ))}
          </div>
        </Labeled>
        <Button type="button" variant="outline" className="h-10 gap-1.5 rounded-[10px] dark:bg-transparent" onClick={() => onChange({ ...t, cards: missingCards(t.cards.length || 6, max) })}>
          🎲 New cards
        </Button>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-foreground">Cards — the box is worked out for you (you can change the numbers)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {t.cards.map((c, i) => {
            const answer = c.total - c.a
            const ok = Number.isInteger(answer) && answer > 0
            return (
              <div key={i} className="flex items-center gap-2 rounded-[12px] border border-border p-2 text-lg font-bold text-foreground">
                <input type="number" min={0} max={MISSING_MAX} aria-label={`Card ${i + 1} first number`} value={Number.isNaN(c.a) ? "" : c.a} onChange={(e) => setCard(i, { ...c, a: num(e.target.value) })} className={field} />
                <span>+</span>
                <span className={cn("flex h-10 min-w-10 items-center justify-center rounded-[8px] border-2 border-dashed px-1.5 text-base", ok ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-destructive text-destructive")}>{ok ? answer : "?"}</span>
                <span>=</span>
                <input type="number" min={1} max={MISSING_MAX} aria-label={`Card ${i + 1} total`} value={Number.isNaN(c.total) ? "" : c.total} onChange={(e) => setCard(i, { ...c, total: num(e.target.value) })} className={field} />
                <Button type="button" variant="ghost" size="icon-sm" className="ml-auto" aria-label="Remove card" disabled={t.cards.length <= 1} onClick={() => onChange({ ...t, cards: t.cards.filter((_, j) => j !== i) })}>
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </Button>
              </div>
            )
          })}
        </div>
        {t.cards.length < 8 && (
          <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5 rounded-[10px] dark:bg-transparent" onClick={() => onChange({ ...t, cards: [...t.cards, ...missingCards(1, max)] })}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Add card
          </Button>
        )}
        <p className="mt-2 text-sm text-muted-foreground">Each card also shows the take-away line, e.g. 7 + ☐ = 10 and 10 − ☐ = 7.</p>
      </div>
    </>
  )
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  )
}

function RightRadio({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label="Right answer"
      title="Right answer"
      onClick={onClick}
      className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/30", checked ? "border-primary" : "border-border")}
    >
      {checked && <span className="size-3 rounded-full bg-primary" />}
    </button>
  )
}

function OptionsInput({ options, answer, max, placeholder, onChange }: { options: string[]; answer: number; max: number; placeholder: string; onChange: (o: string[], answer: number) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-foreground">{placeholder}s — tap the circle on the right one</p>
      <div className="space-y-2">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <RightRadio checked={answer === i} onClick={() => onChange(options, i)} />
            <Input value={o} onChange={(e) => onChange(options.map((x, j) => (j === i ? e.target.value : x)), answer)} placeholder={`${placeholder} ${i + 1}`} className={cn(fieldClass, "flex-1")} />
            {options.length > 2 && (
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => onChange(options.filter((_, j) => j !== i), answer === i ? 0 : answer > i ? answer - 1 : answer)}>
                <HugeiconsIcon icon={Delete02Icon} className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {options.length < max && (
        <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5 rounded-[10px] dark:bg-transparent" onClick={() => onChange([...options, ""], answer)}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          Add {placeholder.toLowerCase()}
        </Button>
      )}
    </div>
  )
}

/** Emoji or uploaded picture. */
function MediaInput({ label, media, compact, onChange }: { label?: string; media: TaskMedia; compact?: boolean; onChange: (m: TaskMedia) => void }) {
  const file = useRef<HTMLInputElement>(null)
  return (
    <div className={cn(!compact && "block")}>
      {label && <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>}
      <div className={cn("flex items-center gap-2", compact && "mt-2")}>
        <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#DDEEFB] dark:bg-white/10", compact ? "size-14 text-3xl" : "size-20 text-5xl")}>
          <MediaView media={media} />
        </span>
        <Input
          value={media.image ? "" : (media.emoji ?? "")}
          onChange={(e) => onChange({ emoji: e.target.value.slice(0, 8) })}
          placeholder={media.image ? "Picture added" : "Emoji 🐶"}
          aria-label="Emoji"
          className={cn(fieldClass, compact ? "w-24" : "w-32")}
        />
        <Button type="button" variant="outline" size="sm" className="h-11 gap-1.5 rounded-[12px] dark:bg-transparent" onClick={() => file.current?.click()}>
          <HugeiconsIcon icon={ImageUploadIcon} className="size-4" />
          {compact ? "" : "Upload"}
          <span className="sr-only">Upload a picture</span>
        </Button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ""
            if (!f) return
            try {
              onChange({ image: await toSmallImage(f) })
            } catch (err) {
              toast.error((err as Error).message)
            }
          }}
        />
      </div>
    </div>
  )
}

// ------------------------------------------------------------ design previews (look like the student screens)

function KindPreview({ kind }: { kind: TaskKind }) {
  const box = "rounded-[8px] bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:bg-white/15"
  const sbox = "rounded-[6px] bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:bg-white/15"
  const kid = kindInfo(kind).audience === "kid"
  return (
    <div className={cn("flex h-28 flex-col gap-1.5 rounded-[12px] p-2.5", kid ? "bg-linear-to-b from-[#E4F1FC] to-[#D3E7F8] dark:from-white/10 dark:to-white/5" : "bg-linear-to-b from-[#EEF4F0] to-[#DFEAE3] dark:from-white/8 dark:to-white/4")}>
      {kind === "choose" && (
        <>
          <div className={cn(box, "flex flex-1 flex-col items-center justify-center text-2xl")}>
            🌳<span className="mt-0.5 h-1 w-16 rounded-full bg-[#9FB6CC]" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className={cn(box, "h-5")} />
            <div className={cn(box, "h-5 ring-2 ring-[#3CC37A]")} />
          </div>
        </>
      )}
      {kind === "question" && (
        <>
          <div className={cn(box, "flex h-12 items-center justify-center text-2xl")}>✌️</div>
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn(box, "flex items-center justify-end px-1.5")}>
                <span className={cn("size-2.5 rounded-full border-2", i === 3 ? "border-[#4A7FD4] bg-[#4A7FD4]" : "border-[#B8C7D6]")} />
              </div>
            ))}
          </div>
        </>
      )}
      {kind === "pictures" && (
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          {["🍎", "🚗", "🐶", "🌙"].map((e, i) => (
            <div key={e} className={cn(box, "flex items-center justify-center text-lg", i === 0 && "ring-2 ring-[#4A7FD4]")}>
              {e}
            </div>
          ))}
        </div>
      )}
      {kind === "mcq" && (
        <>
          <div className={cn(sbox, "h-4 w-3/4")} />
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn(sbox, "flex h-5 items-center gap-1.5 px-1.5", i === 1 && "ring-2 ring-[#2F7BDD]")}>
              <span className="size-2.5 rounded-[3px] bg-[#C9D6CF]" />
              <span className="h-1 w-12 rounded-full bg-[#C9D6CF]" />
            </div>
          ))}
        </>
      )}
      {kind === "truefalse" && (
        <>
          <div className={cn(sbox, "flex h-10 items-center px-2")}>
            <span className="h-1.5 w-full rounded-full bg-[#C9D6CF]" />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            <div className={cn(sbox, "flex items-center justify-center text-xs font-bold text-[#2F7BDD] ring-2 ring-[#2F7BDD]")}>✓ True</div>
            <div className={cn(sbox, "flex items-center justify-center text-xs font-bold text-[#8A9A92]")}>✗ False</div>
          </div>
        </>
      )}
      {kind === "gap" && (
        <div className={cn(sbox, "flex flex-1 flex-wrap content-center items-center gap-1 px-2")}>
          <span className="h-1.5 w-10 rounded-full bg-[#C9D6CF]" />
          <span className="h-1.5 w-6 rounded-full bg-[#C9D6CF]" />
          <span className="rounded-[3px] border-b-2 border-[#2F7BDD] px-1 text-[10px] font-semibold text-[#2F7BDD]">typed</span>
          <span className="h-1.5 w-8 rounded-full bg-[#C9D6CF]" />
          <span className="h-1.5 w-12 rounded-full bg-[#C9D6CF]" />
        </div>
      )}
      {kind === "order" && (
        <>
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn(sbox, "flex h-6 items-center gap-1.5 px-1.5")}>
              <span className="flex size-3.5 items-center justify-center rounded-full bg-[#DCE8E1] text-[8px] font-bold text-[#2F7BDD]">{i}</span>
              <span className="h-1 flex-1 rounded-full bg-[#C9D6CF]" />
              <span className="text-[8px] text-[#8A9A92]">↕</span>
            </div>
          ))}
        </>
      )}
      {kind === "speak" && (
        <>
          <div className={cn(sbox, "flex flex-wrap items-center gap-1 px-2 py-1.5 text-[9px] font-semibold")}>
            {["The", "best", "way", "to", "learn"].map((w, i) => (
              <span key={w} className={cn("rounded-[3px] px-1", i === 2 ? "bg-[#FDE2E2] text-[#C0392B] line-through" : "bg-[#DCEBFB] text-[#1F5FBF]")}>
                {w}
              </span>
            ))}
          </div>
          <div className="flex flex-1 items-center justify-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#1F5FBF] text-sm text-white shadow">🎙️</span>
            <span className="flex h-6 items-end gap-0.5">
              {[3, 6, 10, 5, 8, 4, 7].map((h, i) => (
                <span key={i} className="w-1 rounded-full bg-[#5A9CEB]" style={{ height: h * 2 }} />
              ))}
            </span>
            <span className="rounded-full bg-[#DCEBFB] px-1.5 text-[9px] font-bold text-[#1F5FBF]">80%</span>
          </div>
        </>
      )}
      {kind === "sort" && (
        <>
          <div className={cn(sbox, "flex flex-wrap items-center justify-center gap-1 px-1.5 py-1")}>
            {["quickly", "large", "fresh", "sadly"].map((w) => (
              <span key={w} className="rounded-full bg-[#DCE8E1] px-1.5 text-[8px] font-semibold text-[#2F5E4A]">
                {w}
              </span>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            {["Adverbs", "Adjectives"].map((g, i) => (
              <div key={g} className={cn(sbox, "flex flex-col items-center gap-1 border border-dashed border-[#9DB5A8] p-1")}>
                <span className="text-[8px] font-bold text-[#6B8579]">{g}</span>
                <span className="rounded-full bg-[#CFEBDD] px-1.5 text-[8px] font-semibold text-[#2F7BDD]">{i ? "fluffy" : "slowly"}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {kind === "missing" && (
        <div className="relative grid flex-1 grid-cols-2 gap-1.5">
          {[
            [7, 10],
            [5, 7],
            [9, 14],
            [4, 7],
          ].map(([a, t], i) => (
            <div key={i} className={cn(box, "flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold text-[#1F2A37] dark:text-white")}>
              <span className="flex items-center gap-0.5">
                {a}+<span className={cn("inline-block h-2.5 w-3 rounded-[2px] border border-[#44607A]", i === 0 && "border-[#3CC37A] bg-[#E4F8EA]")} />={t}
              </span>
              <span className="flex items-center gap-0.5">
                {t}−<span className="inline-block h-2.5 w-3 rounded-[2px] border border-[#44607A]" />={a}
              </span>
            </div>
          ))}
          <span aria-hidden className="absolute -top-2 -right-1 text-base">
            🚀
          </span>
        </div>
      )}
      {kind === "cube" && (
        <div className="flex flex-1 items-center justify-center gap-2.5">
          <div className="grid size-[74px] grid-cols-3 gap-0.5 rounded-[6px] border-2 border-[#44607A] bg-white p-0.5 text-[11px] font-bold text-[#1F2A37] shadow-[3px_-3px_0_#B6D4EE] dark:bg-white/15 dark:text-white">
            {["5", "7", "2", "8", "+", "6", "3", "4", "5"].map((n, i) => (
              <span key={i} className={cn("flex items-center justify-center rounded-[3px]", i !== 4 && "bg-[#EEF5FC] dark:bg-white/10", (i === 0 || i === 8) && "ring-1 ring-[#3CC37A]")}>
                {n}
              </span>
            ))}
          </div>
          <div className="space-y-1 text-[10px] font-bold text-[#44607A] dark:text-white/80">
            {["5+5", "", ""].map((v, i) => (
              <div key={i} className="flex items-center gap-0.5">
                <span className={cn(box, "flex h-3.5 w-4 items-center justify-center text-[8px]")}>{v.split("+")[0]}</span>+<span className={cn(box, "flex h-3.5 w-4 items-center justify-center text-[8px]")}>{v.split("+")[1]}</span>=10
              </div>
            ))}
          </div>
        </div>
      )}
      {kind === "match" && (
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          {["🐱", "cat", "🐶", "dog"].map((e, i) => (
            <div key={e} className={cn(box, "flex items-center justify-center text-sm font-semibold text-[#44607A]", i === 1 && "ring-2 ring-[#3CC37A]")}>
              {e}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
