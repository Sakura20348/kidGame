import { useCallback, useEffect, useRef, useState } from "react"

const supported = typeof window !== "undefined" && "speechSynthesis" in window

function englishVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === "en-US" && /female|samantha|google us/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  )
}

/** Short phrases (split at , . ! ? ; :) with their position in the full text.
 *  Each phrase is its own utterance, so the highlight re-syncs often. */
function splitPhrases(text: string) {
  const out: { text: string; offset: number }[] = []
  const re = /[^,.!?…;:]+[,.!?…;:]*["”’]?\s*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) if (m[0].trim()) out.push({ text: m[0], offset: m.index })
  return out.length ? out : [{ text, offset: 0 }]
}

/** Rough syllable count – spoken length follows syllables, not letters. */
function syllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "")
  if (/^\d+$/.test(word)) return word.length // numbers: ~1 syllable per digit
  const groups = w.replace(/e$/, "").match(/[aeiouy]+/g)?.length ?? 1
  return Math.max(1, groups)
}

/** Words of a phrase with their relative spoken "weight". */
function wordsOf(text: string) {
  const out: { index: number; weight: number }[] = []
  const re = /[A-Za-z0-9’'-]+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) out.push({ index: m.index, weight: 0.35 + 0.65 * syllables(m[0]) })
  return out
}

// Learned speed of the current voice: ms per weight unit at rate 1.
// Starts with a typical value and adapts after every spoken phrase.
let msPerUnit = 250

/**
 * Read text aloud with the browser's built-in voice.
 * `charIndex` follows the word being spoken (for karaoke-style highlighting):
 * real word-boundary events when the voice has them, a timing estimate when not.
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [charIndex, setCharIndex] = useState(-1)
  const session = useRef(0) // ignores events from speech that was stopped
  const timer = useRef<number | undefined>(undefined)

  const clearTimer = useCallback(() => {
    if (timer.current !== undefined) window.clearInterval(timer.current)
    timer.current = undefined
  }, [])

  const stop = useCallback(() => {
    if (!supported) return
    session.current++
    clearTimer()
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setCharIndex(-1)
  }, [clearTimer])

  const speak = useCallback(
    (text: string, rate = 0.85) => {
      if (!supported) return
      const synth = window.speechSynthesis
      const id = ++session.current
      clearTimer()
      synth.cancel()

      const voice = englishVoice()
      const chunks = splitPhrases(text)
      let realBoundaries = false

      chunks.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk.text)
        u.lang = "en-US"
        u.rate = rate
        u.pitch = 1.1
        if (voice) u.voice = voice
        const words = wordsOf(chunk.text)
        const units = words.reduce((sum, w) => sum + w.weight, 0)
        let t0 = 0

        u.onstart = () => {
          if (id !== session.current) return
          t0 = performance.now()
          setCharIndex(chunk.offset + (words[0]?.index ?? 0))
          if (realBoundaries || words.length < 2) return
          // No boundary events from this voice – follow the words on a timer.
          const unit = msPerUnit / rate
          const starts: number[] = []
          let acc = 0
          for (const w of words) {
            starts.push(acc)
            acc += w.weight * unit
          }
          clearTimer()
          let last = -1
          timer.current = window.setInterval(() => {
            if (id !== session.current || realBoundaries) return clearTimer()
            const elapsed = performance.now() - t0
            let k = 0
            while (k + 1 < starts.length && starts[k + 1] <= elapsed) k++
            if (k !== last) {
              last = k
              setCharIndex(chunk.offset + words[k].index)
            }
          }, 30)
        }
        u.onboundary = (e) => {
          if (id !== session.current || (e.name && e.name !== "word")) return
          realBoundaries = true
          clearTimer()
          setCharIndex(chunk.offset + e.charIndex)
        }
        const finish = (e?: Event) => {
          if (id !== session.current) return
          clearTimer()
          // Learn this voice's real speed from how long the phrase took.
          if (!realBoundaries && e?.type === "end" && t0 && units >= 2) {
            const measured = ((performance.now() - t0) * rate) / units
            if (measured > 80 && measured < 700) msPerUnit = msPerUnit * 0.6 + measured * 0.4
          }
          if (i === chunks.length - 1) {
            setSpeaking(false)
            setCharIndex(-1)
          }
        }
        u.onend = finish
        u.onerror = finish
        synth.speak(u)
      })

      setSpeaking(true)
      setCharIndex(chunks[0].offset)
    },
    [clearTimer]
  )

  // stop talking when the page closes
  useEffect(
    () => () => {
      session.current++
      clearTimer()
      if (supported) window.speechSynthesis.cancel()
    },
    [clearTimer]
  )

  return { supported, speak, stop, speaking, charIndex }
}
