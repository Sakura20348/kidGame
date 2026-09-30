import type { ReactElement } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  FolderAddIcon,
  Logout01Icon,
  Settings02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAvatar } from "@/lib/avatar"
import { useAuth } from "@/lib/contexts"
import { useProjects } from "@/lib/contexts"
import { cn } from "@/lib/utils"

export function UserAvatar({ className }: { className?: string }) {
  const { initials, email, name } = useAuth()
  const photo = useAvatar(email)
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F2B46B] text-sm font-extrabold text-green-900",
        className
      )}
    >
      {photo ? <img src={photo} alt={name || "Profile photo"} className="size-full object-cover" /> : initials}
    </span>
  )
}

const menuItem =
  "relative h-11 gap-3 rounded-[10px] px-3.5 text-[15px] font-medium text-foreground " +
  "before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-link before:opacity-0 " +
  "data-highlighted:bg-link/12 data-highlighted:text-link data-highlighted:before:opacity-100 " +
  "focus:bg-link/12 focus:text-link not-data-[variant=destructive]:focus:**:text-link"

/** Account popup: profile, settings, new project and sign-out. */
export function AccountMenu({ trigger }: { trigger: ReactElement }) {
  const { signOut, role } = useAuth()
  const { openNewProject } = useProjects()
  const navigate = useNavigate()
  const student = role === "student"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Account" render={trigger} />
      <DropdownMenuContent align="end" sideOffset={8} className="w-auto min-w-60 rounded-[16px] p-2">
        <DropdownMenuItem className={menuItem} onClick={() => navigate(student ? "/student" : "/dashboard")}>
          <HugeiconsIcon icon={DashboardSquare01Icon} className="size-5" />
          {student ? "My workspace" : "Dashboard"}
        </DropdownMenuItem>
        <DropdownMenuItem className={menuItem} onClick={() => navigate(student ? "/profile" : "/dashboard/profile")}>
          <HugeiconsIcon icon={UserCircleIcon} className="size-5" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className={menuItem} onClick={() => navigate(student ? "/settings" : "/dashboard/settings")}>
          <HugeiconsIcon icon={Settings02Icon} className="size-5" />
          Settings
        </DropdownMenuItem>
        {!student && (
          <DropdownMenuItem className={menuItem} onClick={openNewProject}>
            <HugeiconsIcon icon={FolderAddIcon} className="size-5" />
            New project
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem
          className={menuItem}
          onClick={() => {
            signOut()
            navigate("/login", { replace: true })
          }}
        >
          <HugeiconsIcon icon={Logout01Icon} className="size-5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
