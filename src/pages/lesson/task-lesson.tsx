import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, ArrowRight02Icon } from "@hugeicons/core-free-icons"

import { MediaView } from "@/components/resources/task-builder"
import { shuffle } from "@/data/kids-games"
import { BLANK, cubePairs, kindInfo, type KidTask } from "@/data/lesson-tasks"
import { useSpeech } from "@/hooks/use-speech"
import { cn } from "@/lib/utils"

const HEARTS = 5

/** Plays the tasks a teacher built for a project (the "Choose / Which one / Pictures / Match" designs). */
export function TaskLesson({ tasks, onFinish }: { tasks: KidTask[]; onFinish: (right: number, total: number) => void }) {
  const [index, setIndex] = useState(0)
  const [right, setRight] = useState(0)
  const [hearts, setHearts] = useState(HEARTS)
  const [checked, setChecked] = useState<null | boolean>(null) // result of "Check answer"
  const [done, setDone] = useState(false)
  const [round, setRound] = useState(0) // bump to restart
  const { speak, stop } = useSpeech()

  useEffect(() => stop, [stop])

  const task = tasks[index]

  function onChecked(ok: boolean) {
    setChecked(ok)
    if (ok) setRight((n) => n + 1)
    else setHearts((h) => Math.max(0, h - 1))
  }

  function next() {
    stop()
    setChecked(null)
    if (index + 1 >= tasks.length) {
      onFinish(right, tasks.length)
      setDone(true)
    } else setIndex(index + 1)
  }

  function again() {
    setIndex(0)
    setRight(0)
    setHearts(HEARTS)
    setChecked(null)
    setDone(false)
    setRound((n) => n + 1)
  }

  return (
    <div className="mx-auto max-w-[640px] font-kids">
      <div className="relative overflow-hidden rounded-[32px] bg-linear-to-b from-[#EAF4FD] to-[#D5E8F8] p-4 text-[#1F2A37] shadow-[0_8px_24px_rgba(40,90,140,0.12)] sm:p-6 dark:from-[#1B2733] dark:to-[#15202B] dark:text-white">
        {/* top bar */}
        <div className="flex items-center gap-3">
          <Link to="/discover" aria-label="Back to lessons" className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-[0_2px_0_rgba(0,0,0,0.06)] dark:bg-white/10">
            <HugeiconsIcon icon={ArrowLeft02Icon} className="size-5" />
          </Link>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/80 dark:bg-white/10" aria-label={`Task ${Math.min(index + 1, tasks.length)} of ${tasks.length}`}>
            <div
              className="h-full rounded-full bg-linear-to-r from-[#59B7F2] to-[#2F8FDB] transition-[width] duration-500"
              style={{ width: `${((done ? tasks.length : index + (checked !== null ? 1 : 0)) / tasks.length) * 100}%` }}
            />
          </div>
          <span className="flex h-11 items-center gap-1.5 rounded-full bg-white px-3.5 font-semibold shadow-[0_2px_0_rgba(0,0,0,0.06)] dark:bg-white/10" aria-label={`${hearts} hearts left`}>
            <span className="text-[#FF4D6D]">❤</span> {hearts}
          </span>
        </div>

        {done ? (
          <Finished right={right} total={tasks.length} hearts={hearts} onAgain={again} />
        ) : (
          task && (
            task.kind === "cube" ? (
              <CubeView key={`${round}-${task.id}`} task={task} checked={checked} onCheck={onChecked} onNext={next} speak={speak} />
            ) : task.kind === "missing" ? (
              <MissingView key={`${round}-${task.id}`} task={task} checked={checked} onCheck={onChecked} onNext={next} speak={speak} />
            ) : (
              <TaskView key={`${round}-${task.id}`} task={task} checked={checked} onCheck={onChecked} onNext={next} speak={speak} />
            )
          )
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------ one task

type ViewProps = {
  task: Exclude<KidTask, { kind: "cube" | "missing" }>
  checked: null | boolean
  onCheck: (ok: boolean) => void
  onNext: () => void
  speak: (text: string) => void
}

function TaskView({ task: t, checked, onCheck, onNext, speak }: ViewProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const [hidden, setHidden] = useState<number[]>([]) // wrong answers removed by the hint
  // match: shuffled words, and which word each picture is joined to
  const [order] = useState(() => (t.kind === "match" ? shuffle(t.pairs.map((_, i) => i)) : []))
  const [leftSel, setLeftSel] = useState<number | null>(null)
  const [links, setLinks] = useState<Record<number, number>>({})
  const locked = checked !== null

  const answer = t.kind === "match" ? -1 : t.answer
  const optionCount = t.kind === "match" ? 0 : t.options.length
  const spoken =
    t.kind === "choose" ? t.sentence.replace(BLANK, "blank") : t.kind === "match" ? t.pairs.map((p) => p.label).join(", ") : t.question

  function hint() {
    if (locked) return
    if (t.kind === "match") {
      // join one correct pair
      const free = t.pairs.findIndex((_, i) => links[i] !== i)
      if (free >= 0) setLinks((l) => ({ ...Object.fromEntries(Object.entries(l).filter(([, v]) => v !== free)), [free]: free }))
      return
    }
    const wrong = Array.from({ length: optionCount }, (_, i) => i).filter((i) => i !== answer && !hidden.includes(i) && i !== picked)
    if (wrong.length > 1) setHidden([...hidden, wrong[Math.floor(Math.random() * wrong.length)]])
  }

  function linkWord(word: number) {
    if (locked || leftSel === null) return
    setLinks((l) => {
      const next = Object.fromEntries(Object.entries(l).filter(([, v]) => v !== word)) as Record<number, number>
      next[leftSel] = word
      return next
    })
    setLeftSel(null)
  }

  const ready = t.kind === "match" ? Object.keys(links).length === t.pairs.length : picked !== null
  function check() {
    if (!ready || locked) return
    onCheck(t.kind === "match" ? t.pairs.every((_, i) => links[i] === i) : picked === answer)
  }

  const optionState = (i: number) => (!locked ? (picked === i ? "picked" : "idle") : i === answer ? "right" : picked === i ? "wrong" : "idle")

  return (
    <div className="mt-5">
      <h2 className="text-2xl font-bold sm:text-3xl">{kindInfo(t.kind).title}</h2>

      {/* picture + sentence / question */}
      {(t.kind === "choose" || t.kind === "question") && (
        <div className="mt-4 rounded-[26px] bg-white p-5 text-center shadow-[0_2px_0_rgba(0,0,0,0.04)] dark:bg-white/5">
          <div className="mx-auto flex aspect-[4/3] max-h-56 w-full items-center justify-center overflow-hidden rounded-[20px] bg-[#E3F0FB] text-[110px] dark:bg-white/5">
            <MediaView media={t.media} />
          </div>
          {t.kind === "choose" ? (
            <p className="mt-4 text-xl leading-relaxed">
              {t.sentence.split(BLANK)[0]}
              <span className={cn("mx-1 inline-block min-w-16 border-b-2 px-1 font-bold", locked ? (checked ? "border-[#3CC37A] text-[#23A060]" : "border-[#FF5E7E] text-[#E0405F]") : "border-[#4A7FD4] text-[#2F6BD0]")}>
                {picked !== null ? t.options[picked] : " "}
              </span>
              {t.sentence.split(BLANK)[1]}
            </p>
          ) : (
            <p className="mt-4 text-2xl font-semibold">{t.question}</p>
          )}
        </div>
      )}
      {t.kind === "pictures" && <p className="mt-3 text-xl font-semibold">{t.question}</p>}
      {t.kind === "match" && <p className="mt-1 text-base opacity-70">Tap a picture, then its word.</p>}

      {/* speaker + hint */}
      <div className="mt-4 flex justify-center gap-3">
        {[
          { label: "Listen", emoji: "🔊", onClick: () => speak(spoken) },
          { label: "Hint", emoji: "💡", onClick: hint },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            title={b.label}
            onClick={b.onClick}
            disabled={b.label === "Hint" && locked}
            className="flex size-14 items-center justify-center rounded-[16px] bg-[#3A9BE0] text-2xl shadow-[0_4px_0_#2476B8] outline-none transition-transform active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#3A9BE0]/40 disabled:opacity-50"
          >
            {b.emoji}
          </button>
        ))}
      </div>

      {/* answers */}
      {t.kind === "choose" && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {t.options.map((o, i) => (
            <AnswerButton key={i} state={optionState(i)} hidden={hidden.includes(i)} disabled={locked} onClick={() => setPicked(i)}>
              {o}
            </AnswerButton>
          ))}
        </div>
      )}
      {t.kind === "question" && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {t.options.map((o, i) => (
            <AnswerButton key={i} state={optionState(i)} hidden={hidden.includes(i)} disabled={locked} onClick={() => setPicked(i)} radio>
              {o}
            </AnswerButton>
          ))}
        </div>
      )}
      {t.kind === "pictures" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {t.options.map((o, i) => (
            <AnswerButton key={i} state={optionState(i)} hidden={hidden.includes(i)} disabled={locked} onClick={() => setPicked(i)} radio tall>
              <span className="flex h-28 w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#E3F0FB] text-6xl dark:bg-white/5">
                <MediaView media={o.media} />
              </span>
              <span className="mt-2 block">{o.label}</span>
            </AnswerButton>
          ))}
        </div>
      )}
      {t.kind === "match" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="space-y-3">
            {t.pairs.map((p, i) => {
              const linked = links[i] !== undefined
              const wrongLink = locked && links[i] !== i
              return (
                <button
                  key={i}
                  type="button"
                  disabled={locked}
                  onClick={() => setLeftSel(leftSel === i ? null : i)}
                  className={cn(
                    "flex h-20 w-full items-center justify-center overflow-hidden rounded-[16px] border-2 bg-white text-5xl outline-none transition-colors dark:bg-white/5",
                    leftSel === i ? "border-[#4A7FD4]" : locked ? (wrongLink ? "border-[#FF5E7E]" : "border-[#3CC37A]") : linked ? "border-[#9BC7EE]" : "border-transparent"
                  )}
                >
                  <MediaView media={p.media} />
                  {linked && <span className="ml-2 rounded-full bg-[#E3F0FB] px-2 py-0.5 text-sm font-semibold text-[#2F6BD0]">{t.pairs[links[i]].label}</span>}
                </button>
              )
            })}
          </div>
          <div className="space-y-3">
            {order.map((w) => {
              const used = Object.values(links).includes(w)
              return (
                <button
                  key={w}
                  type="button"
                  disabled={locked || leftSel === null}
                  onClick={() => linkWord(w)}
                  className={cn(
                    "flex h-20 w-full items-center justify-center rounded-[16px] border-2 bg-white px-3 text-lg font-semibold outline-none transition-colors dark:bg-white/5",
                    used ? "border-[#9BC7EE] text-[#2F6BD0]" : "border-transparent",
                    leftSel !== null && !locked && "hover:border-[#4A7FD4]"
                  )}
                >
                  {t.pairs[w].label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* check / result sheet */}
      <ResultSheet checked={checked} ready={ready} onCheck={check} onNext={onNext}>
        {!checked && t.kind !== "match" && (
          <p className="relative mt-1 text-lg">
            The answer is <b>{t.kind === "pictures" ? t.options[t.answer].label : t.options[t.answer]}</b>
          </p>
        )}
      </ResultSheet>
    </div>
  )
}

/** "Check answer" button, then the green/red sheet with Continue. */
function ResultSheet({ checked, ready, onCheck, onNext, children }: { checked: null | boolean; ready: boolean; onCheck: () => void; onNext: () => void; children?: ReactNode }) {
  if (checked === null)
    return (
      <button
        type="button"
        disabled={!ready}
        onClick={onCheck}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-[#4A7FD4] text-lg font-semibold text-white shadow-[0_4px_0_#3563AE] outline-none transition-[transform,opacity] active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#4A7FD4]/40 disabled:opacity-50"
      >
        Check answer
        <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
      </button>
    )
  return (
    <div className={cn("relative -mx-4 -mb-4 mt-6 animate-in rounded-t-[32px] px-6 pt-8 pb-6 text-center fade-in-0 slide-in-from-bottom-4 sm:-mx-6 sm:-mb-6", checked ? "bg-[#E4F8EA] dark:bg-[#1D3A2A]" : "bg-[#FDE8EC] dark:bg-[#3A1D25]")}>
      {/* cloud edge */}
      <span aria-hidden className="absolute -top-4 left-0 flex w-full justify-around">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className={cn("size-9 rounded-full", checked ? "bg-[#E4F8EA] dark:bg-[#1D3A2A]" : "bg-[#FDE8EC] dark:bg-[#3A1D25]")} />
        ))}
      </span>
      <p className="relative text-5xl" aria-hidden>
        {checked ? "🎉" : "😅"}
      </p>
      <p className="relative mt-2 text-3xl font-bold" aria-live="polite">
        {checked ? "Nice…" : "Not quite!"}
      </p>
      {children}
      <button
        type="button"
        onClick={onNext}
        autoFocus
        className={cn(
          "relative mt-5 flex h-14 w-full items-center justify-center rounded-[16px] text-lg font-semibold text-white outline-none transition-transform active:translate-y-1 focus-visible:ring-4",
          checked ? "bg-[#27C26C] shadow-[0_4px_0_#1C9A54] focus-visible:ring-[#27C26C]/40" : "bg-[#F0506E] shadow-[0_4px_0_#C73954] focus-visible:ring-[#F0506E]/40"
        )}
      >
        Continue
      </button>
    </div>
  )
}

// ------------------------------------------------------------ "Make 10!" number cube

type CubeTask = Extract<KidTask, { kind: "cube" }>

/** Tap two numbers in the cube that make the target; 4 pairs fill the “☐ + ☐ = 10” rows. */
function CubeView({ task: t, checked, onCheck, onNext, speak }: Omit<ViewProps, "task"> & { task: CubeTask }) {
  const [sel, setSel] = useState<number | null>(null)
  const [rows, setRows] = useState<[number, number][]>([])
  const [mistakes, setMistakes] = useState(0)
  const [shake, setShake] = useState<number | null>(null)
  const locked = checked !== null
  const used = rows.flat()
  const ready = rows.length === 4

  function tap(i: number) {
    if (locked || used.includes(i)) return
    if (sel === null || sel === i) return setSel(sel === i ? null : i)
    if (t.numbers[sel] + t.numbers[i] === t.target) {
      setRows((r) => [...r, [sel, i]])
      setSel(null)
    } else {
      setMistakes((m) => m + 1)
      setShake(i)
      setTimeout(() => setShake(null), 450)
      setSel(null)
    }
  }

  // 💡 fills one right pair for you
  function hint() {
    if (locked) return
    const pair = cubePairs(t.numbers, t.target)?.find(([a, b]) => !used.includes(a) && !used.includes(b))
    if (pair) {
      setRows((r) => [...r, pair])
      setMistakes((m) => m + 1)
      setSel(null)
    }
  }

  // 8 numbers around the + in the middle
  const cells = [0, 1, 2, 3, -1, 4, 5, 6, 7]

  return (
    <div className="mt-5">
      <h2 className="text-2xl font-bold sm:text-3xl">Make {t.target}!</h2>
      <p className="mt-1 text-base opacity-70">Tap two numbers that add up to {t.target}.</p>

      <div className="mt-4 flex justify-center gap-3">
        {[
          { label: "Listen", emoji: "🔊", onClick: () => speak(`Make ${t.target}. Find two numbers that add up to ${t.target}.`) },
          { label: "Hint", emoji: "💡", onClick: hint },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            title={b.label}
            onClick={b.onClick}
            disabled={b.label === "Hint" && (locked || ready)}
            className="flex size-14 items-center justify-center rounded-[16px] bg-[#3A9BE0] text-2xl shadow-[0_4px_0_#2476B8] outline-none transition-transform active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#3A9BE0]/40 disabled:opacity-50"
          >
            {b.emoji}
          </button>
        ))}
      </div>

      <div className="mt-5 grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10">
        {/* the cube: a front face with a 3D top and side */}
        <div className="relative mx-auto mt-4 mr-6 w-[236px] sm:mx-0">
          <span aria-hidden className="absolute -top-4 left-2 h-4 w-full origin-bottom-left skew-x-[-45deg] rounded-t-[6px] border-2 border-[#2B3A4A] bg-[#CFE4F6] dark:border-white/70 dark:bg-white/20" />
          <span aria-hidden className="absolute top-[-1px] -right-4 h-full w-4 origin-top-left skew-y-[-45deg] rounded-r-[6px] border-2 border-[#2B3A4A] bg-[#B6D4EE] dark:border-white/70 dark:bg-white/15" />
          <div className="relative grid grid-cols-3 gap-1.5 rounded-[10px] border-2 border-[#2B3A4A] bg-white p-1.5 dark:border-white/70 dark:bg-[#1B2733]">
            {cells.map((c, k) =>
              c === -1 ? (
                <span key={k} className="flex aspect-square items-center justify-center text-4xl font-bold">
                  +
                </span>
              ) : (
                <button
                  key={k}
                  type="button"
                  disabled={locked || used.includes(c)}
                  onClick={() => tap(c)}
                  aria-label={`Number ${t.numbers[c]}`}
                  aria-pressed={sel === c}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-[8px] border-2 text-4xl font-bold tabular-nums outline-none transition-[transform,background-color,opacity] focus-visible:ring-4 focus-visible:ring-[#4A7FD4]/40",
                    used.includes(c)
                      ? "border-transparent bg-[#E4F8EA] text-[#23A060] opacity-60 dark:bg-[#1D3A2A]"
                      : sel === c
                        ? "-translate-y-0.5 border-[#4A7FD4] bg-[#E3F0FB] dark:bg-white/10"
                        : "border-[#2B3A4A]/15 bg-white hover:border-[#4A7FD4]/60 dark:border-white/15 dark:bg-white/5",
                    shake === c && "animate-kid-shake border-[#FF5E7E] text-[#E0405F]"
                  )}
                >
                  {t.numbers[c]}
                </button>
              )
            )}
          </div>
        </div>

        {/* ☐ + ☐ = target */}
        <ul className="space-y-2.5">
          {[0, 1, 2, 3].map((r) => {
            const row = rows[r]
            const box = "flex size-14 items-center justify-center rounded-[10px] border-2 border-[#2B3A4A] bg-white text-2xl font-bold tabular-nums shadow-[3px_3px_0_#B6D4EE] dark:border-white/60 dark:bg-white/5 dark:shadow-none"
            return (
              <li key={r} className={cn("flex items-center gap-2.5 text-2xl font-bold", row && "animate-kid-pop")}>
                <span className={cn(box, row && "text-[#23A060]")}>{row ? t.numbers[row[0]] : ""}</span>
                <span>+</span>
                <span className={cn(box, row && "text-[#23A060]")}>{row ? t.numbers[row[1]] : ""}</span>
                <span className="tabular-nums">= {t.target}</span>
                {row && <span aria-hidden>✅</span>}
              </li>
            )
          })}
        </ul>
      </div>

      <ResultSheet checked={checked} ready={ready} onCheck={() => onCheck(mistakes <= 1)} onNext={onNext}>
        {!checked && <p className="relative mt-1 text-lg">You found all 4 pairs — next time try with fewer mistakes ({mistakes}).</p>}
      </ResultSheet>
    </div>
  )
}

// ------------------------------------------------------------ "Missing number" cards

type MissingTask = Extract<KidTask, { kind: "missing" }>

/** Cards like “7 + ☐ = 10” and “10 − ☐ = 7”: the child types the missing numbers. */
function MissingView({ task: t, checked, onCheck, onNext, speak }: Omit<ViewProps, "task"> & { task: MissingTask }) {
  // two boxes per card: [card × 2 + 0] = the + line, [card × 2 + 1] = the − line
  const [values, setValues] = useState<string[]>(() => t.cards.flatMap(() => ["", ""]))
  const [hinted, setHinted] = useState<number[]>([])
  const locked = checked !== null
  const answerOf = (box: number) => t.cards[Math.floor(box / 2)].total - t.cards[Math.floor(box / 2)].a
  const isRight = (box: number) => Number(values[box]) === answerOf(box) && values[box].trim() !== ""
  const ready = values.every((v) => v.trim() !== "")
  const wrong = values.filter((_, i) => !isRight(i)).length

  function set(box: number, v: string) {
    if (locked) return
    setValues((vs) => vs.map((x, i) => (i === box ? v.replace(/\D/g, "").slice(0, 2) : x)))
  }

  function focusNext(box: number) {
    const next = values.findIndex((v, i) => i > box && v.trim() === "")
    document.getElementById(`${t.id}-box-${next >= 0 ? next : box}`)?.focus()
  }

  // 💡 fills one empty box
  function hint() {
    if (locked) return
    const box = values.findIndex((v) => v.trim() === "")
    if (box < 0) return
    set(box, String(answerOf(box)))
    setHinted((h) => [...h, box])
  }

  function Box({ box }: { box: number }) {
    const state = !locked ? "idle" : isRight(box) ? "right" : "wrong"
    return (
      <span className="relative inline-flex">
        <input
          id={`${t.id}-box-${box}`}
          value={values[box]}
          inputMode="numeric"
          autoComplete="off"
          aria-label={`Missing number, card ${Math.floor(box / 2) + 1}`}
          disabled={locked}
          onChange={(e) => set(box, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              focusNext(box)
            }
          }}
          className={cn(
            "size-12 rounded-[8px] border-2 bg-white text-center text-2xl font-bold tabular-nums outline-none transition-colors focus-visible:border-[#4A7FD4] focus-visible:ring-4 focus-visible:ring-[#4A7FD4]/25 dark:bg-white/5",
            state === "idle" && (hinted.includes(box) ? "border-[#F2C94C] text-[#9A6B00]" : "border-[#2B3A4A] dark:border-white/60"),
            state === "right" && "border-[#3CC37A] bg-[#E4F8EA] text-[#23A060] dark:bg-[#1D3A2A]",
            state === "wrong" && "animate-kid-shake border-[#FF5E7E] bg-[#FDE8EC] text-[#E0405F] dark:bg-[#3A1D25]"
          )}
        />
        {state === "wrong" && <span className="absolute -top-2 -right-2 rounded-full bg-[#23A060] px-1.5 text-xs font-bold text-white">{answerOf(box)}</span>}
      </span>
    )
  }

  return (
    <div className="mt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Find the missing number!</h2>
          <p className="mt-1 text-base opacity-70">Type the number that goes in each box. Press Enter to jump to the next one.</p>
        </div>
        <span aria-hidden className="animate-kid-float text-5xl">
          🚀
        </span>
      </div>

      <div className="mt-4 flex justify-center gap-3">
        {[
          { label: "Listen", emoji: "🔊", onClick: () => speak(t.cards.map((c) => `${c.a} plus what makes ${c.total}?`).join(" ")) },
          { label: "Hint", emoji: "💡", onClick: hint },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            title={b.label}
            onClick={b.onClick}
            disabled={b.label === "Hint" && (locked || ready)}
            className="flex size-14 items-center justify-center rounded-[16px] bg-[#3A9BE0] text-2xl shadow-[0_4px_0_#2476B8] outline-none transition-transform active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#3A9BE0]/40 disabled:opacity-50"
          >
            {b.emoji}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        {t.cards.map((c, i) => (
          <div key={i} className="space-y-3 rounded-[14px] border-2 border-[#2B3A4A] bg-white px-4 py-3.5 text-2xl font-bold tabular-nums dark:border-white/50 dark:bg-white/5">
            <p className="flex items-center justify-center gap-2">
              {c.a} + {Box({ box: i * 2 })} = {c.total}
            </p>
            <p className="flex items-center justify-center gap-2">
              {c.total} − {Box({ box: i * 2 + 1 })} = {c.a}
            </p>
          </div>
        ))}
      </div>

      <ResultSheet checked={checked} ready={ready} onCheck={() => onCheck(wrong === 0 && hinted.length <= 1)} onNext={onNext}>
        {!checked && (
          <p className="relative mt-1 text-lg">
            {values.length - wrong} of {values.length} right{hinted.length > 1 ? ` · ${hinted.length} hints used` : ""} — the green numbers show the answers.
          </p>
        )}
      </ResultSheet>
    </div>
  )
}

function AnswerButton({
  state,
  hidden,
  radio,
  tall,
  disabled,
  onClick,
  children,
}: {
  state: "idle" | "picked" | "right" | "wrong"
  hidden?: boolean
  radio?: boolean
  tall?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role={radio ? "radio" : undefined}
      aria-checked={radio ? state === "picked" : undefined}
      disabled={disabled || hidden}
      onClick={onClick}
      className={cn(
        "relative flex rounded-[18px] border-2 bg-white text-lg font-semibold outline-none transition-[border-color,background-color,opacity] focus-visible:ring-4 focus-visible:ring-[#4A7FD4]/30 dark:bg-white/5",
        tall ? "flex-col items-center p-3 pb-4 text-center" : "min-h-16 items-center justify-center px-4 py-3",
        radio && !tall && "justify-between gap-2 text-left",
        state === "picked" && "border-[#4A7FD4] bg-[#EEF5FE] dark:bg-[#4A7FD4]/15",
        state === "right" && "border-[#3CC37A] bg-[#E9FAF0] dark:bg-[#3CC37A]/15",
        state === "wrong" && "border-[#FF5E7E] bg-[#FFEEF1] dark:bg-[#FF5E7E]/15",
        state === "idle" && "border-transparent",
        hidden && "opacity-30"
      )}
    >
      <span className={cn(tall && "w-full")}>{children}</span>
      {radio && (
        <span
          aria-hidden
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
            tall && "absolute top-3 right-3 bg-white dark:bg-transparent",
            state === "idle" ? "border-[#B8C7D6]" : state === "wrong" ? "border-[#FF5E7E]" : state === "right" ? "border-[#3CC37A]" : "border-[#4A7FD4]"
          )}
        >
          {state !== "idle" && <span className={cn("size-3 rounded-full", state === "wrong" ? "bg-[#FF5E7E]" : state === "right" ? "bg-[#3CC37A]" : "bg-[#4A7FD4]")} />}
        </span>
      )}
    </button>
  )
}

function Finished({ right, total, hearts, onAgain }: { right: number; total: number; hearts: number; onAgain: () => void }) {
  const ratio = total ? right / total : 0
  return (
    <div className="py-10 text-center">
      <p className="text-7xl" aria-hidden>
        {ratio >= 0.9 ? "🏆" : ratio >= 0.6 ? "🎉" : "🌱"}
      </p>
      <h2 className="mt-4 text-4xl font-bold">{ratio >= 0.9 ? "Amazing!" : ratio >= 0.6 ? "Great job!" : "Good try!"}</h2>
      <p className="mt-2 text-xl opacity-80">
        You got {right} of {total} right · <span className="text-[#FF4D6D]">❤</span> {hearts} left
      </p>
      <p className="mt-1 opacity-70">Your teacher can see this result.</p>
      <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
        <button type="button" onClick={onAgain} className="h-14 rounded-[16px] bg-white text-lg font-semibold shadow-[0_4px_0_rgba(0,0,0,0.08)] active:translate-y-1 dark:bg-white/10">
          🔁 Try again
        </button>
        <Link to="/discover" className="flex h-14 items-center justify-center rounded-[16px] bg-[#4A7FD4] text-lg font-semibold text-white shadow-[0_4px_0_#3563AE] active:translate-y-1">
          More lessons
        </Link>
      </div>
    </div>
  )
}
