import { Navigate, Outlet, useLocation } from "react-router-dom"

import { homeFor, type Role } from "@/lib/accounts"
import { useAuth } from "@/lib/contexts"
import SettingsPage from "@/pages/settings"

/** Only lets one role in; everyone else goes back to their own home. */
export function RequireRole({ role }: { role: Role }) {
  const { role: current } = useAuth()
  // older sessions without a saved role are treated as teachers (as before)
  return (current ?? "teacher") === role ? <Outlet /> : <Navigate to={homeFor(current)} replace />
}

/** "/settings": students see Settings in the main app, teachers inside their dashboard. */
export function SettingsRoute() {
  const { role } = useAuth()
  return role === "student" ? <SettingsPage /> : <Navigate to="/dashboard/settings" replace />
}

/** Student-side pages and their dashboard version for teachers. */
const teacherPages: Record<string, string> = {
  "/discover": "/dashboard/lessons",
  "/library": "/dashboard/projects",
  "/profile": "/dashboard/profile",
  "/settings": "/dashboard/settings",
}

/** The student side of the app: teachers are sent to the matching dashboard page. */
export function StudentSide() {
  const { role } = useAuth()
  const { pathname, search } = useLocation()
  if (role === "student") return <Outlet />
  return <Navigate to={(teacherPages[pathname] ?? "/dashboard") + search} replace />
}
