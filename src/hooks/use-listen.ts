import { useCallback, useEffect, useRef, useState } from "react"

// The browser's speech recognition (Chrome, Edge, Safari). Not in TypeScript's DOM types yet.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

const Ctor: RecognitionCtor | undefined =
  typeof window === "undefined"
    ? undefined
    : ((window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition)

const friendlyError: Record<string, string> = {
  "not-allowed": "The microphone is blocked. Allow it in your browser (the 🔒 or 🎤 icon next to the address) and try again.",
  "service-not-allowed": "The microphone is blocked. Allow it in your browser and try again.",
  "no-speech": "We didn’t hear anything. Speak a little louder and closer to the microphone.",
  "audio-capture": "No microphone was found. Connect one and try again.",
  network: "Speech recognition needs an internet connection.",
}

/**
 * Listens to the microphone and turns speech into text (English).
 * `transcript` grows while the student speaks; `listening` is true until they stop.
 */
export function useListen(lang = "en-US") {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const rec = useRef<Recognition | null>(null)
  const finalText = useRef("")

  useEffect(() => () => rec.current?.abort(), [])

  const start = useCallback(() => {
    if (!Ctor) return
    rec.current?.abort()
    const r = new Ctor()
    r.lang = lang
    r.continuous = true
    r.interimResults = true
    finalText.current = ""
    setTranscript("")
    setError(null)
    r.onresult = (e) => {
      let interim = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalText.current += `${res[0].transcript} `
        else interim += res[0].transcript
      }
      setTranscript(`${finalText.current}${interim}`.trim())
    }
    r.onerror = (e) => {
      if (e.error !== "aborted") setError(friendlyError[e.error] ?? `The microphone stopped (${e.error}). Try again.`)
    }
    r.onend = () => setListening(false)
    rec.current = r
    try {
      r.start()
      setListening(true)
    } catch {
      setError("The microphone couldn’t start. Try again.")
    }
  }, [lang])

  const stop = useCallback(() => rec.current?.stop(), [])

  return { supported: !!Ctor, listening, transcript, error, start, stop }
}

// ------------------------------------------------------------ checking what was said

const clean = (w: string) =>
  w
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']/g, "")

/** Target text split into words (with their original spelling for display). */
export const targetWords = (text: string) => text.split(/\s+/).filter((w) => clean(w))

/**
 * Which target words were said, in order (longest common subsequence), so a skipped
 * or wrong word doesn't shift everything after it.
 */
export function matchSpoken(target: string, spoken: string): boolean[] {
  const t = targetWords(target).map(clean)
  const s = spoken.split(/\s+/).map(clean).filter(Boolean)
  const dp = Array.from({ length: t.length + 1 }, () => new Array<number>(s.length + 1).fill(0))
  for (let i = t.length - 1; i >= 0; i--)
    for (let j = s.length - 1; j >= 0; j--) dp[i][j] = t[i] === s[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const hit = new Array<boolean>(t.length).fill(false)
  for (let i = 0, j = 0; i < t.length && j < s.length; ) {
    if (t[i] === s[j]) {
      hit[i] = true
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return hit
}
