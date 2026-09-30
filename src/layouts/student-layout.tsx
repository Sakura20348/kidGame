import { useState, useSyncExternalStore } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Quiz02Icon,
  ArrowLeft02Icon,
  BookOpen01Icon,
  ChartColumnIcon,
  DashboardSquare01Icon,
  FileUploadIcon,
  GameController03Icon,
  LibraryIcon,
  Menu01Icon,
} from "@hugeicons/core-free-icons"

import { IdCardButton } from "@/components/brand/id-card"
import { Logo } from "@/components/brand/logo"
import { StudentBell } from "@/components/messages"
import { ThemeToggle } from "@/components/brand/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SmoothScrollArea } from "@/components/motion/smooth-scroll"
import { useAuth } from "@/lib/contexts"
import { useSavedCount } from "@/lib/contexts"
import { doneAssignments, pendingAssignments } from "@/lib/assignment-progress"
import { LibraryProvider } from "@/lib/library"
import { cn } from "@/lib/utils"

type NavEntry = {
  to: string
  label: string
  icon: IconSvgElement
  end?: boolean
  badge?: "saved" | "assignments" | "done" | number
}

const studentNav: NavEntry[] = [
  { to: "/student", label: "Overview", icon: DashboardSquare01Icon, end: true },
  { to: "/student/materials", label: "Materials", icon: LibraryIcon, badge: "saved" },
  { to: "/student/assignments", label: "My assignments", icon: BookOpen01Icon, badge: "assignments" },
  { to: "/student/progress", label: "My progress", icon: ChartColumnIcon, badge: "done" },
  { to: "/student/submit", label: "Submit work", icon: FileUploadIcon },
  { to: "/live", label: "Lecture questions", icon: Quiz02Icon },
  { to: "/kids", label: "Play & learn", icon: GameController03Icon },
]

export default function StudentLayout() {
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
      {/* Desktop sidebar */}
      <aside className="hidden w-[320px] shrink-0 py-3 pl-3 min-[1100px]:block">
        <StudentSidebar />
      </aside>

      {/* Mobile / tablet drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(320px,85vw)] border-none bg-transparent p-0 data-[side=left]:sm:max-w-[320px]"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <StudentSidebar onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center gap-1 dark navbar-glass m-2 rounded-[18px] min-[1100px]:m-3 min-[1100px]:rounded-[22px] px-2 min-[700px]:px-8">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Menu"
            className="mr-1 min-[1100px]:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <HugeiconsIcon icon={Menu01Icon} className="size-6" />
          </Button>
          <p className="min-w-0 flex-1 truncate text-base">
            <span className="font-extrabold text-foreground">LittleReaderLab</span>
            <span className="whitespace-pre text-muted-foreground">{"   /   "}</span>
            <span className="font-semibold text-foreground">Student workspace</span>
          </p>
          <ThemeToggle />
          <StudentBell className="ml-2 size-12 rounded-full bg-muted text-foreground hover:bg-muted/80" />
        </header>

        <SmoothScrollArea
          className="@container flex-1 overflow-y-auto"
          contentClassName="mx-auto max-w-[1500px] px-4 pt-8 pb-12 @min-[700px]:px-8 @min-[1100px]:px-[52px] @min-[1100px]:pt-12"
        >
          <Outlet />
        </SmoothScrollArea>
      </div>
    </div>
  )
}

function StudentSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { name, email, role } = useAuth()
  const savedCount = useSavedCount()
  // live count of assignments still to do for this student's age group
  const pending = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("pragmalab:assignments", onChange)
      return () => window.removeEventListener("pragmalab:assignments", onChange)
    },
    () => pendingAssignments(email)
  )
  const done = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("pragmalab:assignments", onChange)
      return () => window.removeEventListener("pragmalab:assignments", onChange)
    },
    () => doneAssignments(email)
  )
  const navigate = useNavigate()

  return (
    <div className="sidebar-glass flex h-full flex-col overflow-y-auto px-5 pt-6 pb-5 min-[1100px]:rounded-[22px]">
      <Logo onDark size="md" className="px-1.5" />

      {/* Profile card */}
      <div className="mt-6 flex items-center gap-3 rounded-[16px] bg-white/8 px-[15px] py-4">
        <IdCardButton role="Student" avatarClassName="size-[42px]" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-white" title={email ?? undefined}>
            {name || email}
          </p>
          <p className="mt-0.5 text-xs text-white/75">Student Workspace</p>
        </div>
      </div>

      <nav className="mt-9 flex flex-col gap-2">
        {studentNav.filter((item) => role === "student" || item.to !== "/kids").map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
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
            {item.badge !== undefined && (
              <span className="rounded-full bg-current/14 px-[9px] py-1 text-xs font-bold">
                {item.badge === "saved" ? savedCount : item.badge === "assignments" ? pending : item.badge === "done" ? done : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="min-h-8 flex-1" />

      <div>
        <div className="sidebar-divider mb-6" />
        <button
          className="flex h-14 w-full items-center gap-4 rounded-[14px] px-[18px] text-[17px] font-semibold text-white outline-none transition-colors hover:bg-white/6 focus-visible:bg-white/18"
          onClick={() => {
            onNavigate?.()
            navigate(role === "student" ? "/discover" : "/dashboard")
          }}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-6" />
          {role === "student" ? "Back to Discover" : "Back to Dashboard"}
        </button>
      </div>
    </div>
  )
}
