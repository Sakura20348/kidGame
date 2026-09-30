import { Link, Outlet } from "react-router-dom"

import { useAuth, useKids } from "@/lib/contexts"
import { KidsProvider } from "@/lib/kids"

/** Kids area – shown inside the main app shell (sidebar + top bar). */
export default function KidsLayout() {
  const { email } = useAuth()
  return (
    // keyed by email: switching accounts loads that account's own stars
    <KidsProvider key={email ?? "guest"} email={email}>
      <Panel />
    </KidsProvider>
  )
}

function Panel() {
  const { stars } = useKids()

  return (
    <div className="relative isolate min-h-[calc(100svh-11rem)] overflow-hidden rounded-[32px] bg-[#FFF6E5] px-4 pt-4 pb-10 font-kids text-[#2B2140] sm:px-6 sm:pt-6 dark:bg-[#14121F] dark:text-[#F3EEFF]">
      {/* soft background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-[#FFD166]/40 blur-3xl dark:bg-[#6C63FF]/20" />
        <div className="absolute top-1/3 -right-32 size-[28rem] rounded-full bg-[#7AD3FF]/35 blur-3xl dark:bg-[#2BC0A4]/15" />
        <div className="absolute -bottom-40 left-1/3 size-96 rounded-full bg-[#FF8FB1]/30 blur-3xl dark:bg-[#FF5E7E]/15" />
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/kids"
          className="flex items-center gap-2.5 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#FFD166] text-2xl shadow-[0_4px_0_#E0A800]">
            🦉
          </span>
          <span className="leading-none">
            <span className="block text-2xl font-semibold tracking-tight">LittleReaderLab Kids</span>
            <span className="mt-1 inline-block rounded-full bg-[#6C63FF] px-2 py-0.5 text-xs font-semibold text-white">
              Class 0–11
            </span>
          </span>
        </Link>
        <div className="flex-1" />
        <span
          aria-label={`${stars} stars`}
          className="flex h-12 items-center gap-2 rounded-full bg-white px-4 text-xl font-semibold shadow-[0_4px_0_rgba(0,0,0,0.08)] dark:bg-white/10"
        >
          <span aria-hidden>⭐</span>
          {stars}
        </span>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}
