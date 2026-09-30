import { Navigate, Outlet, useLocation } from "react-router-dom"

import { findAccount, needsClass } from "@/lib/accounts"
import { hasAccess } from "@/lib/classes"
import { useAuth } from "@/lib/contexts"
import { ProjectsProvider } from "@/lib/projects"
import { Notifier } from "@/components/notifier"

/**
 * Sends signed-out visitors to /login and brings them back afterwards.
 * Signed-in people need access too: teachers confirm the code sent to their
 * email (/verify), students join a teacher's class (/join), and students from
 * older accounts pick their class 0–4 first (/choose-class).
 */
export function RequireAuth() {
  const { email, role } = useAuth()
  const location = useLocation()
  const { pathname } = location
  const from = location.pathname + location.search

  if (!email) {
    return <Navigate to="/login" replace state={{ from }} />
  }
  // older accounts (Class 5–11 / adults) choose a class 0–4 once
  if (needsClass(findAccount(email)) && pathname !== "/choose-class") {
    return <Navigate to="/choose-class" replace state={{ from }} />
  }
  if (!hasAccess(email, role) && pathname !== "/verify" && pathname !== "/join" && pathname !== "/choose-class") {
    return <Navigate to={role === "student" ? "/join" : "/verify"} replace state={{ from }} />
  }
  return (
    <ProjectsProvider>
      <Outlet />
      <Notifier />
    </ProjectsProvider>
  )
}
