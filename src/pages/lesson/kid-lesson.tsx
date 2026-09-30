import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { starsFor } from "@/data/kids-games"
import { guideFor } from "@/data/lesson-guides"
import { quizFor } from "@/data/lesson-quizzes"
import type { Resource } from "@/data/resources"
import { useSpeech } from "@/hooks/use-speech"
import { cn } from "@/lib/utils"
import { KidButton } from "@/pages/kids/game-shell"

type Step = "story" | "words" | "quiz" | "done"
const steps: { id: Step; label: string; emoji: string }[] = [
  { id: "story", label: "Story", emoji: "📖" },
  { id: "words", label: "New words", emoji: "🔤" },
  { id: "quiz", label: "Quiz", emoji: "❓" },
  { id: "done", label: "Stars", emoji: "⭐" },
]
const choiceColors = [
  "bg-[#FFE1EC] text-[#9C1D4B] shadow-[0_6px_0_#F7B5CC]",
  "bg-[#DDF1FF] text-[#12507A] shadow-[0_6px_0_#AED8F5]",
  "bg-[#E4F7D9] text-[#2D6414] shadow-[0_6px_0_#BDE3A8]",
  "bg-[#FFF1CC] text-[#7A5300] shadow-[0_6px_0_#F5D98A]",
]

/** Colourful lesson for ages 7–12: read the story, learn the words, take the quiz, get stars. */
export function KidLesson({ resource: r, onFinish }: { resource: Resource; onFinish: (score: number) => void }) {
  const guide = guideFor(r)
  const [step, setStep] = useState<Step>("story")
  const [questions, setQuestions] = useState(() => quizFor(r))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const { speak, stop, speaking, charIndex } = useSpeech()

  useEffect(() => stop, [stop]) // stop reading when leaving the page

  // which story sentence is being read aloud
  const text = guide.ideas.join(" ")
  const starts = guide.ideas.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + guide.ideas[i - 1].length + 1], [])
  const reading = speaking ? starts.findLastIndex((s) => charIndex >= s) : -1

  function choose(i: number) {
    if (picked !== null) return
    const right = i === questions[index].answer
    const nextScore = score + (right ? 1 : 0)
    setPicked(i)
    setScore(nextScore)
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        onFinish(nextScore)
        setStep("done")
      } else {
        setIndex(index + 1)
        setPicked(null)
      }
    }, right ? 900 : 1600)
  }

  function again() {
    stop()
    setQuestions(quizFor(r))
    setIndex(0)
    setPicked(null)
    setScore(0)
    setStep("story")
  }

  const stars = starsFor(score, questions.length)
  const stepIndex = steps.findIndex((s) => s.id === step)

  return (
    <div className="mx-auto max-w-[1000px] font-kids">
      <Link to="/discover" className="mb-5 inline-flex h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-[15px] font-semibold shadow-[0_3px_0_rgba(0,0,0,0.06)] dark:bg-white/10">
        <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
        All lessons
      </Link>

      {/* hero */}
      <div className="relative overflow-hidden rounded-[34px] p-6 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-8" style={{ backgroundColor: r.color }}>
        <div className="absolute inset-0 hidden bg-black/45 dark:block" />
        <span aria-hidden className="absolute -top-16 -right-10 size-56 rounded-full bg-white/25" />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row">
          <span className="flex size-36 shrink-0 items-center justify-center overflow-hidden rounded-[30px] bg-white text-[88px] shadow-[0_6px_0_rgba(0,0,0,0.08)] sm:size-44 sm:text-[110px]">
            {r.image ? <img src={r.image} alt="" className="size-full object-cover" /> : guide.emoji}
          </span>
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-[#B06AB3] px-3 py-1 text-sm font-semibold text-white">{r.ageGroup}</span>
              <span className="rounded-full bg-[#4FACFE] px-3 py-1 text-sm font-semibold text-white">{r.topic}</span>
            </div>
            <h1 className="mt-3 text-4xl leading-tight font-bold tracking-wide text-[#2B2140] uppercase sm:text-5xl dark:text-white">{r.title}</h1>
            <p className="mt-2 text-lg font-medium text-[#2B2140]/70 dark:text-white/75">{r.speaker}</p>
          </div>
        </div>
      </div>

      {/* steps */}
      <ol className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
        {steps.map((s, i) => (
          <li
            key={s.id}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[20px] px-2 py-3 text-center text-sm font-semibold sm:flex-row sm:justify-center sm:text-base",
              i === stepIndex ? "bg-[#6C63FF] text-white shadow-[0_5px_0_#4B42D6]" : i < stepIndex ? "bg-[#2BC0A4]/15 text-[#1F9D6B]" : "bg-white text-[#2B2140]/50 dark:bg-white/5 dark:text-white/50"
            )}
          >
            <span aria-hidden className="text-2xl">
              {i < stepIndex ? "✅" : s.emoji}
            </span>
            {s.label}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-[32px] bg-white p-6 shadow-[0_8px_0_rgba(43,33,64,0.08)] sm:p-10 dark:bg-white/5">
        {step === "story" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-3xl font-semibold">📖 Story time</h2>
              <KidButton
                onClick={() => (speaking ? stop() : speak(text))}
                className="h-14 bg-[#FFD166] px-6 text-lg text-[#2B2140] shadow-[0_5px_0_#E0A800]"
              >
                {speaking ? "⏹ Stop" : "🔊 Read to me"}
              </KidButton>
            </div>
            <div className="mt-6 space-y-3">
              {guide.ideas.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    "rounded-[20px] px-5 py-3 text-2xl leading-relaxed transition-colors",
                    reading === i ? "bg-[#FFD166]/40" : "bg-[#FFF6E5] dark:bg-white/5"
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
            <KidButton onClick={() => { stop(); setStep("words") }} className="mt-8 ml-auto bg-[#6C63FF] text-white shadow-[0_5px_0_#4B42D6]">
              New words ➜
            </KidButton>
          </>
        )}

        {step === "words" && (
          <>
            <h2 className="text-3xl font-semibold">🔤 New words</h2>
            <p className="mt-1 text-lg opacity-70">Tap a card to hear the word.</p>
            <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              {guide.words.map((w, i) => (
                <button
                  key={w.word}
                  type="button"
                  onClick={() => speak(`${w.word}. ${w.meaning}.`)}
                  className={cn("flex flex-col items-center rounded-[26px] p-6 text-center outline-none transition-transform hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40 active:translate-y-1", choiceColors[i % choiceColors.length])}
                >
                  <span aria-hidden className="text-7xl">
                    {w.emoji}
                  </span>
                  <span className="mt-3 text-2xl font-bold capitalize">{w.word}</span>
                  <span className="mt-1 text-base font-medium opacity-80">{w.meaning}</span>
                  <span className="mt-3 text-sm font-semibold opacity-70">🔊 Listen</span>
                </button>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <KidButton onClick={() => setStep("story")} className="bg-[#F1ECFF] text-[#4B3F8F] shadow-[0_5px_0_#D6CCFF] dark:bg-white/10 dark:text-white">
                ⬅ Story
              </KidButton>
              <KidButton onClick={() => { stop(); setStep("quiz") }} className="bg-[#6C63FF] text-white shadow-[0_5px_0_#4B42D6]">
                Start the quiz ➜
              </KidButton>
            </div>
          </>
        )}

        {step === "quiz" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold opacity-70">
                Question {index + 1} of {questions.length}
              </p>
              <p className="text-2xl" aria-label={`${score} right so far`}>
                {questions.map((_, i) => (
                  <span key={i} aria-hidden className={i < index || (i === index && picked !== null) ? "" : "opacity-25 grayscale"}>
                    ⭐
                  </span>
                ))}
              </p>
            </div>
            <p key={index} className="mt-5 animate-kid-pop text-3xl leading-snug font-semibold sm:text-4xl">
              {questions[index].q}
            </p>
            <p className="mt-3 h-7 text-lg font-medium" aria-live="polite">
              {picked === null ? "" : picked === questions[index].answer ? "🎉 Yes! Great job!" : `Almost! It’s “${questions[index].choices[questions[index].answer]}”.`}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {questions[index].choices.map((c, i) => (
                <KidButton
                  key={c}
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  state={picked === null ? "idle" : i === questions[index].answer ? "right" : i === picked ? "wrong" : "dim"}
                  className={cn("h-auto min-h-20 justify-start gap-3 px-5 py-4 text-left text-xl leading-snug", choiceColors[i % choiceColors.length])}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/70 text-lg font-bold">{String.fromCharCode(65 + i)}</span>
                  {c}
                </KidButton>
              ))}
            </div>
          </>
        )}

        {step === "done" && (
          <div className="py-4 text-center">
            <p className="flex justify-center gap-2 text-7xl" aria-label={`${stars} of 3 stars`}>
              {[1, 2, 3].map((n) => (
                <span key={n} aria-hidden className={cn("animate-kid-pop", n <= stars ? "" : "opacity-25 grayscale")} style={{ animationDelay: `${n * 150}ms` }}>
                  ⭐
                </span>
              ))}
            </p>
            <h2 className="mt-5 text-4xl font-bold">{stars === 3 ? "Amazing! 🎉" : stars === 2 ? "Great job! 👏" : stars === 1 ? "Good try! 💪" : "Let’s try again! 🌱"}</h2>
            <p className="mt-2 text-xl opacity-75">
              You got {score} of {questions.length} right. Your teacher can see your stars.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <KidButton onClick={again} className="bg-[#FFD166] text-[#2B2140] shadow-[0_5px_0_#E0A800]">
                🔁 Try again
              </KidButton>
              <Link
                to="/discover"
                className="flex h-16 items-center justify-center rounded-[20px] bg-[#6C63FF] px-8 text-xl font-semibold text-white shadow-[0_5px_0_#4B42D6] outline-none transition-transform active:translate-y-1 active:shadow-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
              >
                More lessons ➜
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
