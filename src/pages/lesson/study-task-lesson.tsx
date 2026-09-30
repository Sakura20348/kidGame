import { useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowRight02Icon, ArrowUp01Icon, CheckmarkCircle02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

import { MediaView } from "@/components/resources/task-builder"
import { Button } from "@/components/ui/button"
import { shuffle } from "@/data/kids-games"
import { BLANK, gapAccepts, kindInfo, sortWords, type LessonTask } from "@/data/lesson-tasks"
import type { Resource } from "@/data/resources"
import { matchSpoken, targetWords, useListen } from "@/hooks/use-listen"
import { useSpeech } from "@/hooks/use-speech"
import { cn } from "@/lib/utils"

/** Teacher-made tasks for Class 4, in the study style. */
export function StudyTaskLesson({ resource: r, tasks, onFinish }: { resource: Resource; tasks: LessonTask[]; onFinish: (right: number, total: number) => void }) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [checked, setChecked] = useState<null | boolean>(null)
  const [done, setDone] = useState(false)
  const [round, setRound] = useState(0)

  const right = results.filter(Boolean).length
  const progress = Math.round(((results.length) / tasks.length) * 100)

  function onCheck(ok: boolean) {
    setChecked(ok)
    setResults((res) => [...res, ok])
  }

  function next() {
    setChecked(null)
    if (index + 1 >= tasks.length) {
      onFinish(results.filter(Boolean).length, tasks.length)
      setDone(true)
    } else setIndex(index + 1)
  }

  function again() {
    setIndex(0)
    setResults([])
    setChecked(null)
    setDone(false)
    setRound((n) => n + 1)
  }

  return (
    <div className="grid items-start gap-6 @min-[1100px]:grid-cols-[360px_1fr]">
      {/* side panel */}
      <aside className="rounded-[28px] sidebar-glass p-7 text-white @min-[1100px]:sticky @min-[1100px]:top-0">
        <p className="text-sm font-bold tracking-[0.14em] text-white/85 uppercase">
          {r.format} · {r.source} · {r.speaker}
        </p>
        <h1 className="mt-4 font-serif text-[32px] leading-[1.15]">{r.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-[10px] border border-white/15 bg-white/8 px-3 py-2">{r.level}</span>
          <span className="rounded-[10px] border border-white/15 bg-white/8 px-3 py-2">{r.ageGroup}</span>
          <span className="rounded-[10px] border border-white/15 bg-white/8 px-3 py-2">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
        </div>
        <div className="mt-6 flex items-center justify-between text-[15px] font-semibold">
          <span>Progress</span>
          <span className="text-lime">{done ? 100 : progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${done ? 100 : progress}%` }} />
        </div>
        <ol className="mt-5 space-y-1.5">
          {tasks.map((t, i) => (
            <li key={t.id} className={cn("flex items-center gap-3 rounded-[12px] px-3 py-2 text-[15px]", !done && i === index ? "bg-white text-[#173F33]" : "text-white/85")}>
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", results[i] === true ? "bg-lime text-green-900" : results[i] === false ? "bg-[#F0A07A] text-[#4A1D0B]" : !done && i === index ? "bg-lime text-green-900" : "border border-white/25")}>
                {results[i] === true ? "✓" : results[i] === false ? "✗" : i + 1}
              </span>
              {kindInfo(t.kind).name}
            </li>
          ))}
        </ol>
        <div className="mt-5 rounded-[20px] bg-black/20 p-5">
          <p className="text-sm font-bold tracking-[0.14em] text-white/80">SCORE</p>
          <p className="mt-2 font-serif text-5xl leading-none font-bold">
            {right}
            <span className="text-lg font-normal text-white/70">/{tasks.length}</span>
          </p>
        </div>
      </aside>

      {/* task */}
      <section className="@container min-w-0">
        <div className="mb-5">
          <p className="text-sm font-bold tracking-[0.18em] text-muted-foreground">{done ? "FINISHED" : `TASK ${index + 1} OF ${tasks.length}`}</p>
          <h2 className="font-serif text-[30px] leading-tight text-foreground">{done ? "Your result" : kindInfo(tasks[index].kind).title}</h2>
        </div>
        <div className="rounded-[28px] border border-border bg-card p-6 sm:p-9">
          {done ? (
            <div className="py-6 text-center">
              <p className="text-7xl" aria-hidden>
                {right / tasks.length >= 0.9 ? "🏆" : right / tasks.length >= 0.6 ? "🎉" : "🌱"}
              </p>
              <p className="mt-4 font-serif text-6xl font-bold text-foreground">
                {right}
                <span className="text-2xl font-normal text-muted-foreground">/{tasks.length}</span>
              </p>
              <p className="mt-2 text-muted-foreground">Your teacher can see this result in their Student’s library.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button variant="outline" className="h-12 rounded-[14px] px-6 text-base font-bold dark:bg-transparent" onClick={again}>
                  Try again
                </Button>
                <Button className="h-12 gap-2 rounded-[14px] px-6 text-base font-bold" render={<Link to="/discover" />} nativeButton={false}>
                  More lessons
                  <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
                </Button>
              </div>
            </div>
          ) : (
            (() => {
              const t = tasks[index]
              const props = { checked, onCheck, onNext: next, last: index + 1 >= tasks.length }
              return t.kind === "speak" ? <SpeakTask key={`${round}-${t.id}`} task={t} {...props} /> : <StudyTask key={`${round}-${t.id}`} task={t} {...props} />
            })()
          )}
        </div>
      </section>
    </div>
  )
}

// ------------------------------------------------------------ one task

function StudyTask({ task: t, checked, onCheck, onNext, last }: { task: LessonTask; checked: null | boolean; onCheck: (ok: boolean) => void; onNext: () => void; last: boolean }) {
  const [picked, setPicked] = useState<number | null>(null) // choice tasks
  const [tf, setTf] = useState<boolean | null>(null)
  const [typed, setTyped] = useState("")
  const [order, setOrder] = useState<number[]>(() => {
    if (t.kind !== "order") return []
    const idx = t.items.map((_, i) => i)
    let s = shuffle(idx)
    while (s.every((v, i) => v === i) && idx.length > 1) s = shuffle(idx)
    return s
  })
  const [words] = useState(() => (t.kind === "match" ? shuffle(t.pairs.map((p) => p.label)) : []))
  const [links, setLinks] = useState<Record<number, string>>({})
  // sort: all words shuffled, which box each word is in, and the word picked up
  const [sortList] = useState(() => (t.kind === "sort" ? shuffle(sortWords(t)) : []))
  const [placed, setPlaced] = useState<Record<number, number>>({})
  const [holding, setHolding] = useState<number | null>(null)
  const locked = checked !== null
  const sortRight = sortList.filter((w, i) => placed[i] === w.group).length

  // text answers for choice-style tasks
  const choices: string[] | null =
    t.kind === "mcq" || t.kind === "question" || t.kind === "choose" ? t.options : t.kind === "pictures" ? t.options.map((o) => o.label) : null
  const answerIndex = "answer" in t && typeof t.answer === "number" ? t.answer : -1

  const ready =
    choices ? picked !== null : t.kind === "truefalse" ? tf !== null : t.kind === "gap" ? typed.trim() !== "" : t.kind === "match" ? Object.keys(links).length === t.pairs.length : t.kind === "sort" ? Object.keys(placed).length === sortList.length : true

  function check() {
    if (!ready || locked) return
    let ok = false
    if (choices) ok = picked === answerIndex
    else if (t.kind === "truefalse") ok = tf === t.answer
    else if (t.kind === "gap") ok = gapAccepts(t, typed)
    else if (t.kind === "order") ok = order.every((v, i) => v === i)
    else if (t.kind === "match") ok = t.pairs.every((p, i) => links[i] === p.label)
    else if (t.kind === "sort") ok = sortRight === sortList.length
    onCheck(ok)
  }

  const move = (from: number, to: number) =>
    setOrder((o) => {
      if (to < 0 || to >= o.length) return o
      const next = [...o]
      ;[next[from], next[to]] = [next[to], next[from]]
      return next
    })

  const rightText =
    choices ? choices[answerIndex] : t.kind === "truefalse" ? (t.answer ? "True" : "False") : t.kind === "gap" ? t.answers.split("/")[0].trim() : null

  return (
    <div>
      {/* prompt */}
      {"media" in t && (
        <div className="mb-5 flex h-40 w-full max-w-sm items-center justify-center overflow-hidden rounded-[20px] bg-muted/50 text-7xl">
          <MediaView media={t.media} />
        </div>
      )}
      <p className="font-serif text-[26px] leading-snug font-semibold text-foreground">
        {t.kind === "mcq" || t.kind === "question" || t.kind === "pictures"
          ? t.question
          : t.kind === "truefalse"
            ? t.statement
            : t.kind === "order"
              ? t.prompt || "Put these in the right order."
              : t.kind === "match"
                ? "Match each picture with its word."
                : t.kind === "sort"
                  ? t.prompt || "Put each word in the right box."
                : t.kind === "choose"
                  ? t.sentence.replace(BLANK, "_____")
                  : null}
        {t.kind === "gap" && (
          <>
            {t.sentence.split(BLANK)[0]}
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && check()}
              disabled={locked}
              aria-label="Missing word"
              autoFocus
              className={cn(
                "mx-1 inline-block w-40 border-b-2 bg-transparent px-1 text-center font-sans text-[22px] outline-none",
                !locked ? "border-link" : checked ? "border-primary text-primary dark:text-link" : "border-destructive text-destructive"
              )}
            />
            {t.sentence.split(BLANK)[1]}
          </>
        )}
      </p>

      {/* answers */}
      <div className="mt-6">
        {choices && (
          <div className={cn(t.kind === "pictures" ? "grid grid-cols-2 gap-3" : "space-y-3")}>
            {choices.map((c, i) => {
              const right = locked && i === answerIndex
              const wrong = locked && picked === i && i !== answerIndex
              return (
                <button
                  key={i}
                  type="button"
                  disabled={locked}
                  onClick={() => setPicked(i)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-[16px] border px-5 py-4 text-left text-[16px] font-semibold text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    !locked && (picked === i ? "border-link bg-link/8" : "border-border hover:border-link hover:bg-link/5"),
                    right && "border-primary/50 bg-primary/8",
                    wrong && "border-destructive/50 bg-destructive/8",
                    locked && !right && !wrong && "border-border opacity-60"
                  )}
                >
                  {t.kind === "pictures" ? (
                    <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-muted/60 text-3xl">
                      <MediaView media={t.options[i].media} />
                    </span>
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-muted text-sm font-bold">{String.fromCharCode(65 + i)}</span>
                  )}
                  <span className="flex-1">{c}</span>
                  {right && <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5 text-primary dark:text-link" />}
                  {wrong && <HugeiconsIcon icon={Cancel01Icon} className="size-5 text-destructive" />}
                </button>
              )
            })}
          </div>
        )}

        {t.kind === "truefalse" && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((v) => {
              const right = locked && v === t.answer
              const wrong = locked && tf === v && v !== t.answer
              return (
                <button
                  key={String(v)}
                  type="button"
                  disabled={locked}
                  onClick={() => setTf(v)}
                  className={cn(
                    "flex h-20 items-center justify-center gap-2 rounded-[18px] border text-xl font-bold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    !locked && (tf === v ? "border-link bg-link/8 text-foreground" : "border-border text-foreground hover:border-link"),
                    right && "border-primary/50 bg-primary/8 text-primary dark:text-link",
                    wrong && "border-destructive/50 bg-destructive/8 text-destructive",
                    locked && !right && !wrong && "border-border opacity-60"
                  )}
                >
                  {v ? "✓ True" : "✗ False"}
                </button>
              )
            })}
          </div>
        )}

        {t.kind === "order" && (
          <ol className="space-y-2">
            {order.map((item, pos) => (
              <li
                key={item}
                className={cn(
                  "flex items-center gap-3 rounded-[16px] border px-4 py-3",
                  locked ? (item === pos ? "border-primary/50 bg-primary/8" : "border-destructive/50 bg-destructive/8") : "border-border"
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">{pos + 1}</span>
                <span className="flex-1 text-[16px] text-foreground">{t.items[item]}</span>
                {!locked && (
                  <span className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={pos === 0} onClick={() => move(pos, pos - 1)}>
                      <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={pos === order.length - 1} onClick={() => move(pos, pos + 1)}>
                      <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}

        {t.kind === "sort" && (
          <div>
            {/* word bank */}
            <div className="rounded-[18px] border-2 border-dashed border-border p-4">
              <p className="mb-2 text-xs font-bold tracking-[0.14em] text-muted-foreground">
                {locked ? "WORDS" : holding === null ? "TAP A WORD, THEN ITS BOX" : `NOW TAP THE BOX FOR “${sortList[holding].word.toUpperCase()}”`}
              </p>
              <div className="flex min-h-11 flex-wrap gap-2">
                {sortList.map((w, i) =>
                  placed[i] === undefined ? (
                    <button
                      key={i}
                      type="button"
                      disabled={locked}
                      onClick={() => setHolding(holding === i ? null : i)}
                      className={cn(
                        "rounded-full border px-4 py-2 font-serif text-[18px] text-foreground outline-none transition-[transform,background-color,border-color] focus-visible:ring-3 focus-visible:ring-ring/30",
                        holding === i ? "-translate-y-0.5 border-link bg-link/10 shadow-sm" : "border-border bg-card hover:border-link"
                      )}
                    >
                      {w.word}
                    </button>
                  ) : null
                )}
                {Object.keys(placed).length === sortList.length && <span className="self-center text-sm text-muted-foreground">All words are sorted ✓</span>}
              </div>
            </div>

            {/* boxes */}
            <div className={cn("mt-4 grid gap-4", t.groups.length === 3 ? "@min-[700px]:grid-cols-3" : "@min-[560px]:grid-cols-2")}>
              {t.groups.map((g, gi) => (
                <div
                  key={gi}
                  role="button"
                  tabIndex={locked || holding === null ? -1 : 0}
                  aria-label={`Put the word in ${g.name}`}
                  onClick={() => {
                    if (locked || holding === null) return
                    setPlaced((p) => ({ ...p, [holding]: gi }))
                    setHolding(null)
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && !locked && holding !== null) {
                      e.preventDefault()
                      setPlaced((p) => ({ ...p, [holding]: gi }))
                      setHolding(null)
                    }
                  }}
                  className={cn(
                    "min-h-48 rounded-[20px] border-2 border-dashed p-4 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    holding !== null && !locked ? "cursor-pointer border-link bg-link/5 hover:bg-link/10" : "border-border"
                  )}
                >
                  <p className="border-b-2 border-dotted border-border pb-2 text-center font-serif text-[24px] font-semibold text-muted-foreground">{g.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sortList.map((w, i) =>
                      placed[i] === gi ? (
                        <button
                          key={i}
                          type="button"
                          disabled={locked}
                          title={locked ? undefined : "Tap to take it out"}
                          onClick={(e) => {
                            e.stopPropagation()
                            setPlaced((p) => Object.fromEntries(Object.entries(p).filter(([k]) => Number(k) !== i)))
                          }}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 font-serif text-[17px] outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                            !locked
                              ? "border-border bg-muted/60 text-foreground hover:border-destructive/50"
                              : w.group === gi
                                ? "border-primary/40 bg-primary/10 text-primary dark:text-link"
                                : "border-destructive/40 bg-destructive/10 text-destructive"
                          )}
                        >
                          {w.word}
                          {locked && w.group !== gi && <span className="ml-1.5 font-sans text-xs font-semibold">→ {t.groups[w.group].name}</span>}
                        </button>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {t.kind === "match" && (
          <ul className="space-y-2">
            {t.pairs.map((p, i) => (
              <li key={i} className={cn("flex items-center gap-4 rounded-[16px] border px-4 py-3", locked ? (links[i] === p.label ? "border-primary/50 bg-primary/8" : "border-destructive/50 bg-destructive/8") : "border-border")}>
                <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-muted/60 text-3xl">
                  <MediaView media={p.media} />
                </span>
                <span aria-hidden className="text-muted-foreground">→</span>
                <select
                  value={links[i] ?? ""}
                  disabled={locked}
                  onChange={(e) => setLinks((l) => ({ ...l, [i]: e.target.value }))}
                  aria-label={`Word for picture ${i + 1}`}
                  className="h-11 flex-1 rounded-[12px] border border-border bg-field px-3 text-[16px] text-foreground outline-none focus-visible:border-link"
                >
                  <option value="" disabled>
                    Choose a word…
                  </option>
                  {words.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* check / feedback */}
      {checked !== null && (
        <p className={cn("mt-6 rounded-[14px] px-4 py-3 text-[15px]", checked ? "bg-primary/10 text-primary dark:text-link" : "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200")} aria-live="polite">
          {checked
            ? "✓ Correct — well done!"
            : t.kind === "sort"
              ? `Not quite — ${sortRight} of ${sortList.length} words are in the right box. The red ones show where they belong.`
              : rightText
                ? `Not quite. The answer is: ${rightText}`
                : "Not quite — look at the right order / pairs above."}
        </p>
      )}
      <div className="mt-8 flex justify-end border-t border-border pt-6">
        {checked === null ? (
          <Button className="h-12 gap-2 rounded-[14px] px-6 text-base font-bold" disabled={!ready} onClick={check}>
            Check answer
            <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
          </Button>
        ) : (
          <Button className="h-12 gap-2 rounded-[14px] px-6 text-base font-bold" onClick={onNext} autoFocus>
            {last ? "See my result" : "Next task"}
            <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------ "Speak it" (Class 4)

const PASS = 0.8 // share of words that must be said right

/** Listen to the text, then say it into the microphone; every word is marked right or wrong. */
function SpeakTask({
  task: t,
  checked,
  onCheck,
  onNext,
  last,
}: {
  task: Extract<LessonTask, { kind: "speak" }>
  checked: null | boolean
  onCheck: (ok: boolean) => void
  onNext: () => void
  last: boolean
}) {
  const { speak, stop: stopVoice, speaking } = useSpeech()
  const mic = useListen()
  const [typed, setTyped] = useState("") // browsers without speech recognition
  const [tries, setTries] = useState(0)
  const locked = checked !== null
  const words = targetWords(t.text)
  const said = mic.supported ? mic.transcript : typed
  const hits = said ? matchSpoken(t.text, said) : []
  const right = hits.filter(Boolean).length
  const share = words.length ? right / words.length : 0
  const attempted = said.trim() !== "" && !mic.listening

  function toggleMic() {
    if (mic.listening) return mic.stop()
    stopVoice()
    setTries((n) => n + 1)
    mic.start()
  }

  return (
    <div>
      <p className="font-serif text-[26px] leading-snug font-semibold text-foreground">{t.prompt || "Listen, then say it out loud."}</p>

      {/* the text – each word turns green (said) or red (missed) after trying */}
      <div className="mt-5 rounded-[20px] border border-border bg-muted/40 p-5 font-serif text-[22px] leading-[1.9]">
        {words.map((w, i) => (
          <span
            key={i}
            className={cn(
              "mr-1.5 inline-block rounded-md px-1 transition-colors",
              attempted && (hits[i] ? "bg-primary/12 text-primary dark:text-link" : "bg-destructive/12 text-destructive line-through decoration-2")
            )}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="outline" className="h-12 gap-2 rounded-[14px] px-5 text-base font-semibold dark:bg-transparent" disabled={mic.listening} onClick={() => (speaking ? stopVoice() : speak(t.text, 0.9))}>
          {speaking ? "⏹ Stop" : "🔊 Listen"}
        </Button>
        {mic.supported && (
          <Button
            className={cn("h-12 gap-2 rounded-[14px] px-6 text-base font-bold", mic.listening && "animate-pulse bg-destructive hover:bg-destructive/90")}
            disabled={locked}
            onClick={toggleMic}
          >
            {mic.listening ? "⏹ I’m done" : tries ? "🎤 Try again" : "🎤 Speak"}
          </Button>
        )}
        {attempted && (
          <span className={cn("rounded-full px-3 py-1.5 text-sm font-bold", share >= PASS ? "bg-primary/12 text-primary dark:text-link" : "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200")}>
            {right}/{words.length} words · {Math.round(share * 100)}%
          </span>
        )}
      </div>

      {mic.supported ? (
        <p className="mt-4 min-h-6 text-[15px] text-muted-foreground" aria-live="polite">
          {mic.listening ? (
            <>
              <span className="mr-1.5 inline-block size-2.5 animate-pulse rounded-full bg-destructive align-middle" />
              Listening… {mic.transcript && <span className="text-foreground">“{mic.transcript}”</span>}
            </>
          ) : mic.transcript ? (
            <>
              We heard: <span className="text-foreground">“{mic.transcript}”</span>
            </>
          ) : (
            "Press 🎤 Speak, say the text, then press “I’m done”."
          )}
        </p>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">This browser can’t listen to the microphone (try Chrome, Edge or Safari). For now, type what you would say:</p>
          <input
            value={typed}
            disabled={locked}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-2 h-12 w-full rounded-[12px] border border-border bg-field px-3.5 text-[16px] text-foreground outline-none focus-visible:border-link"
          />
        </div>
      )}
      {mic.error && <p className="mt-2 text-sm text-destructive">{mic.error}</p>}

      {checked !== null && (
        <p className={cn("mt-6 rounded-[14px] px-4 py-3 text-[15px]", checked ? "bg-primary/10 text-primary dark:text-link" : "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200")} aria-live="polite">
          {checked
            ? `✓ Great speaking — ${right} of ${words.length} words right!`
            : `Not quite — ${right} of ${words.length} words right. You need ${Math.ceil(words.length * PASS)}. The red words are the ones to practise.`}
        </p>
      )}
      <div className="mt-8 flex justify-end border-t border-border pt-6">
        {checked === null ? (
          <Button className="h-12 gap-2 rounded-[14px] px-6 text-base font-bold" disabled={!attempted} onClick={() => onCheck(share >= PASS)}>
            Check answer
            <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
          </Button>
        ) : (
          <Button className="h-12 gap-2 rounded-[14px] px-6 text-base font-bold" onClick={onNext} autoFocus>
            {last ? "See my result" : "Next task"}
            <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
