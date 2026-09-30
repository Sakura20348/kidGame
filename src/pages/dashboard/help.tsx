import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, MinusSignIcon, Search01Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/motion/reveal"
import { allArticles, articleText, helpCategories, type Block } from "@/data/help"
import { cn } from "@/lib/utils"

export default function HelpPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState("")
  const article = allArticles.find((a) => a.id === params.get("a")) ?? allArticles[0]
  const [openCats, setOpenCats] = useState<Set<string>>(() => new Set([article.category.id]))

  const q = query.trim().toLowerCase()
  const results = q
    ? allArticles.filter((a) => `${a.title} ${articleText(a)} ${a.category.title}`.toLowerCase().includes(q))
    : []

  function show(id: string) {
    setParams({ a: id }, { replace: true })
    const cat = allArticles.find((a) => a.id === id)?.category.id
    if (cat) setOpenCats((s) => new Set(s).add(cat))
  }

  function toggle(id: string) {
    setOpenCats((s) => {
      const next = new Set(s)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  const related = article.category.articles.filter((a) => a.id !== article.id).slice(0, 3)

  return (
    <div className="mx-auto max-w-[1300px]">
      {/* ---------------- hero */}
      {/* not overflow-hidden, so the search results can drop below the hero */}
      <Reveal className="relative z-20 rounded-[28px] border border-white/60 bg-linear-to-br from-[#EAF7F0] via-[#E3EEFB] to-[#EFF7F2] px-7 py-12 shadow-[0_20px_50px_-30px_rgba(31,107,79,0.45)] sm:px-12 sm:py-16 dark:border-white/10 dark:from-[#17302A] dark:via-[#1A2740] dark:to-[#15261F]">
        {/* decorations are clipped on their own layer */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <div className="absolute -top-24 -left-20 size-72 rounded-full bg-[#BFE8D2]/60 blur-3xl dark:bg-[#2F7BDD]/25" />
          <div className="absolute -bottom-28 left-1/3 size-80 rounded-full bg-[#C9DDFB]/60 blur-3xl dark:bg-[#3E5FA8]/20" />
          <GlassQuestion />
        </div>
        <div className="relative max-w-[640px]">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Help &amp; Guides</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Explore guides, tips, and answers designed to help you teach, learn and play smarter — faster.
          </p>
          <div className="relative mt-8 max-w-[420px]">
            <HugeiconsIcon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-muted-foreground dark:text-white/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  show(results[0].id)
                  setQuery("")
                }
              }}
              placeholder="Search help articles..."
              aria-label="Search help articles"
              className="h-12 w-full rounded-full border border-white/70 bg-white/80 pr-4 pl-11 text-[15px] shadow-[0_8px_24px_-12px_rgba(31,107,79,0.35)] outline-none backdrop-blur placeholder:text-muted-foreground focus-visible:border-link dark:border-white/10 dark:bg-white/10"
            />
            {q && (
              <div className="absolute inset-x-0 top-14 z-30 max-h-96 animate-in overflow-y-auto rounded-[18px] border border-border bg-card p-2 shadow-2xl fade-in-0 slide-in-from-top-1" data-lenis-prevent>
                {results.length ? (
                  results.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        show(a.id)
                        setQuery("")
                      }}
                      className="flex w-full flex-col rounded-[12px] px-3 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
                    >
                      <span className="text-[15px] font-medium text-foreground">{a.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.category.emoji} {a.category.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-sm text-muted-foreground">No articles match “{query}”.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ---------------- categories + article */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <nav aria-label="Help categories" className="lg:sticky lg:top-4">
          <p className="mb-3 text-xs font-bold tracking-[0.14em] text-link">CATEGORIES</p>
          <ul>
            {helpCategories.map((c) => {
              const open = openCats.has(c.id)
              return (
                <li key={c.id} className="border-b border-border/70 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-expanded={open}
                    className="flex h-12 w-full items-center gap-3 text-left text-[16px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <span aria-hidden>{c.emoji}</span>
                    <span className="flex-1">{c.title}</span>
                    <HugeiconsIcon icon={open ? MinusSignIcon : Add01Icon} className="size-4 text-muted-foreground" />
                  </button>
                  {open && (
                    <ul className="mb-3 space-y-1 animate-in fade-in-0 slide-in-from-top-1">
                      {c.articles.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => show(a.id)}
                            aria-current={a.id === article.id ? "page" : undefined}
                            className={cn(
                              "w-full rounded-[12px] px-3 py-2 text-left text-sm leading-snug outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                              a.id === article.id
                                ? "bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8] font-medium text-white shadow-[0_4px_12px_-4px_rgba(47,123,221,0.6)]"
                                : "text-muted-foreground hover:bg-[#3B8BE8]/10 hover:text-foreground"
                            )}
                          >
                            {a.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <Reveal key={article.id} as="article" className="rounded-[28px] border border-border bg-card/70 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur sm:p-10">
          <p className="text-sm font-semibold text-link">
            {article.category.emoji} {article.category.title}
          </p>
          <h2 className="mt-2 text-3xl leading-tight font-semibold text-foreground sm:text-4xl">{article.title}</h2>
          <div className="mt-6 space-y-4 rounded-[22px] border border-border bg-card p-6 text-[16px] leading-relaxed text-foreground shadow-[0_8px_30px_-20px_rgba(0,0,0,0.25)] sm:p-8">
            {article.body.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
          </div>

          <Feedback key={article.id} />

          {related.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-bold tracking-[0.14em] text-muted-foreground">RELATED QUESTIONS</p>
              <div className="flex flex-wrap gap-2">
                {related.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => show(a.id)}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none transition-colors hover:border-link/50 hover:bg-[#3B8BE8]/8 focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  if ("h" in block) return <p className="pt-2 font-semibold">{block.h}</p>
  if ("list" in block)
    return (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#2F7BDD]">
        {block.list.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    )
  return <p>{block.p}</p>
}

function Feedback() {
  const [vote, setVote] = useState<"yes" | "no" | null>(null)
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      {vote ? (
        <span className="animate-bubble-in">{vote === "yes" ? "Thanks! Glad it helped 💚" : "Thanks — we’ll make this answer clearer."}</span>
      ) : (
        <>
          <span>Was this helpful?</span>
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setVote(v)
                toast(v === "yes" ? "Thanks for the feedback!" : "Thanks — noted.")
              }}
              className="rounded-full border border-border bg-card px-3 py-1 text-base outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label={v === "yes" ? "Yes, helpful" : "No, not helpful"}
            >
              {v === "yes" ? "👍" : "👎"}
            </button>
          ))}
        </>
      )}
    </div>
  )
}

/** A glossy, floating question mark (like frosted glass). */
function GlassQuestion() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 260"
      className="pointer-events-none absolute top-1/2 right-[4%] hidden h-[115%] -translate-y-1/2 animate-kid-float md:block"
    >
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#CFEBDD" stopOpacity="0.55" />
          <stop offset="1" stopColor="#9CC9F0" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#7FB9A0" stopOpacity="0.6" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <ellipse cx="100" cy="250" rx="46" ry="7" fill="#2F7BDD" opacity="0.15" filter="url(#soft)" />
      <path
        d="M52 78c0-30 24-52 52-52s50 20 50 48c0 24-14 36-30 46-12 8-18 14-18 28v10h-30v-14c0-22 10-34 26-44 12-8 20-14 20-26 0-12-8-20-20-20-13 0-22 9-22 24z"
        fill="url(#glass)"
        stroke="url(#edge)"
        strokeWidth="3"
      />
      <circle cx="91" cy="212" r="18" fill="url(#glass)" stroke="url(#edge)" strokeWidth="3" />
      <path d="M66 70c2-18 16-32 34-34" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9" />
      <circle cx="85" cy="206" r="4" fill="#FFFFFF" opacity="0.9" />
    </svg>
  )
}
