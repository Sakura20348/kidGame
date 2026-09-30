import { RouterProvider } from "react-router-dom"

import { NetworkStatus } from "@/components/network-status"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/lib/auth"
import { ThemeProvider } from "@/lib/theme"
import { router } from "@/routes"

export default function App() {
  return (
    <AuthProvider>
      {/* each signed-in account keeps its own light / dark choice */}
      <ThemeProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-center" />
          <NetworkStatus />
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
