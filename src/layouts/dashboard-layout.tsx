import { useEffect, useRef, useState, type ReactNode } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  FolderLibraryIcon,
  LibraryIcon,
  UserIcon,
  Bookmark01Icon,
  DashboardSquare01Icon,
  HelpCircleIcon,
  Logout03Icon,
  Menu01Icon,
  Search01Icon,
  Settings01Icon,
  UserMultipleIcon,
  FileAttachmentIcon,
  Quiz02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"

import { UserAvatar } from "@/components/brand/account-menu"
import { TeacherMessageButton } from "@/components/messages"
import { InboxButton } from "@/components/dashboard/inbox"
import { Logo } from "@/components/brand/logo"
import { ThemeToggle } from "@/components/brand/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SmoothScrollArea } from "@/components/motion/smooth-scroll"
import { useAuth, useSavedCount } from "@/lib/contexts"
import { LibraryProvider } from "@/lib/library"
import { cn } from "@/lib/utils"

type NavEntry = {
  to: string
  label: string
  icon: IconSvgElement
  end?: boolean
  badge?: "saved"
}

const menu: NavEntry[] = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardSquare01Icon, end: true },
  { to: "/dashboard/lessons", label: "Lessons", icon: LibraryIcon },
  { to: "/dashboard/projects", label: "My projects", icon: FolderLibraryIcon },
  { to: "/dashboard/library", label: "Student’s library", icon: Bookmark01Icon },
  { to: "/dashboard/students", label: "Student view", icon: UserCircleIcon },
  { to: "/dashboard/team", label: "Team", icon: UserMultipleIcon },
  { to: "/dashboard/papers", label: "Test papers", icon: FileAttachmentIcon },
  { to: "/dashboard/live", label: "Lecture questions", icon: Quiz02Icon },
]

export default function DashboardLayout() {
  return (
    <LibraryProvider>
      <Shell />
    </LibraryProvider>
  )
}

function Shell() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-svh bg-[#F5F5F0] dark:bg-page">
      <aside className="hidden w-[320px] shrink-0 py-3 pl-3 min-[1100px]:block">
        <Sidebar />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(320px,85vw)] border-none bg-transparent p-0 data-[side=left]:sm:max-w-[320px]"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setDrawerOpen(true)} />
        <SmoothScrollArea
          className="@container flex-1 overflow-y-auto"
          contentClassName="px-4 pt-8 pb-12 @min-[700px]:px-8 @min-[1100px]:px-12"
        >
          <Outlet />
        </SmoothScrollArea>
      </div>
    </div>
  )
}

// =================================================================== sidebar

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const savedCount = useSavedCount()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const counts = { saved: savedCount }

  return (
    <div className="sidebar-glass flex h-full flex-col overflow-y-auto px-5 pt-6 pb-5 min-[1100px]:rounded-[22px]">
      <Logo onDark size="md" className="px-1.5" />

      <SectionLabel>MENU</SectionLabel>
      <nav className="flex flex-col gap-2">
        {menu.map((item) => (
          <SideLink key={item.to} to={item.to} end={item.end} icon={item.icon} onClick={onNavigate}>
            {item.label}
            {item.badge && counts[item.badge] > 0 && (
              <span className="ml-auto rounded-full bg-current/14 px-[9px] py-1 text-xs font-bold">
                {counts[item.badge] > 12 ? "12+" : counts[item.badge]}
              </span>
            )}
          </SideLink>
        ))}
      </nav>

      <div className="sidebar-divider mt-6" />
      <SectionLabel>GENERAL</SectionLabel>
      <nav className="flex flex-col gap-2">
        <SideLink to="/dashboard/profile" icon={UserIcon} onClick={onNavigate}>
          Profile
        </SideLink>
        <SideLink to="/dashboard/settings" icon={Settings01Icon} onClick={onNavigate}>
          Settings
        </SideLink>
        <SideLink to="/dashboard/help" icon={HelpCircleIcon} onClick={onNavigate}>
          Help
        </SideLink>
        <SideButton
          icon={Logout03Icon}
          onClick={() => {
            signOut()
            navigate("/login", { replace: true })
          }}
        >
          Logout
        </SideButton>
      </nav>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mt-9 mb-3 px-[18px] text-xs font-bold tracking-[0.14em] text-white/55">{children}</p>
}

const sideItem =
  "flex h-14 items-center gap-4 rounded-[14px] px-[18px] text-[17px] font-semibold text-white outline-none transition-colors hover:bg-white/6 focus-visible:bg-white/18"

function SideLink({
  to,
  end,
  icon,
  onClick,
  children,
}: {
  to: string
  end?: boolean
  icon: IconSvgElement
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          sideItem,
          isActive && "bg-white/12 text-white ring-1 ring-white/15 hover:bg-white/12"
        )
      }
    >
      <HugeiconsIcon icon={icon} className="size-6" />
      {children}
    </NavLink>
  )
}

function SideButton({
  icon,
  onClick,
  children,
}: {
  icon: IconSvgElement
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button className={cn(sideItem, "w-full")} onClick={onClick}>
      <HugeiconsIcon icon={icon} className="size-6" />
      {children}
    </button>
  )
}

// =================================================================== top bar

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { name, email } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState("")
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

  // ⌘F / Ctrl+F focuses the search box
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const iconBtn = "size-12 rounded-full bg-[#F7F7F4] text-foreground hover:bg-muted dark:bg-muted"

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 dark navbar-glass m-2 rounded-[18px] min-[1100px]:m-3 min-[1100px]:rounded-[22px] px-2 min-[700px]:px-8">
      <Button variant="ghost" size="icon-lg" aria-label="Menu" className="min-[1100px]:hidden" onClick={onMenu}>
        <HugeiconsIcon icon={Menu01Icon} className="size-6" />
      </Button>

      <form
        role="search"
        className="relative min-w-0 flex-1 max-w-[440px]"
        onSubmit={(e) => {
          e.preventDefault()
          navigate(q.trim() ? `/dashboard/lessons?q=${encodeURIComponent(q.trim())}` : "/dashboard/lessons")
        }}
      >
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-foreground"
        />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search resources"
          aria-label="Search resources"
          className="h-12 w-full rounded-full bg-[#F7F7F4] pr-16 pl-12 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-muted"
        />
        <kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:block dark:bg-background">
          {isMac ? "⌘ F" : "Ctrl F"}
        </kbd>
      </form>

      <div className="flex-1" />
      <ThemeToggle />
      <InboxButton className={cn(iconBtn, "hidden sm:inline-flex")} />
      <TeacherMessageButton className={cn(iconBtn, "hidden sm:inline-flex")} />

      <button
        className="flex items-center gap-3 rounded-full py-1 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        onClick={() => navigate("/dashboard/profile")}
      >
        <UserAvatar className="size-12 text-base" />
        <span className="hidden min-w-0 text-left md:block">
          <span className="block truncate text-[17px] font-medium text-foreground">{name || email}</span>
          <span className="block truncate text-sm text-muted-foreground">{email}</span>
        </span>
      </button>
    </header>
  )
}
