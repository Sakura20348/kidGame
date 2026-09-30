import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon, Globe02Icon, RefreshIcon, TextFontIcon } from "@hugeicons/core-free-icons"

import { kidsGames, randInt } from "@/data/kids-games"
import { useKids } from "@/lib/contexts"
import { cn } from "@/lib/utils"
import { GameShell, KidButton } from "@/pages/kids/game-shell"

const game = kidsGames.find((g) => g.id === "typing")!

// Short, common words that 7–9 year olds can read and spell.
const kidWords = (
  "the and you are was for his they with one have this from had not but what all were when we there can " +
  "your which said each she how will up other about out many then them these so some her would make like him " +
  "into time has look two more write go see number no way could people my than first water been call who " +
  "its now find long down day did get come made may part cat dog sun fun run big red blue green hat map " +
  "cup bed box fox pig hen egg bus car toy ball book tree fish bird frog duck cake milk rain snow star moon " +
  "home play jump swim sing read draw kind happy funny little friend school apple pizza tiger zebra lemon " +
  "house river garden rocket planet robot dragon pencil paper music color smile sleep dream light green " +
  "yellow orange purple brown black white small large quick slow loud quiet hot cold warm soft hard open " +
  "close under over near far left right early late today night morning table chair window door family"
).split(" ")

type Mode = "time" | "words"
type Config = { mode: Mode; count: number; punctuation: boolean; numbers: boolean }

const countOptions: Record<Mode, number[]> = { time: [15, 30, 60], words: [10, 25, 50] }

type Test = {
  words: string[]
  typed: string[] // finished words
  current: string // word being typed
  startedAt: number | null
  endedAt: number | null
  correctKeys: number
  totalKeys: number
}

function makeWords(n: number, cfg: Config) {
  const out: string[] = []
  let capital = cfg.punctuation
  for (let i = 0; i < n; i++) {
    if (cfg.numbers && Math.random() < 0.12) {
      out.push(String(randInt(0, 99)))
      continue
    }
    let w = kidWords[randInt(0, kidWords.length - 1)]
    if (cfg.punctuation) {
      if (capital) w = w[0].toUpperCase() + w.slice(1)
      capital = false
      const r = Math.random()
      const mark = r < 0.1 ? "." : r < 0.18 ? "," : r < 0.21 ? "!" : r < 0.24 ? "?" : ""
      w += mark
      if (mark && mark !== ",") capital = true // new sentence starts with a capital
    }
    out.push(w)
  }
  return out
}

const newTest = (cfg: Config): Test => ({
  words: makeWords(cfg.mode === "time" ? 120 : cfg.count, cfg),
  typed: [],
  current: "",
  startedAt: null,
  endedAt: null,
  correctKeys: 0,
  totalKeys: 0,
})

/** Characters of fully-correct words (+ their spaces), like Monkeytype's WPM. */
function stats(t: Test, until: number) {
  let correctChars = 0
  let correct = 0
  let incorrect = 0
  let extra = 0
  let missed = 0
  t.typed.forEach((typed, i) => {
    const word = t.words[i]
    if (typed === word) correctChars += word.length + 1
    for (let p = 0; p < Math.max(word.length, typed.length); p++) {
      if (p >= typed.length) missed++
      else if (p >= word.length) extra++
      else if (typed[p] === word[p]) correct++
      else incorrect++
    }
  })
  const seconds = t.startedAt ? Math.max(0.5, (until - t.startedAt) / 1000) : 0
  const wpm = seconds ? Math.round(correctChars / 5 / (seconds / 60)) : 0
  const acc = t.totalKeys ? Math.round((t.correctKeys / t.totalKeys) * 100) : 0
  return { wpm, acc, seconds: Math.round(seconds), correct, incorrect, extra, missed }
}

/** Kid-friendly targets: speed and accuracy both count. */
function typingStars(wpm: number, acc: number) {
  if (wpm >= 25 && acc >= 90) return 3
  if (wpm >= 15 && acc >= 80) return 2
  if (wpm >= 6) return 1
  return 0
}

const accent = "text-[#C98A00] dark:text-[#FFD166]"

export default function TypingRacePage() {
  const { award } = useKids()
  const [cfg, setCfg] = useState<Config>({ mode: "words", count: 25, punctuation: false, numbers: false })
  const [test, setTest] = useState<Test>(() => newTest({ mode: "words", count: 25, punctuation: false, numbers: false }))
  const [now, setNow] = useState(0)
  const [focused, setFocused] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const awarded = useRef(false)

  const index = test.typed.length
  const ended = test.endedAt !== null

  function restart(next: Config = cfg) {
    setCfg(next)
    setTest(newTest(next))
    setNow(0)
    awarded.current = false
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // Timer: ticks while running; time mode ends itself.
  useEffect(() => {
    if (!test.startedAt || ended) return
    const startedAt = test.startedAt
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (cfg.mode === "time" && t - startedAt >= cfg.count * 1000) {
        setTest((prev) => (prev.endedAt ? prev : { ...prev, endedAt: startedAt + cfg.count * 1000 }))
      }
    }, 100)
    return () => clearInterval(id)
  }, [test.startedAt, ended, cfg.mode, cfg.count])

  // Stars once per finished test.
  useEffect(() => {
    if (!test.endedAt || awarded.current) return
    awarded.current = true
    const s = stats(test, test.endedAt)
    award(game.id, typingStars(s.wpm, s.acc))
  }, [test, award])

  // Caret position + keep the active word on the 2nd line (lines scroll up).
  useLayoutEffect(() => {
    function place() {
      const wrap = wrapRef.current
      const caret = caretRef.current
      const word = wrap?.querySelector<HTMLElement>(`[data-word="${index}"]`)
      if (!wrap || !caret || !word) return
      const letters = word.querySelectorAll<HTMLElement>("[data-letter]")
      const pos = test.current.length
      let x = word.offsetLeft
      if (letters.length) {
        const el = letters[Math.min(pos, letters.length - 1)]
        x = pos < letters.length ? el.offsetLeft : el.offsetLeft + el.offsetWidth
      }
      const y = word.offsetTop
      caret.style.transform = `translate(${x}px, ${y}px)`
      caret.style.height = `${word.offsetHeight}px`

      const first = wrap.querySelector<HTMLElement>('[data-word="0"]')
      const lineStep = first ? first.offsetHeight * 1.25 : 0
      const shift = Math.max(0, word.offsetTop - lineStep)
      wrap.style.transform = `translateY(-${shift}px)`
    }
    place()
    const ro = new ResizeObserver(place)
    if (boxRef.current) ro.observe(boxRef.current)
    return () => ro.disconnect()
  }, [index, test.current, test.words, ended])

  // Press any key to focus (when not typing somewhere else).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.closest("input, textarea, select, [contenteditable]")) return
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !ended) inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [ended])

  function onInput(v: string) {
    if (ended) return
    const ts = Date.now()
    const startedAt = test.startedAt ?? ts
    if (!test.startedAt) setNow(ts)
    const word = test.words[index]

    // Space: finish this word
    if (v.endsWith(" ")) {
      const value = v.trimEnd()
      if (!value) return
      const typed = [...test.typed, value]
      let words = test.words
      if (cfg.mode === "time" && words.length - typed.length < 40) words = [...words, ...makeWords(60, cfg)]
      setTest({
        ...test,
        words,
        typed,
        current: "",
        startedAt,
        totalKeys: test.totalKeys + 1,
        correctKeys: test.correctKeys + (value === word ? 1 : 0),
        endedAt: cfg.mode === "words" && typed.length === words.length ? ts : null,
      })
      return
    }

    let { correctKeys, totalKeys } = test
    for (let p = test.current.length; p < v.length; p++) {
      totalKeys++
      if (v[p] === word[p]) correctKeys++
    }
    const lastWordDone = cfg.mode === "words" && index === test.words.length - 1 && v === word
    setTest({
      ...test,
      startedAt,
      correctKeys,
      totalKeys,
      current: lastWordDone ? "" : v,
      typed: lastWordDone ? [...test.typed, v] : test.typed,
      endedAt: lastWordDone ? ts : null,
    })
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault()
      restart()
      return
    }
    // Backspace into the previous word – only if it has mistakes (like Monkeytype)
    if (e.key === "Backspace" && test.current === "" && index > 0 && test.typed[index - 1] !== test.words[index - 1]) {
      e.preventDefault()
      setTest({ ...test, typed: test.typed.slice(0, -1), current: test.typed[index - 1] })
    }
  }

  const live = stats(test, test.endedAt ?? now)
  const timeLeft = Math.max(0, cfg.count - Math.floor(test.startedAt ? ((test.endedAt ?? now) - test.startedAt) / 1000 : 0))

  return (
    <GameShell game={game} round={0} total={1} score={0} wide hideProgress>
      {/* Settings bar */}
      <div className="flex flex-wrap justify-center gap-3 font-mono text-sm">
        <Group>
          <Toggle active={cfg.punctuation} onClick={() => restart({ ...cfg, punctuation: !cfg.punctuation })}>
            <span aria-hidden>@</span> punctuation
          </Toggle>
          <Toggle active={cfg.numbers} onClick={() => restart({ ...cfg, numbers: !cfg.numbers })}>
            <span aria-hidden>#</span> numbers
          </Toggle>
        </Group>
        <Group>
          <Toggle active={cfg.mode === "time"} onClick={() => restart({ ...cfg, mode: "time", count: 30 })}>
            <HugeiconsIcon icon={Clock01Icon} className="size-4" /> time
          </Toggle>
          <Toggle active={cfg.mode === "words"} onClick={() => restart({ ...cfg, mode: "words", count: 25 })}>
            <HugeiconsIcon icon={TextFontIcon} className="size-4" /> words
          </Toggle>
        </Group>
        <Group>
          {countOptions[cfg.mode].map((n) => (
            <Toggle key={n} active={cfg.count === n} onClick={() => restart({ ...cfg, count: n })}>
              {n}
            </Toggle>
          ))}
        </Group>
      </div>

      {ended ? (
        <Results test={test} cfg={cfg} onNext={() => restart()} />
      ) : (
        <div className="mt-16 sm:mt-24">
          <div className="mb-3 flex items-end justify-between font-mono">
            <span className={cn("min-w-20 text-3xl font-semibold tabular-nums", accent, !test.startedAt && "opacity-0")}>
              {cfg.mode === "time" ? timeLeft : `${index}/${cfg.count}`}
            </span>
            <span className="flex items-center gap-2 text-sm opacity-60">
              <HugeiconsIcon icon={Globe02Icon} className="size-4" />
              english · kids
            </span>
            <span className={cn("min-w-20 text-right text-lg tabular-nums opacity-60", !test.startedAt && "opacity-0")}>
              {live.wpm} wpm
            </span>
          </div>

          {/* Words */}
          <div
            ref={boxRef}
            onClick={() => inputRef.current?.focus()}
            className="relative cursor-text overflow-hidden font-mono text-[22px] leading-[1.6] sm:text-[28px] lg:text-[32px]"
            style={{ height: "5.6em" }}
          >
            <input
              ref={inputRef}
              value={test.current}
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Type the words"
              className="pointer-events-none absolute size-px opacity-0"
            />

            <div
              ref={wrapRef}
              className={cn(
                "relative flex flex-wrap gap-x-[0.6em] gap-y-[0.4em] transition-[transform,filter] duration-300 ease-out",
                !focused && "blur-[3px]"
              )}
            >
              {test.words.map((w, i) => (
                <Word key={i} index={i} word={w} typed={i < index ? test.typed[i] : i === index ? test.current : ""} done={i < index} />
              ))}
              <span
                ref={caretRef}
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-0 left-0 w-[3px] rounded-full bg-[#E0A800] transition-transform duration-100 ease-out dark:bg-[#FFD166]",
                  !test.startedAt && "animate-pulse"
                )}
              />
            </div>

            {!focused && (
              <div className="absolute inset-0 flex items-center justify-center font-kids text-xl font-medium">
                👆 Click here or press any key to start typing
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => restart()}
              aria-label="Restart test"
              title="Restart (Esc)"
              className="flex size-12 items-center justify-center rounded-full opacity-60 outline-none transition-[opacity,transform] hover:rotate-90 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
            >
              <HugeiconsIcon icon={RefreshIcon} className="size-6" />
            </button>
            <p className="font-mono text-xs opacity-50">esc — restart</p>
          </div>
        </div>
      )}
    </GameShell>
  )
}

// =================================================================== pieces

function Word({ index, word, typed, done }: { index: number; word: string; typed: string; done: boolean }) {
  const length = Math.max(word.length, typed.length)
  const wrong = done && typed !== word
  return (
    <span
      data-word={index}
      className={cn("whitespace-pre", wrong && "underline decoration-[#E5484D] decoration-2 underline-offset-[6px]")}
    >
      {Array.from({ length }, (_, p) => {
        const extra = p >= word.length
        const ch = extra ? typed[p] : word[p]
        const state = p >= typed.length ? "todo" : extra ? "extra" : typed[p] === word[p] ? "ok" : "bad"
        return (
          <span
            key={p}
            data-letter
            className={cn(
              "transition-colors duration-75",
              state === "todo" && "text-[#2B2140]/35 dark:text-white/35",
              state === "ok" && "text-[#2B2140] dark:text-[#F3EEFF]",
              state === "bad" && "text-[#E5484D]",
              state === "extra" && "text-[#A3303F]"
            )}
          >
            {ch}
          </span>
        )
      })}
    </span>
  )
}

function Group({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-[14px] bg-white/70 px-2 py-1.5 shadow-[0_2px_0_rgba(0,0,0,0.04)] dark:bg-white/5">
      {children}
    </div>
  )
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 outline-none transition-[color,opacity] focus-visible:ring-2 focus-visible:ring-[#6C63FF]/40",
        active ? cn("font-semibold", accent) : "opacity-55 hover:opacity-100"
      )}
    >
      {children}
    </button>
  )
}

function Results({ test, cfg, onNext }: { test: Test; cfg: Config; onNext: () => void }) {
  const s = stats(test, test.endedAt ?? 0)
  const stars = typingStars(s.wpm, s.acc)
  const cheer = ["Keep practising!", "Nice typing!", "Great speed!", "Typing superstar!"][stars]

  return (
    <div className="mt-12 animate-kid-pop rounded-[32px] bg-white p-6 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
      <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex gap-10 font-mono md:flex-col md:gap-4">
          <div>
            <p className="text-2xl opacity-60">wpm</p>
            <p className={cn("text-7xl leading-none font-semibold tabular-nums", accent)}>{s.wpm}</p>
          </div>
          <div>
            <p className="text-2xl opacity-60">acc</p>
            <p className={cn("text-7xl leading-none font-semibold tabular-nums", accent)}>{s.acc}%</p>
          </div>
        </div>

        <div>
          <p className="text-4xl font-semibold">{cheer}</p>
          <div className="mt-3 flex gap-2 text-5xl" aria-label={`${stars} of 3 stars`}>
            {[1, 2, 3].map((n) => (
              <span key={n} aria-hidden className={cn("animate-kid-pop", n > stars && "opacity-25 grayscale")} style={{ animationDelay: `${n * 0.15}s` }}>
                ⭐
              </span>
            ))}
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 font-mono sm:grid-cols-3">
            <Stat label="test type" value={`${cfg.mode} ${cfg.count}${cfg.punctuation ? " @" : ""}${cfg.numbers ? " #" : ""}`} />
            <Stat
              label="characters"
              value={`${s.correct}/${s.incorrect}/${s.extra}/${s.missed}`}
              hint="correct / wrong / extra / missed"
            />
            <Stat label="time" value={`${s.seconds}s`} />
          </dl>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <KidButton autoFocus onClick={onNext} className={cn("bg-linear-to-br text-white", game.tile)}>
          Next test
        </KidButton>
        <Link
          to="/kids"
          className="flex h-16 items-center justify-center rounded-[20px] bg-[#F1ECFF] px-8 text-xl font-semibold text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] outline-none transition-transform active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 dark:bg-white/10 dark:text-white dark:shadow-[0_5px_0_rgba(255,255,255,0.08)]"
        >
          More games
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div title={hint}>
      <dt className="text-sm opacity-60">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
    </div>
  )
}
