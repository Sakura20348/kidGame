import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpen01Icon } from "@hugeicons/core-free-icons"

import { Logo } from "@/components/brand/logo"
import { SkyScene } from "@/components/brand/sky-scene"

/** Left sky panel (shown on wide screens only): sunny by day, starry at night. */
export function BrandPanel() {
  return (
    <div className="sky-panel relative hidden flex-1 overflow-hidden min-[900px]:flex">
      <SkyScene />

      <div className="relative flex min-h-svh w-full flex-col px-[clamp(32px,6.5vw,132px)] py-14">
        <Logo onDark />
        <div className="flex-1" />

        <div className="py-12 [text-shadow:0_2px_12px_rgb(10_30_80/0.35)]">
          <p className="text-[13px] font-bold tracking-[0.15em] text-sun">READ · EXPLORE · GROW</p>
          <h2 className="mt-6 font-serif text-[clamp(44px,4.6vw,84px)] leading-[1.02] tracking-[-1px] text-white">Read. Explore. Grow.</h2>
          <p className="mt-7 max-w-[560px] text-[20px] leading-[1.6] text-white/90">Interactive reading adventures for young English learners.</p>

          <div className="mt-12 flex max-w-[560px] items-center gap-4 rounded-[16px] border border-white/25 bg-white/15 px-[22px] py-5 backdrop-blur-sm dark:bg-white/7">
            <HugeiconsIcon icon={BookOpen01Icon} className="size-[26px] shrink-0 text-sun" />
            <p className="font-serif text-lg text-white italic">“Every story is a new adventure.”</p>
          </div>
        </div>

        <div className="flex-1" />
        <p className="text-[15px] text-white/80">Made for curious young readers and the teachers who guide them.</p>
      </div>
    </div>
  )
}
