import { cn } from "@/lib/utils"

const stars = [
  [8, 10, 2], [18, 26, 1.5], [30, 8, 1], [44, 18, 2], [58, 6, 1.5], [66, 30, 1], [80, 14, 1.5], [92, 24, 2],
  [12, 44, 1], [36, 38, 1.5], [52, 48, 1], [74, 42, 2], [88, 50, 1], [22, 60, 1.5], [62, 64, 1], [94, 70, 1.5],
] as const

/**
 * Decorative sky behind a panel: sun, rays and drifting clouds by day;
 * moon and twinkling stars at night (follows the light / dark theme).
 * Put it inside a `relative overflow-hidden` element that has the `sky-panel` background.
 */
export function SkyScene({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 @container overflow-hidden", className)}>
      {/* ---------- day */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute top-[7%] right-[9%] size-[clamp(90px,11vw,170px)]">
          <div className="absolute -inset-[60%] rounded-full bg-[radial-gradient(circle,rgb(255_230_150/0.55),transparent_65%)]" />
          <div className="absolute -inset-[35%] animate-[spin_60s_linear_infinite] rounded-full bg-[repeating-conic-gradient(rgb(255_236_170/0.35)_0deg_8deg,transparent_8deg_30deg)] [mask-image:radial-gradient(circle,black_45%,transparent_72%)]" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFF6C8,#FFD166_55%,#FFB547)] shadow-[0_0_60px_rgb(255_200_90/0.7)]" />
        </div>
        <Cloud className="top-[20%] left-[-10%] w-[36%] animate-cloud opacity-95" />
        <Cloud className="top-[46%] left-[-30%] w-[26%] animate-cloud-slow opacity-80" />
        <Cloud className="top-[70%] left-[-20%] w-[44%] animate-cloud opacity-70 [animation-delay:-18s]" />
        <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[radial-gradient(ellipse_70%_100%_at_25%_100%,rgb(255_255_255/0.55),transparent_70%),radial-gradient(ellipse_60%_90%_at_85%_100%,rgb(255_255_255/0.45),transparent_70%)]" />
      </div>

      {/* ---------- night */}
      <div className="absolute inset-0 hidden dark:block">
        {stars.map(([x, y, r], i) => (
          <span
            key={i}
            className="star-twinkle absolute rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, animationDelay: `${(i % 5) * 0.5}s`, boxShadow: r > 1.5 ? "0 0 6px rgb(255 255 255 / 0.8)" : undefined }}
          />
        ))}
        <div className="absolute top-[8%] right-[10%] size-[clamp(70px,8vw,120px)]">
          <div className="absolute -inset-[70%] rounded-full bg-[radial-gradient(circle,rgb(220_225_255/0.25),transparent_65%)]" />
          {/* crescent: a light disc with a sky-coloured disc over it */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_40%_40%,#FFFBEA,#F2E7B8)] shadow-[0_0_40px_rgb(242_231_184/0.6)]" />
          <div className="absolute top-[-8%] left-[28%] size-full rounded-full bg-[#070B20]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[22%] bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgb(90_100_200/0.35),transparent_70%)]" />
      </div>
    </div>
  )
}

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 80" className={cn("absolute drop-shadow-[0_8px_12px_rgb(20_60_140/0.15)]", className)}>
      <path
        d="M40 70 C18 70 8 56 14 44 C20 32 36 30 44 34 C48 18 66 8 84 12 C98 4 122 6 132 22 C150 16 172 26 170 44 C188 46 194 62 184 70 Z"
        fill="white"
      />
    </svg>
  )
}
