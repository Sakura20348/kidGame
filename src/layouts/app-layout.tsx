import { useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  GameController03Icon,
  LibraryIcon,
  FolderLibraryIcon,
  GridViewIcon,
  Menu01Icon,
  Quiz02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { AccountMenu, UserAvatar } from "@/components/brand/account-menu"
import { IdCardButton } from "@/components/brand/id-card"
import { Logo } from "@/components/brand/logo"
import { StudentBell } from "@/components/messages"
import { ThemeToggle } from "@/components/brand/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SmoothScrollArea } from "@/components/motion/smooth-scroll"
import { useAuth, useSavedCount } from "@/lib/contexts"
import { LibraryProvider } from "@/lib/library"
import { cn } from "@/lib/utils"

// Breakpoints (measured on the viewport / content area)
//   < 700   phone   -> 1 card per row, drawer menu
//   < 1100  tablet  -> 2 cards, drawer menu
//   >= 1100 desktop -> sidebar always visible, 3 cards from 1300 content width

type NavEntry = {
  to: string
  label: string
  icon: IconSvgElement
  badge?: "saved" | number
}

const navItems: NavEntry[] = [
  { to: "/discover", label: "Discover", icon: GridViewIcon },
  { to: "/library", label: "Materials", icon: LibraryIcon, badge: "saved" },
  { to: "/live", label: "Lecture questions", icon: Quiz02Icon },
  { to: "/workspace", label: "My workspace", icon: UserGroupIcon },
  { to: "/kids", label: "Kids games", icon: GameController03Icon },
]

const extraTitles: Record<string, string> = {
  "/profile": "Profile",
  "/settings": "Settings",
}

export default function AppLayout() {
  return (
    <LibraryProvider>
      <Shell />
    </LibraryProvider>
  )
}

function Shell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()
  const { role } = useAuth()
  const title =
    (role !== "student" && pathname.startsWith("/library") ? "My projects" : undefined) ??
    navItems.find((n) => pathname.startsWith(n.to))?.label ??
    extraTitles[pathname] ??
    (pathname.startsWith("/lesson/") ? "Lesson" : undefined) ??
    ""

  return (
    <div
      className={cn(
        "flex h-svh transition-colors duration-300",
        // the kids area gets its own warm background behind everything
        pathname.startsWith("/kids") ? "bg-[#FFF6E5] dark:bg-[#14121F]" : "bg-[#F5F5F0] dark:bg-page"
      )}
    >
      {/* Desktop sidebar */}
      <aside className="hidden w-[320px] shrink-0 py-3 pl-3 min-[1100px]:block">
        <Sidebar />
      </aside>

      {/* Mobile / tablet drawer */}
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
        <TopBar title={title} onMenu={() => setDrawerOpen(true)} />
        <SmoothScrollArea
          className="@container flex-1 overflow-y-auto"
          contentClassName={cn(
            "mx-auto px-4 pt-8 pb-12 @min-[700px]:px-8 @min-[1100px]:px-12",
            // the kids area uses the full width
            pathname.startsWith("/kids") ? "max-w-none" : "max-w-[1500px]"
          )}
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
  const { role } = useAuth()

  return (
    <div className="sidebar-glass flex h-full flex-col overflow-y-auto px-5 pt-6 pb-5 min-[1100px]:rounded-[22px]">
      <Logo onDark size="md" className="px-1.5" />

      <nav className="mt-9 flex flex-col gap-2">
        {navItems.filter((item) => role === "student" || item.to !== "/kids").map((item) => (
          <NavItem
            key={item.to}
            item={role !== "student" && item.to === "/library" ? { ...item, label: "My projects", icon: FolderLibraryIcon } : item}
            badge={item.badge === "saved" ? savedCount : item.badge}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="min-h-8 flex-1" />

      {/* Workspace footer */}
      <div className="flex items-center gap-3">
        <IdCardButton role={role === "student" ? "Student" : "Teacher"} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-white">My workspace</p>
          <p className="mt-0.5 text-[13px] text-white/65">Progress is synced</p>
        </div>
        <AccountMenu
          trigger={
            <Button variant="ghost" size="icon-lg" className="text-white hover:bg-white/10 hover:text-white">
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-6" />
            </Button>
          }
        />
      </div>
    </div>
  )
}

function NavItem({
  item,
  badge,
  onClick,
}: {
  item: NavEntry
  badge?: number
  onClick?: () => void
}) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex h-14 items-center gap-4 rounded-[14px] px-[18px] text-[17px] font-semibold outline-none transition-colors focus-visible:bg-white/18",
          isActive
            ? "bg-white/12 text-white ring-1 ring-white/15"
            : "text-white hover:bg-white/6"
        )
      }
    >
      <HugeiconsIcon icon={item.icon} className="size-6" />
      <span className="flex-1">{item.label}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-current/14 px-[9px] py-1 text-xs font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

// =================================================================== top bar

function TopBar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const navigate = useNavigate()
  const student = useAuth().role === "student"

  return (
    <header className="@container shrink-0 dark navbar-glass m-2 rounded-[18px] min-[1100px]:m-3 min-[1100px]:rounded-[22px]">
      <div className="flex h-[72px] items-center px-2 @min-[700px]:px-8">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Menu"
          className="mr-1 min-[1100px]:hidden"
          onClick={onMenu}
        >
          <HugeiconsIcon icon={Menu01Icon} className="size-6" />
        </Button>

        <p className="min-w-0 flex-1 truncate text-base">
          <span className="hidden @min-[700px]:inline">
            <span className="font-extrabold text-foreground">LittleReaderLab</span>
            <span className="whitespace-pre text-muted-foreground">{"   /   "}</span>
          </span>
          <span className="font-semibold text-foreground">{title}</span>
        </p>

        <ThemeToggle />
        {student && <StudentBell className="ml-2 size-12 rounded-full bg-muted text-foreground hover:bg-muted/80" />}
        <Button
          className="ml-2 hidden h-auto rounded-[12px] px-5 py-[18px] text-sm font-extrabold @min-[700px]:inline-flex"
          onClick={() => navigate(student ? "/student" : "/dashboard")}
        >
          {student ? "My workspace" : "Open dashboard"}
        </Button>
        <AccountMenu
          trigger={
            <button className="ml-3 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
              <UserAvatar />
            </button>
          }
        />
      </div>
    </header>
  )
}
