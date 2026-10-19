import { useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ImageUploadIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TaskBuilder, toSmallImage } from "@/components/resources/task-builder"
import type { LessonTask } from "@/data/lesson-tasks"
import { cardColors, normalizeTopic, resourceFilters, type Resource } from "@/data/resources"
import { useProjects } from "@/lib/contexts"
import { cn } from "@/lib/utils"
import { bandForGrade, classesIn } from "@/lib/accounts"
import { curriculum, curriculumTopic, readingSkills } from "@/data/curriculum"

type Form = {
  title: string
  description: string
  level: string
  ageGroup: string
  topic: string
  format: Resource["format"]
  skills: string[]
  source: string
  speaker: string
  taskList: LessonTask[]
  color: string
  image?: string
}

const emptyForm: Form = {
  title: "",
  description: "",
  level: resourceFilters.levels[0], // A1 – most learners here are young beginners
  ageGroup: resourceFilters.ageGroups[0],
  topic: curriculum[0].name,
  format: "Video",
  skills: [...curriculum[0].skills],
  source: "",
  speaker: "",
  taskList: [],
  color: cardColors.mint,
}

type Errors = Partial<Record<keyof Form, string>>

/** Step 1: the card details. */
function validateDetails(f: Form): Errors {
  const e: Errors = {}
  if (!f.title.trim()) e.title = "Enter a project name"
  if (!f.description.trim()) e.description = "Add a short description"
  if (!f.source.trim()) e.source = "Enter the source (e.g. TED)"
  return e
}

/** Step 2: the tasks. */
function validateTasks(f: Form): Errors {
  if (f.taskList.length === 0) return { taskList: "Add at least one task for your students." }
  if (f.taskList.length > 20) return { taskList: "Use at most 20 tasks." }
  return {}
}

const fieldClass =
  "h-12 rounded-[12px] border border-border bg-field px-3.5 text-[15px] placeholder:text-hint focus-visible:border-link focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-0"

/** A saved project turned back into the form (for editing). */
const formFrom = (r: Resource): Form => ({
  title: r.title,
  description: r.description,
  level: r.level,
  // older projects were for a range ("Class 0–3"): the form picks its first class
  ageGroup: classesIn(r.ageGroup).length === 1 ? r.ageGroup : bandForGrade(classesIn(r.ageGroup)[0] ?? 0),
  topic: normalizeTopic(r.topic),
  format: r.format,
  skills: r.skills,
  source: r.source,
  speaker: r.speaker === "—" ? "" : r.speaker,
  taskList: r.taskList ?? [],
  color: r.color,
  image: r.image,
})

export function NewProjectDialog({
  open,
  onOpenChange,
  edit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** a project to edit; without it the form creates a new one */
  edit?: Resource
}) {
  const { addProject, updateProject } = useProjects()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>(() => (edit ? formFrom(edit) : emptyForm))
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState<1 | 2>(1)
  const coverRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setForm(edit ? formFrom(edit) : emptyForm)
      setErrors({})
      setStep(1)
    }
  }

  function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (step === 1) {
      const next = validateDetails(form)
      setErrors(next)
      if (Object.keys(next).length === 0) setStep(2)
      return
    }
    const next = validateTasks(form)
    setErrors(next)
    if (Object.keys(next).length) return

    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      level: form.level,
      ageGroup: form.ageGroup,
      topic: form.topic,
      format: form.format,
      skills: form.skills,
      source: form.source.trim(),
      speaker: form.speaker.trim() || "—",
      tasks: form.taskList.length,
      taskList: form.taskList,
      image: form.image,
      color: form.color,
    }
    if (edit) {
      updateProject(edit.id, data)
      close(false)
      toast.success(`“${data.title}” was saved`)
      return
    }
    const project = addProject(data)
    close(false)
    toast(`Project “${project.title}” created`)
    navigate("/dashboard/lessons")
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={cn("max-h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-[28px] bg-card p-6 sm:p-8", step === 1 ? "sm:max-w-[640px]" : "sm:max-w-[820px]")}>
        <DialogHeader>
          <p className="text-[13px] font-extrabold tracking-[0.14em] text-link">NEW PROJECT</p>
          <DialogTitle className="font-serif text-[30px] leading-tight font-normal text-foreground">
            {step === 1 ? (edit ? "Edit project" : "Create a learning resource") : `Tasks for “${form.title.trim()}”`}
          </DialogTitle>
          <DialogDescription className="text-[15px] text-muted-foreground">
            {step === 1 ? "First the card details, then the tasks your students will do." : "Choose a design for each task and fill it in. Students do them in this order."}
          </DialogDescription>
          {/* steps */}
          <ol className="mt-3 flex items-center gap-2 text-sm font-semibold">
            {["Details", "Tasks"].map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-8 bg-border" />}
                <span className={cn("flex size-7 items-center justify-center rounded-full text-xs", step === i + 1 ? "bg-primary text-primary-foreground" : step > i + 1 ? "bg-primary/15 text-primary dark:text-link" : "bg-muted text-muted-foreground")}>
                  {step > i + 1 ? "✓" : i + 1}
                </span>
                <span className={step === i + 1 ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </li>
            ))}
          </ol>
        </DialogHeader>

        <form
          noValidate
          onSubmit={onSubmit}
          // on the Tasks step, Enter in a task field shouldn't create the project
          onKeyDown={(e) => {
            if (step === 2 && e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault()
          }}
          className="mt-2 min-w-0 space-y-5"
        >
          {step === 1 ? (
          <>
          {/* Card header preview + color */}
          <div
            className="relative flex h-28 items-end overflow-hidden rounded-[18px] p-4"
            style={{ backgroundColor: form.color }}
          >
            {form.image ? (
              <img src={form.image} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 hidden bg-black/55 dark:block" />
                <div className="absolute -top-16 -right-12 size-44 rounded-full border border-white/40" />
              </>
            )}
            {/* cover picture (top-right) */}
            <div className="absolute top-3 right-3 flex gap-2">
              {form.image && (
                <Button type="button" size="sm" variant="secondary" className="h-9 rounded-full bg-white/90 px-3 text-green-900 hover:bg-white" onClick={() => set("image", undefined)}>
                  Remove
                </Button>
              )}
              <Button type="button" size="sm" variant="secondary" className="h-9 gap-1.5 rounded-full bg-white/90 px-3.5 text-green-900 shadow-sm hover:bg-white" onClick={() => coverRef.current?.click()}>
                <HugeiconsIcon icon={ImageUploadIcon} className="size-4" />
                {form.image ? "Change picture" : "Add picture"}
              </Button>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ""
                  if (!f) return
                  try {
                    set("image", await toSmallImage(f, 800))
                  } catch (err) {
                    toast.error((err as Error).message)
                  }
                }}
              />
            </div>
            <div className="relative flex gap-2">
              {Object.entries(cardColors).map(([name, color]) => (
                <button
                  key={name}
                  type="button"
                  aria-label={`${name} color`}
                  aria-pressed={form.color === color}
                  onClick={() => set("color", color)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 border-white/80 text-green-900 shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-white/60",
                    form.color === color && "border-green-900 dark:border-white"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {form.color === color && <HugeiconsIcon icon={Tick02Icon} className="size-4" />}
                </button>
              ))}
            </div>
          </div>

          <Field label="Project name" error={errors.title}>
            <Input
              autoFocus
              value={form.title}
              aria-invalid={!!errors.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. My Family – read family words"
              className={fieldClass}
            />
          </Field>

          <Field label="Description" error={errors.description}>
            <Textarea
              value={form.description}
              aria-invalid={!!errors.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What will pupils read and practise? e.g. Read the names of family members and short sentences about a family."
              className={cn(fieldClass, "h-auto min-h-24 py-3")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Level">
              <Choice value={form.level} options={resourceFilters.levels} onChange={(v) => set("level", v)} />
            </Field>
            <Field label="Class">
              <Choice value={form.ageGroup} options={resourceFilters.ageGroups} onChange={(v) => set("ageGroup", v)} />
            </Field>
            <Field label="Topic">
              <Choice
                value={form.topic}
                options={resourceFilters.topics}
                onChange={(v) => {
                  // a new topic brings its own reading skills (they can still be changed below)
                  setForm((f) => ({ ...f, topic: v, skills: [...(curriculumTopic(v)?.skills ?? f.skills)] }))
                }}
              />
            </Field>
            <Field label="Format">
              <Choice
                value={form.format}
                options={resourceFilters.formats}
                onChange={(v) => set("format", v as Resource["format"])}
              />
            </Field>
            <Field label="Source" error={errors.source}>
              <Input
                value={form.source}
                aria-invalid={!!errors.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder="e.g. Kids’ English, Unit 1"
                className={fieldClass}
              />
            </Field>
            <Field label="Speaker / author">
              <Input
                value={form.speaker}
                onChange={(e) => set("speaker", e.target.value)}
                placeholder="e.g. Ms Karimova"
                className={fieldClass}
              />
            </Field>
          </div>

          {/* what the topic is for, from the curriculum */}
          <TopicPlan topic={form.topic} skills={form.skills} onSkills={(skills) => set("skills", skills)} />
          </>
          ) : (
            <TaskBuilder tasks={form.taskList} onChange={(t) => set("taskList", t)} error={errors.taskList} startPicking ageGroup={form.ageGroup} />
          )}

          <DialogFooter className="-mx-0 -mb-0 border-none bg-transparent p-0 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-[12px] px-5 font-bold dark:bg-transparent"
              onClick={() => (step === 2 ? setStep(1) : close(false))}
            >
              {step === 2 ? "← Back" : "Cancel"}
            </Button>
            <Button type="submit" className="h-12 rounded-[12px] px-6 font-bold">
              {step === 1
                ? edit
                  ? "Next: tasks →"
                  : "Next: add tasks →"
                : `${edit ? "Save changes" : "Create project"} (${form.taskList.length} ${form.taskList.length === 1 ? "task" : "tasks"})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** The topic's expected learning outcomes and the reading skills the lesson builds. */
function TopicPlan({ topic, skills, onSkills }: { topic: string; skills: string[]; onSkills: (s: string[]) => void }) {
  const plan = curriculumTopic(topic)
  return (
    <div className="rounded-[16px] border border-border bg-muted/40 p-4">
      {plan && (
        <>
          <p className="text-sm font-bold text-foreground">
            {plan.emoji} Expected learning outcomes · {plan.name}
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
            {plan.outcomes.map((o) => (
              <li key={o} className="flex gap-2">
                <span aria-hidden className="text-link">
                  •
                </span>
                {o}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className={cn("text-sm font-bold text-foreground", plan && "mt-4")}>Reading skills</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {readingSkills.map((sk) => {
          const on = skills.includes(sk)
          return (
            <button
              key={sk}
              type="button"
              aria-pressed={on}
              onClick={() => onSkills(on ? skills.filter((x) => x !== sk) : [...skills, sk])}
              className={cn(
                "h-9 rounded-full border px-3.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                on ? "border-link bg-link/12 text-link" : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {on ? "✓ " : ""}
              {sk}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <Label className="mb-2 text-sm font-bold text-foreground">{label}</Label>
      {children}
      {error && <p className="mt-1.5 ml-1 text-[13px] text-destructive">{error}</p>}
    </div>
  )
}

function Choice({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as string)}>
      <SelectTrigger className="h-12! w-full rounded-[12px] border-border bg-field px-3.5 text-[15px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-[12px]">
        {options.map((o) => (
          <SelectItem key={o} value={o} className="rounded-lg text-[15px]">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
