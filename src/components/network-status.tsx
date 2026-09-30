import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { WifiDisconnected01Icon } from "@hugeicons/core-free-icons"

import { useOnline } from "@/hooks/use-online"

/** Shows a pill while offline and a toast when the connection comes back. */
export function NetworkStatus() {
  const online = useOnline()
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!online) wasOffline.current = true
    else if (wasOffline.current) {
      wasOffline.current = false
      toast.success("You’re back online")
    }
  }, [online])

  if (online) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-4 z-[60] mx-auto flex w-fit max-w-[calc(100%-2rem)] animate-in items-center gap-3 rounded-full bg-[#2B2140] px-5 py-3 text-sm text-white shadow-lg fade-in slide-in-from-bottom-4 dark:bg-white dark:text-[#2B2140]"
    >
      <HugeiconsIcon icon={WifiDisconnected01Icon} className="size-5 shrink-0" />
      <span>
        <span className="font-semibold">You’re offline.</span>{" "}
        <span className="opacity-80">Games, saved items and projects still work.</span>
      </span>
    </div>
  )
}
