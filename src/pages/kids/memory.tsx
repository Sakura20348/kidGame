import { type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"

import { cn } from "@/lib/utils"
import { Connections } from "@/pages/kids/connections"
import { WordSolitaire } from "@/pages/kids/word-solitaire"

const modes = [
  { id: "connections", label: "🔗 Connections" },
  { id: "solitaire", label: "🃏 Word Solitaire" },
] as const

/** Word Connect: "Connections" (find the groups) and "Word Solitaire" (sort words into categories). */
export default function MemoryMatchPage() {
  const [params, setParams] = useSearchParams()
  const mode = params.get("mode") === "solitaire" ? "solitaire" : "connections"
  const modeSwitch: ReactNode = (
    <div role="tablist" aria-label="Game mode" className="mb-5 flex w-fit gap-1 rounded-full bg-white p-1.5 shadow-[0_4px_0_rgba(0,0,0,0.06)] dark:bg-white/10">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={mode === m.id}
          onClick={() => setParams(m.id === "connections" ? {} : { mode: m.id }, { replace: true })}
          className={cn(
            "h-11 rounded-full px-5 text-[16px] font-semibold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40",
            mode === m.id ? "bg-linear-to-br from-[#B06AB3] to-[#7B4397] text-white" : "text-[#2B2140]/70 hover:text-[#2B2140] dark:text-white/70"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
  return mode === "solitaire" ? <WordSolitaire key="solitaire" modeSwitch={modeSwitch} /> : <Connections key="connections" modeSwitch={modeSwitch} />
}
