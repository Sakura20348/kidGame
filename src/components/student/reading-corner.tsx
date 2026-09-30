import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { ReadAloud } from "@/components/kids/read-aloud"
import { Reveal } from "@/components/motion/reveal"
import { Eyebrow } from "@/components/resources/section"
import { Button } from "@/components/ui/button"
import { curriculumTopic } from "@/data/curriculum"
import { readingCorner, type CornerTopic } from "@/data/reading-corner"
import { useSpeech } from "@/hooks/use-speech"
import { logActivity } from "@/lib/activity"
import { useAuth } from "@/lib/contexts"
import { kidsKey } from "@/lib/kids-storage"
import { cn } from "@/lib/utils"

type Part = "words" | "sentences" | "story"
type Done = Record<string, Part[]> // topic → parts read
const parts: { id: Part; label: string; emoji: string }[] = [
  { id: "words", label: "Vocabulary", emoji: "🔤" },
  { id: "sentences", label: "Sentences", emoji: "💬" },
  { id: "story", label: "Story", emoji: "📖" },
]

function readDone(email: string | null): Done {
  try {
    return JSON.parse(localStorage.getItem(kidsKey(email, "readingCorner")) ?? "{}")
  } catch {
    return {}
  }
}

/** Reading corner: a card per curriculum topic; open one to read its words, sentences and story. */
export function ReadingCorner() {
  const { email } = useAuth()
  const [params, setParams] = useSearchParams()
  const [done, setDone] = useState(() => readDone(email))
  const open = readingCorner.find((t) => t.name === params.get("read"))

  function markRead(topic: string, part: Part) {
    if (done[topic]?.includes(part)) return
    const next = { ...done, [topic]: [...(done[topic] ?? []), part] }
    setDone(next)
    try {
      localStorage.setItem(kidsKey(email, "readingCorner"), JSON.stringify(next))
    } catch {
      // ignore
    }
    logActivity(email, "lesson")
    toast.success(next[topic].length === 3 ? `🎉 You read all of “${topic}”!` : "✓ Well read!")
  }

  if (open) return <Reader topic={open} done={done[open.name] ?? []} onRead={(p) => markRead(open.name, p)} onBack={() => setParams({}, { replace: false })} />

  const total = readingCorner.length * 3
  const read = Object.values(done).reduce((n, p) => n + p.length, 0)
  return (
    <Reveal as="section" className="mt-6 rounded-[26px] border border-border bg-card p-6 @min-[700px]:p-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>READING CORNER</Eyebrow>
          <h2 className="mt-3 font-serif text-[28px] leading-tight text-foreground @min-[700px]:text-[32px]">Pick a topic and read</h2>
          <p className="mt-1 text-sm text-muted-foreground">Words, sentences and a short story for every topic. Tap any word to hear it.</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-foreground tabular-nums">
          {read}/{total} read
        </span>
      </div>
      <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
        {readingCorner.map((t, i) => {
          const got = done[t.name]?.length ?? 0
          return (
            <Reveal key={t.name} delay={(i % 5) * 60} className="flex *:flex-1">
              <button
                type="button"
                onClick={() => setParams({ read: t.name })}
                className={cn(
                  "group relative flex min-h-44 flex-col overflow-hidden rounded-[22px] bg-linear-to-br p-4 text-left text-white shadow-[0_6px_0_rgba(0,0,0,0.14)] outline-none transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-ring/40 active:translate-y-0.5",
                  t.tile
                )}
              >
                <span aria-hidden className="absolute -top-8 -right-8 size-28 rounded-full bg-white/15" />
                <span className="relative flex items-start justify-between gap-2">
                  <span aria-hidden className="text-5xl drop-shadow-[0_4px_0_rgba(0,0,0,0.12)] transition-transform group-hover:scale-110">
                    {t.emoji}
                  </span>
                  {got === 3 ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#1F9D6B]">✓ Read</span>
                  ) : (
                    got > 0 && <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold">{got}/3</span>
                  )}
                </span>
                <span className="relative mt-auto pt-4 font-kids text-xl leading-tight font-bold">{t.name}</span>
                <span className="relative mt-2 flex flex-wrap gap-1 text-[11px] font-semibold">
                  {parts.map((p) => (
                    <span key={p.id} className={cn("rounded-full px-2 py-0.5", done[t.name]?.includes(p.id) ? "bg-white text-[#1F2A37]" : "bg-white/25")}>
                      {p.id === "words" ? `${t.words.length} words` : p.id === "sentences" ? `${t.sentences.length} sentences` : "1 story"}
                    </span>
                  ))}
                </span>
              </button>
            </Reveal>
          )
        })}
      </div>
    </Reveal>
  )
}

// ------------------------------------------------------------ one topic

function Reader({ topic: t, done, onRead, onBack }: { topic: CornerTopic; done: Part[]; onRead: (p: Part) => void; onBack: () => void }) {
  const [tab, setTab] = useState<Part>(() => parts.find((p) => !done.includes(p.id))?.id ?? "words")
  const [heard, setHeard] = useState<number[]>([])
  const { speak } = useSpeech()
  const plan = curriculumTopic(t.name)

  return (
    <Reveal as="section" className="mt-6 overflow-hidden rounded-[26px] border border-border bg-card">
      {/* header */}
      <div className={cn("relative bg-linear-to-br px-6 py-6 text-white @min-[700px]:px-9", t.tile)}>
        <span aria-hidden className="absolute -top-10 -right-6 size-36 rounded-full bg-white/15" />
        <button type="button" onClick={onBack} className="relative rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-semibold outline-none hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/60">
          ← All topics
        </button>
        <div className="relative mt-4 flex items-center gap-4">
          <span aria-hidden className="text-6xl">
            {t.emoji}
          </span>
          <div>
            <h2 className="font-kids text-3xl font-bold">{t.name}</h2>
            {plan && <p className="mt-1 max-w-xl text-sm text-white/90">🎯 {plan.outcomes[0]}</p>}
          </div>
        </div>
        <div role="tablist" aria-label="What to read" className="relative mt-5 flex flex-wrap gap-2">
          {parts.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={tab === p.id}
              onClick={() => setTab(p.id)}
              className={cn(
                "h-10 rounded-full px-4 text-[15px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/60",
                tab === p.id ? "bg-white text-[#1F2A37]" : "bg-white/20 hover:bg-white/30"
              )}
            >
              {p.emoji} {p.label} {done.includes(p.id) && "✓"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 @min-[700px]:p-9">
        {tab === "words" && (
          <>
            <p className="text-sm text-muted-foreground">Tap a card to hear the word.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 @min-[600px]:grid-cols-4">
              {t.words.map((w, i) => (
                <button
                  key={w.word}
                  type="button"
                  onClick={() => {
                    speak(w.word, 0.8)
                    setHeard((h) => (h.includes(i) ? h : [...h, i]))
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[18px] border-2 px-3 py-5 outline-none transition-[transform,border-color] active:scale-95 focus-visible:ring-2 focus-visible:ring-ring/40",
                    heard.includes(i) ? "border-link bg-link/8" : "border-border bg-muted/40 hover:border-link/50"
                  )}
                >
                  <span aria-hidden className="text-5xl">
                    {w.emoji}
                  </span>
                  <span className="font-kids text-2xl font-bold text-foreground">{w.word}</span>
                  <span className="text-xs text-muted-foreground">{heard.includes(i) ? "🔊 heard" : "🔊 tap"}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "sentences" && (
          <ol className="space-y-3">
            {t.sentences.map((s, i) => (
              <li key={s} className="flex items-center gap-3 rounded-[16px] bg-muted/50 px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-sm font-bold text-muted-foreground">{i + 1}</span>
                <p className="flex-1 font-kids text-2xl text-foreground">{s}</p>
                <button
                  type="button"
                  aria-label={`Hear “${s}”`}
                  onClick={() => speak(s, 0.8)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-link text-lg text-white outline-none hover:bg-link/90 focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  🔊
                </button>
              </li>
            ))}
          </ol>
        )}

        {tab === "story" && (
          <div>
            <h3 className="font-kids text-2xl font-bold text-foreground">📖 {t.story.title}</h3>
            <ReadAloud key={t.name} text={t.story.text} className="mt-4 font-kids" />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">{done.includes(tab) ? "✓ You’ve read this part." : "Finished reading? Mark it as read."}</p>
          <div className="flex gap-2">
            {!done.includes(tab) && (
              <Button className="h-11 rounded-[12px] px-5 font-bold" onClick={() => onRead(tab)}>
                ✓ I read it
              </Button>
            )}
            {parts.findIndex((p) => p.id === tab) < 2 && (
              <Button variant="outline" className="h-11 rounded-[12px] px-5 font-semibold dark:bg-transparent" onClick={() => setTab(parts[parts.findIndex((p) => p.id === tab) + 1].id)}>
                Next: {parts[parts.findIndex((p) => p.id === tab) + 1].label} →
              </Button>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  )
}
