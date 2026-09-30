import { useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight02Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { joinGame, sendAnswer, tiles, useLiveGame, useTicker, type LiveState } from "@/lib/live"
import { cn } from "@/lib/utils"

const PIN_KEY = "pragmalab.live.pin" // this tab's game, so a reload rejoins

/** Students: type the teacher's game code and answer the questions live (like Kahoot). */
export default function LiveStudentPage() {
  const [pin, setPin] = useState<string | null>(() => sessionStorage.getItem(PIN_KEY))
  const [first, setFirst] = useState<LiveState | null>(null)

  if (!pin)
    return (
      <EnterCode
        onJoined={(p, s) => {
          sessionStorage.setItem(PIN_KEY, p)
          setFirst(s)
          setPin(p)
        }}
      />
    )
  return (
    <Play
      key={pin}
      pin={pin}
      first={first}
      onLeave={() => {
        sessionStorage.removeItem(PIN_KEY)
        setFirst(null)
        setPin(null)
      }}
    />
  )
}

function EnterCode({ onJoined }: { onJoined: (pin: string, s: LiveState) => void }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [focused, setFocused] = useState(false)

  async function join() {
    if (code.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      onJoined(code, await joinGame(code))
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <Reveal className="mx-auto mt-6 max-w-lg overflow-hidden rounded-[32px] sky-panel p-8 text-center text-white sm:p-12">
      <div aria-hidden className="mx-auto grid size-20 grid-cols-2 gap-1.5 rounded-[20px] bg-white/10 p-2">
        {tiles.map((t) => (
          <span key={t.name} className={cn("flex items-center justify-center rounded-[8px] text-sm", t.color)}>
            {t.shape}
          </span>
        ))}
      </div>
      <h1 className="mt-5 font-kids text-4xl font-bold">Lecture questions</h1>
      <p className="mt-2 text-lg opacity-85">Type the game code from your teacher’s screen.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void join()
        }}
        className="mt-6"
      >
        {/* six digit boxes; a see-through input on top does the typing and pasting */}
        <label className="relative block">
          <span className="sr-only">Game code</span>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              setError(null)
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            inputMode="numeric"
            autoFocus
            autoComplete="one-time-code"
            maxLength={6}
            className="absolute inset-0 z-10 size-full cursor-text opacity-0"
          />
          <span aria-hidden className="grid grid-cols-6 gap-2 sm:gap-2.5">
            {Array.from({ length: 6 }, (_, i) => {
              const active = focused && i === Math.min(code.length, 5)
              return (
                <span
                  key={i}
                  className={cn(
                    "flex aspect-[4/5] items-center justify-center rounded-[14px] border-2 bg-white font-mono text-3xl font-bold text-[#173A6B] shadow-[0_4px_0_rgba(0,0,0,0.12)] transition-[border-color,transform] sm:text-4xl",
                    active ? "-translate-y-0.5 border-sun ring-4 ring-sun/35" : code[i] ? "border-white" : "border-white/0",
                    error && "border-[#FF8A8A]"
                  )}
                >
                  {code[i] ?? (active ? <span className="h-8 w-0.5 animate-pulse rounded-full bg-[#1F5FBF]" /> : <span className="text-[#C4D2E6]">•</span>)}
                </span>
              )
            })}
          </span>
        </label>
        {error && <p className="mt-3 rounded-[10px] bg-white/15 px-3 py-2 text-[15px]">{error}</p>}
        <Button type="submit" disabled={code.length !== 6 || busy} className="mt-4 h-14 w-full gap-2 rounded-[14px] bg-[#1F1F1F] text-lg font-bold text-white hover:bg-black">
          {busy ? "Joining…" : "Join"}
          <HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
        </Button>
      </form>
    </Reveal>
  )
}

function Play({ pin, first, onLeave }: { pin: string; first: LiveState | null; onLeave: () => void }) {
  const { state: s, error, update, secondsLeft } = useLiveGame(pin, first)
  const [sending, setSending] = useState(false)
  useTicker(s?.phase === "question")

  async function answer(choice: number) {
    if (sending || s?.me?.answered) return
    setSending(true)
    try {
      update(await sendAnswer(pin, choice))
    } catch {
      // too late – the next update shows the result
    } finally {
      setSending(false)
    }
  }

  // the game ended or was removed (e.g. the teacher started a new one)
  if (!s && error)
    return (
      <Shell onLeave={onLeave}>
        <p className="text-2xl font-bold">{error}</p>
        <Button className="mt-6 rounded-[12px] bg-white font-bold text-[#1F5FBF] hover:bg-white/90" onClick={onLeave}>
          Enter another code
        </Button>
      </Shell>
    )
  if (!s) return <Shell onLeave={onLeave}><p className="animate-pulse text-xl">Joining…</p></Shell>

  const me = s.me
  return (
    <Shell onLeave={onLeave} top={me ? `${me.name} · ${me.score} points` : s.title}>
      {s.phase === "lobby" && (
        <div className="text-center">
          <p className="text-5xl">🎉</p>
          <p className="mt-3 text-3xl font-bold">You’re in!</p>
          <p className="mt-2 animate-pulse text-lg opacity-85">Look for your name on your teacher’s screen. The game starts soon…</p>
        </div>
      )}

      {s.phase === "question" && s.question && (
        <div className="w-full">
          <div className="flex items-center gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-[#1F5FBF] tabular-nums">{secondsLeft()}</span>
            <p className="flex-1 rounded-[16px] bg-white px-4 py-3 text-center text-xl font-bold text-[#1F1F1F] sm:text-2xl">{s.question.text}</p>
          </div>
          {me?.answered ? (
            <div className="mt-10 text-center">
              <p className="text-5xl">⏳</p>
              <p className="mt-3 text-2xl font-bold">Answer sent!</p>
              <p className="mt-1 opacity-85">Waiting for the others…</p>
            </div>
          ) : (
            <>
            <p className="mt-4 text-center text-[15px] opacity-85">Look at your teacher’s screen and tap the shape of your answer.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {s.question.options.map((o, k) => (
                <button
                  key={k}
                  type="button"
                  disabled={sending}
                  onClick={() => answer(k)}
                  aria-label={`${tiles[k].name}: ${o}`}
                  className={cn(
                    "flex min-h-32 items-center justify-center rounded-[18px] p-3 text-white outline-none transition-transform active:translate-y-1 focus-visible:ring-4 focus-visible:ring-white/50 sm:min-h-40",
                    tiles[k].color,
                    tiles[k].shadow
                  )}
                >
                  {/* only the shape – the answer words are on the teacher's screen, like Kahoot */}
                  <span aria-hidden className="text-6xl drop-shadow-[0_3px_0_rgba(0,0,0,0.15)] sm:text-7xl">
                    {tiles[k].shape}
                  </span>
                </button>
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {s.phase === "reveal" && (
        <div className={cn("w-full rounded-[24px] px-6 py-10 text-center", me?.lastCorrect ? "bg-[#26890C]" : "bg-[#E21B3C]")}>
          <p className="text-6xl">{me?.lastCorrect ? "🎉" : me?.lastCorrect === false ? "😅" : "⌛"}</p>
          <p className="mt-3 text-3xl font-bold">{me?.lastCorrect ? "Correct!" : me?.lastCorrect === false ? "Not this time" : "Time’s up!"}</p>
          {me?.lastCorrect && <p className="mt-2 text-2xl font-semibold tabular-nums">+{me.lastPoints} points</p>}
          {s.question && s.correct !== undefined && (
            <p className="mt-3 text-lg opacity-90">
              Right answer: {tiles[s.correct].shape} {s.question.options[s.correct]}
            </p>
          )}
          {me && <p className="mt-4 text-lg">You’re #{me.rank} of {s.players}</p>}
        </div>
      )}

      {s.phase === "board" && me && (
        <div className="text-center">
          <p className="text-2xl font-semibold opacity-90">You are</p>
          <p className="mt-2 font-kids text-7xl font-bold">#{me.rank}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{me.score} points</p>
          <p className="mt-4 opacity-80">Get ready for the next question…</p>
        </div>
      )}

      {s.phase === "end" && (
        <div className="text-center">
          <p className="text-6xl">{me && me.rank <= 3 ? ["🥇", "🥈", "🥉"][me.rank - 1] : "🎈"}</p>
          <p className="mt-3 text-3xl font-bold">Game over!</p>
          {me && (
            <p className="mt-2 text-2xl">
              You finished <b>#{me.rank}</b> with <b className="tabular-nums">{me.score}</b> points
            </p>
          )}
          <Button className="mt-8 h-12 rounded-[12px] bg-white px-6 font-bold text-[#1F5FBF] hover:bg-white/90" onClick={onLeave}>
            Play another game
          </Button>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children, top, onLeave }: { children: ReactNode; top?: string; onLeave: () => void }) {
  return (
    <div className="mx-auto mt-2 flex min-h-[calc(100svh-180px)] max-w-3xl flex-col overflow-hidden rounded-[32px] sky-panel p-5 text-white sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-lg font-semibold opacity-90">{top}</p>
        <button type="button" onClick={onLeave} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold opacity-80 outline-none hover:bg-white/15 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/50">
          Leave
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center py-6">{children}</div>
    </div>
  )
}
