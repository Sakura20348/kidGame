import { useImperativeHandle, useRef, type KeyboardEvent, type ReactNode, type Ref } from "react"

import { cn } from "@/lib/utils"

const KEYWORDS = new Set(["for", "in", "range", "while", "if", "elif", "else", "and", "or", "not", "True", "False", "None", "pass"])
const FUNCTIONS = new Set(["right", "left", "up", "down", "print", "say", "str", "int", "len", "abs", "min", "max"])

/** Colours one line of Python (comments, strings, keywords, functions, numbers). */
function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index))
    const [text, comment, str, num, name] = m
    const cls = comment
      ? "text-[#8A8FA8] italic"
      : str
        ? "text-[#2E9E5B] dark:text-[#8BE28B]"
        : num
          ? "text-[#E0781B] dark:text-[#FFB86B]"
          : name && KEYWORDS.has(name)
            ? "font-semibold text-[#8E44AD] dark:text-[#D6A1FF]"
            : name && FUNCTIONS.has(name)
              ? "text-[#1E6FD9] dark:text-[#7CC4FF]"
              : ""
    out.push(
      <span key={m.index} className={cls}>
        {text}
      </span>
    )
    last = m.index + text.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

export type CodeEditorHandle = {
  /** Inserts a snippet on a new line at the cursor, keeping indentation. */
  insert: (snippet: string) => void
  focus: () => void
}

type Props = {
  value: string
  onChange: (v: string) => void
  onRun: () => void
  activeLine?: number | null
  errorLine?: number | null
  readOnly?: boolean
  ref?: Ref<CodeEditorHandle>
}

const INDENT = "    "

export function CodeEditor({ value, onChange, onRun, activeLine, errorLine, readOnly, ref }: Props) {
  const area = useRef<HTMLTextAreaElement>(null)
  const lines = value.split("\n")

  /** Replace the selection with `text` and place the cursor after it. */
  function replace(start: number, end: number, text: string, caret = start + text.length) {
    const next = value.slice(0, start) + text + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      area.current?.setSelectionRange(caret, caret)
    })
  }

  useImperativeHandle(ref, () => ({
    focus: () => area.current?.focus(),
    insert: (snippet: string) => {
      const el = area.current
      if (!el) return
      const pos = el.selectionStart
      const lineStart = value.lastIndexOf("\n", pos - 1) + 1
      const current = value.slice(lineStart, value.indexOf("\n", pos) === -1 ? value.length : value.indexOf("\n", pos))
      const indent = current.match(/^\s*/)?.[0] ?? ""
      const onEmpty = current.trim() === ""
      const body = snippet.endsWith(":") ? `${snippet}\n${indent}${INDENT}` : snippet
      if (onEmpty) {
        // fill the empty line
        const lineEnd = lineStart + current.length
        replace(lineStart, lineEnd, indent + body)
      } else {
        const lineEnd = value.indexOf("\n", pos) === -1 ? value.length : value.indexOf("\n", pos)
        replace(lineEnd, lineEnd, `\n${indent}${body}`)
      }
      el.focus()
    },
  }))

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    const { selectionStart: s, selectionEnd: end } = el
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      onRun()
      return
    }
    if (e.key === "Escape") {
      el.blur() // lets keyboard users Tab out of the editor
      return
    }
    if (e.key === "Tab") {
      e.preventDefault()
      const lineStart = value.lastIndexOf("\n", s - 1) + 1
      if (e.shiftKey) {
        const removable = value.slice(lineStart, lineStart + 4).match(/^ {1,4}/)?.[0].length ?? 0
        if (removable) replace(lineStart, lineStart + removable, "", Math.max(lineStart, s - removable))
      } else replace(s, end, INDENT)
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const lineStart = value.lastIndexOf("\n", s - 1) + 1
      const before = value.slice(lineStart, s)
      let indent = before.match(/^\s*/)?.[0] ?? ""
      if (before.trimEnd().endsWith(":")) indent += INDENT
      replace(s, end, `\n${indent}`)
      return
    }
    if (e.key === "Backspace" && s === end) {
      // delete a whole indent step at once
      const lineStart = value.lastIndexOf("\n", s - 1) + 1
      const before = value.slice(lineStart, s)
      if (before.length && /^ +$/.test(before) && before.length % 4 === 0) {
        e.preventDefault()
        replace(s - 4, s, "")
      }
    }
  }

  return (
    <div
      className="relative max-h-[420px] min-h-[260px] overflow-auto rounded-[20px] bg-[#FBF8F1] font-mono text-[17px] leading-8 shadow-inner dark:bg-[#0F0D18]"
      data-lenis-prevent
      onClick={() => area.current?.focus()}
    >
      <div className="relative flex min-w-full w-max">
        {/* line numbers */}
        <div aria-hidden className="sticky left-0 z-10 shrink-0 bg-[#F1ECE0] py-3 text-right text-[#A09A8A] select-none dark:bg-[#17142A] dark:text-[#5E587A]">
          {lines.map((_, i) => (
            <div
              key={i}
              className={cn(
                "px-3",
                activeLine === i + 1 && "bg-[#FFD166] text-[#2B2140]",
                errorLine === i + 1 && "bg-[#FF5E7E] text-white"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="relative flex-1 py-3">
          {/* coloured code (behind) */}
          <pre aria-hidden className="pointer-events-none m-0 px-4 whitespace-pre text-[#2B2140] dark:text-[#E9E4FF]">
            {lines.map((l, i) => (
              <div
                key={i}
                className={cn(
                  "min-h-8 transition-colors",
                  activeLine === i + 1 && "bg-[#FFD166]/35",
                  errorLine === i + 1 && "bg-[#FF5E7E]/20"
                )}
              >
                {l ? highlight(l) : " "}
              </div>
            ))}
          </pre>
          {/* real text box (on top, transparent text, visible caret) */}
          <textarea
            ref={area}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            aria-label="Python code"
            className="absolute inset-0 resize-none overflow-hidden bg-transparent px-4 py-3 whitespace-pre text-transparent caret-[#6C63FF] outline-none selection:bg-[#6C63FF]/25 dark:caret-[#FFD166]"
          />
        </div>
      </div>
    </div>
  )
}
