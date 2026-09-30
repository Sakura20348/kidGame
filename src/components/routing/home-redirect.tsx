import { Navigate } from "react-router-dom"

import { homeFor } from "@/lib/accounts"
import { useAuth } from "@/lib/contexts"

/** "/" sends students to their workspace and teachers to the dashboard. */
export function HomeRedirect() {
  const { role } = useAuth()
  return <Navigate to={homeFor(role)} replace />
}
