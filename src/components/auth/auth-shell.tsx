import type { ReactNode } from "react"

import { BrandPanel } from "@/components/auth/brand-panel"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/brand/theme-toggle"

/** Split screen used by sign-in and sign-up: brand panel + form side. */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh">
      <BrandPanel />

      <div className="relative flex min-h-svh flex-1 items-center justify-center bg-background px-6 py-8">
        <ThemeToggle className="absolute top-3 right-3" />

        <div className="w-full max-w-[540px] animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <Logo className="mb-10 min-[900px]:hidden" />
          <p className="text-[13px] font-bold tracking-[0.12em] text-link">{eyebrow}</p>
          <h1 className="mt-3.5 font-serif text-[32px] leading-[1.15] text-foreground min-[900px]:text-[44px]">
            {title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
