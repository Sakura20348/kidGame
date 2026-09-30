import { useState } from "react"
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home01Icon, RocketIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"

type Props = { code: string; title: string; message: string; onRetry?: () => void }

/** Kid-style error screen: a rocket blasts off from Earth and lands on the Moon. */
export function RocketErrorPage({ code, title, message, onRetry }: Props) {
  const [flight, setFlight] = useState(0) // bump to replay the launch

  return (
    <main className="relative flex min-h-svh items-center overflow-hidden bg-[radial-gradient(ellipse_at_top,#2A2466_0%,#16123A_45%,#0B0A1E_100%)] font-kids text-white">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-4 px-4 py-8 sm:px-8 md:grid-cols-[1fr_1.1fr] md:gap-12">
        {/* words */}
        <div className="order-2 text-center md:order-1 md:text-left">
          <p className="bg-linear-to-br from-[#FFD166] to-[#FF8A5B] bg-clip-text text-[96px] leading-none font-bold text-transparent sm:text-[128px]">{code}</p>
          <h1 className="mt-3 text-4xl leading-tight font-semibold sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-white/75 md:mx-0">{message}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Button
              className="h-14 gap-2 rounded-[18px] bg-[#FFD166] px-6 text-lg font-semibold text-[#2B2140] shadow-[0_5px_0_#E0A800] hover:bg-[#FFD166]/90 active:translate-y-1 active:shadow-[0_1px_0_#E0A800]"
              render={<Link to="/" />}
              nativeButton={false}
            >
              <HugeiconsIcon icon={Home01Icon} className="size-5" />
              Back home
            </Button>
            <Button
              variant="ghost"
              className="h-14 gap-2 rounded-[18px] bg-white/10 px-6 text-lg font-semibold text-white shadow-[0_5px_0_rgba(255,255,255,0.08)] hover:bg-white/15 hover:text-white active:translate-y-1 active:shadow-none"
              onClick={onRetry ?? (() => setFlight((f) => f + 1))}
            >
              <HugeiconsIcon icon={RocketIcon} className="size-5" />
              {onRetry ? "Try again" : "Launch again"}
            </Button>
          </div>
        </div>

        {/* space scene */}
        <div className="order-1 mx-auto w-full max-w-[240px] sm:max-w-[320px] md:order-2 md:max-w-[420px]">
          <RocketScene key={flight} />
        </div>
      </div>
    </main>
  )
}

const stars = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 97) % 400,
  y: (i * 53) % 400,
  r: i % 5 === 0 ? 2.2 : i % 2 ? 1.2 : 1.6,
  delay: `${(i % 7) * 0.35}s`,
}))

function RocketScene() {
  return (
    <svg viewBox="0 0 400 560" className="h-auto w-full" role="img" aria-label="A rocket flies from the Earth to the Moon">
      {/* stars */}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFF7D6" className="star-twinkle" style={{ animationDelay: s.delay }} />
      ))}

      {/* Moon with a sleepy smile */}
      <g>
        <circle cx="300" cy="200" r="60" fill="#FFE7A3" />
        <circle cx="300" cy="200" r="60" fill="none" stroke="#F5C95B" strokeWidth="4" />
        <circle cx="272" cy="178" r="9" fill="#F2CF73" />
        <circle cx="330" cy="228" r="12" fill="#F2CF73" />
        <circle cx="322" cy="174" r="6" fill="#F2CF73" />
        <path d="M 282 206 q 6 6 12 0" stroke="#8A6A1F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 306 206 q 6 6 12 0" stroke="#8A6A1F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 290 222 q 10 9 20 0" stroke="#8A6A1F" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="278" cy="218" r="6" fill="#FFB5A0" opacity="0.7" />
        <circle cx="322" cy="218" r="6" fill="#FFB5A0" opacity="0.7" />
      </g>

      {/* Earth (land is clipped to the round planet) */}
      <defs>
        <clipPath id="earth-clip">
          <circle cx="200" cy="770" r="310" />
        </clipPath>
        {/* soft fade at the bottom so the planet doesn't end in a hard edge */}
        <linearGradient id="earth-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.8" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="earth-mask">
          <rect x="0" y="440" width="400" height="120" fill="url(#earth-fade)" />
        </mask>
      </defs>
      <g clipPath="url(#earth-clip)" mask="url(#earth-mask)">
        <circle cx="200" cy="770" r="310" fill="#4FACFE" />
        <path d="M 40 520 q 40 -40 90 -20 q 30 15 20 45 q -40 20 -110 5 z" fill="#2BC0A4" />
        <path d="M 250 480 q 50 -20 90 10 q 20 25 -10 40 q -50 5 -80 -20 z" fill="#2BC0A4" />
        <path d="M 170 540 q 30 -15 60 0 q 10 15 -20 20 q -30 0 -40 -20 z" fill="#2BC0A4" />
        <ellipse cx="120" cy="490" rx="26" ry="8" fill="#FFFFFF" opacity="0.6" />
        <ellipse cx="300" cy="530" rx="30" ry="9" fill="#FFFFFF" opacity="0.5" />
      </g>
      <g>
        {/* launch pad */}
        <rect x="170" y="458" width="60" height="10" rx="4" fill="#6B6F80" />
        <rect x="180" y="466" width="8" height="18" fill="#50535F" />
        <rect x="212" y="466" width="8" height="18" fill="#50535F" />
      </g>

      {/* launch smoke */}
      {[
        { cx: 175, cy: 462, r: 16, d: "0s" },
        { cx: 225, cy: 462, r: 18, d: "0.08s" },
        { cx: 200, cy: 470, r: 20, d: "0.15s" },
        { cx: 160, cy: 470, r: 12, d: "0.22s" },
        { cx: 242, cy: 472, r: 13, d: "0.3s" },
      ].map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#E9E6F5" className="rocket-smoke" style={{ animationDelay: p.d }} />
      ))}

      {/* rocket – drawn with its base at (0, 0), nose pointing up */}
      <g className="rocket-trip">
        {/* flame */}
        <g className="rocket-flame">
          <path className="rocket-flicker" d="M -11 0 Q 0 44 11 0 Z" fill="#FF8A5B" />
          <path className="rocket-flicker" d="M -6 0 Q 0 26 6 0 Z" fill="#FFD166" />
        </g>
        {/* fins */}
        <path d="M -16 -26 L -30 -2 L -16 -8 Z" fill="#FF5E7E" />
        <path d="M 16 -26 L 30 -2 L 16 -8 Z" fill="#FF5E7E" />
        {/* body */}
        <path d="M -16 -8 L -16 -58 Q 0 -100 16 -58 L 16 -8 Z" fill="#F4F2FF" />
        <path d="M -16 -8 L 16 -8 L 14 0 L -14 0 Z" fill="#B8B3D9" />
        {/* nose */}
        <path d="M -12 -70 Q 0 -100 12 -70 Z" fill="#FF5E7E" />
        {/* window */}
        <circle cx="0" cy="-48" r="9" fill="#4FACFE" stroke="#6C63FF" strokeWidth="4" />
        <circle cx="-3" cy="-51" r="2.5" fill="#FFFFFF" opacity="0.9" />
        {/* stripe */}
        <rect x="-16" y="-28" width="32" height="6" fill="#6C63FF" />
      </g>
    </svg>
  )
}

/** Unknown address. */
export function NotFoundPage() {
  return <RocketErrorPage code="404" title="This page flew to the Moon!" message="We looked everywhere on Earth but couldn’t find it. Let’s fly back home." />
}

/** Shown by the router when a page crashes or isn’t found. */
export function RouteErrorPage() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  // TODO: report the error to your logging service
  return (
    <RocketErrorPage
      code="Oops!"
      title="Houston, we have a problem"
      message="Something went wrong on this page. Try again, or fly back home — your progress is safe."
      onRetry={() => window.location.reload()}
    />
  )
}
