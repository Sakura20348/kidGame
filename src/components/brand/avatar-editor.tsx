import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, Delete02Icon, RepeatIcon, Tick02Icon, Upload04Icon } from "@hugeicons/core-free-icons"

import { UserAvatar } from "@/components/brand/account-menu"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { setAvatar, squareJpeg, useAvatar } from "@/lib/avatar"
import { useAuth } from "@/lib/contexts"
import { cn } from "@/lib/utils"

/** Avatar with a camera badge that opens a take-a-photo dialog. */
export function AvatarEditor({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change profile photo"
        title="Change profile photo"
        className="group relative shrink-0 rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
      >
        <UserAvatar className={className} />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border-2 border-card bg-linear-to-br from-[#2F7BDD] to-[#3B8BE8] text-white shadow-md transition-transform group-hover:scale-110">
          <HugeiconsIcon icon={Camera01Icon} className="size-3.5" />
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-[28px] bg-card p-6 sm:max-w-[440px]">
          {open && <PhotoTaker onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

type Mode = "starting" | "live" | "preview" | "nocamera"

function PhotoTaker({ onDone }: { onDone: () => void }) {
  const { email } = useAuth()
  const current = useAvatar(email)
  const video = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>("starting")
  const [problem, setProblem] = useState("")
  const [shot, setShot] = useState<string | null>(null)

  // Start the front camera while the dialog is open (external system → effect).
  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setProblem("This browser can’t use the camera. You can upload a photo instead.")
        setMode("nocamera")
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false })
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        if (video.current) {
          video.current.srcObject = stream
          await video.current.play().catch(() => {})
        }
        setMode("live")
      } catch (e) {
        const name = (e as DOMException)?.name
        setProblem(
          name === "NotAllowedError"
            ? "Camera access was blocked. Allow the camera in your browser’s address bar, or upload a photo."
            : name === "NotFoundError"
              ? "No camera was found on this device. You can upload a photo instead."
              : "The camera couldn’t start. You can upload a photo instead."
        )
        setMode("nocamera")
      }
    }
    void start()
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function take() {
    const v = video.current
    if (!v || !v.videoWidth) return
    setShot(squareJpeg(v, v.videoWidth, v.videoHeight, true)) // mirrored like a selfie
    setMode("preview")
  }

  function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) return toast.error("Please choose a picture file.")
    const img = new Image()
    img.onload = () => {
      setShot(squareJpeg(img, img.naturalWidth, img.naturalHeight))
      setMode("preview")
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => toast.error("That picture couldn’t be opened.")
    img.src = URL.createObjectURL(file)
  }

  function save() {
    if (!shot) return
    setAvatar(email, shot)
    toast.success("Profile photo updated 📸")
    onDone()
  }

  function remove() {
    setAvatar(email, null)
    toast("Profile photo removed")
    onDone()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">Profile photo</DialogTitle>
        <DialogDescription>Smile! Your photo shows on your avatar and ID card.</DialogDescription>
      </DialogHeader>

      {/* round viewfinder */}
      <div className="relative mx-auto mt-2 size-64 overflow-hidden rounded-full bg-muted ring-4 ring-[#3B8BE8]/40">
        <video
          ref={video}
          muted
          playsInline
          className={cn("size-full -scale-x-100 object-cover", mode !== "live" && "hidden")}
        />
        {mode === "preview" && shot && <img src={shot} alt="Your new photo" className="size-full animate-kid-pop object-cover" />}
        {mode === "starting" && <p className="flex size-full items-center justify-center text-muted-foreground">Starting camera…</p>}
        {mode === "nocamera" && (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center">
            <HugeiconsIcon icon={Camera01Icon} className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{problem}</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {mode === "live" && (
          <Button onClick={take} className="h-12 gap-2 rounded-[12px] bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8] text-base font-semibold text-white">
            <HugeiconsIcon icon={Camera01Icon} className="size-5" /> Take photo
          </Button>
        )}
        {mode === "preview" && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-12 gap-2 rounded-[12px] text-base dark:bg-transparent"
              onClick={() => {
                setShot(null)
                setMode(video.current?.srcObject ? "live" : "nocamera")
              }}
            >
              <HugeiconsIcon icon={RepeatIcon} className="size-5" /> Retake
            </Button>
            <Button onClick={save} className="h-12 gap-2 rounded-[12px] bg-linear-to-r from-[#2F7BDD] to-[#3B8BE8] text-base font-semibold text-white">
              <HugeiconsIcon icon={Tick02Icon} className="size-5" /> Use photo
            </Button>
          </div>
        )}
        <Button variant="outline" className="h-11 gap-2 rounded-[12px] dark:bg-transparent" onClick={() => fileRef.current?.click()}>
          <HugeiconsIcon icon={Upload04Icon} className="size-5" /> Upload from device
        </Button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
        {current && (
          <Button variant="ghost" className="h-10 gap-2 rounded-[12px] text-destructive" onClick={remove}>
            <HugeiconsIcon icon={Delete02Icon} className="size-4" /> Remove photo
          </Button>
        )}
      </div>
    </>
  )
}
