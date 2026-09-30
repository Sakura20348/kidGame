import { useState } from "react"

import { UserAvatar } from "@/components/brand/account-menu"
import { Logo } from "@/components/brand/logo"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { isStudentId } from "@/lib/accounts"
import { useAvatar } from "@/lib/avatar"
import { useAuth } from "@/lib/contexts"
import { readJoined } from "@/lib/presence"

/** Teachers (no student ID): a stable 9-digit number from the email, shown as "102 564 284". */
function idNumber(email: string) {
  let h = 2166136261
  for (const ch of email) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const n = String((h >>> 0) % 900_000_000 + 100_000_000)
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
}

const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`

/** The user's avatar as a button that opens their ID card. */
export function IdCardButton({ role, avatarClassName }: { role: string; avatarClassName?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label="Show my ID card"
        title="My ID card"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-white/50"
      >
        <UserAvatar className={avatarClassName} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100svh-2rem)] w-auto max-w-none overflow-y-auto bg-transparent p-0 shadow-none ring-0 sm:max-w-none dark:ring-0"
        >
          <DialogTitle className="sr-only">My ID card</DialogTitle>
          <DialogDescription className="sr-only">Your LittleReaderLab member card.</DialogDescription>
          <IdCard role={role} />
        </DialogContent>
      </Dialog>
    </>
  )
}

function IdCard({ role }: { role: string }) {
  const { email, name, initials, role: accountRole } = useAuth()
  const photo = useAvatar(email)
  const roleLabel = accountRole ? accountRole[0].toUpperCase() + accountRole.slice(1) : role
  const joined = readJoined().find((u) => u.email === email)
  const joinDate = joined ? new Date(joined.joinedAt) : new Date()
  const expireDate = new Date(joinDate)
  expireDate.setFullYear(joinDate.getFullYear() + 1)

  return (
    <div className="relative flex min-h-[730px] w-[500px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] bg-white text-[#173A6B] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]">
      {/* Geometric sky header */}
      <svg viewBox="0 0 320 210" className="absolute inset-x-0 top-0 w-full" aria-hidden>
        <polygon points="0,0 320,0 320,120 230,170 150,110 70,160 0,120" fill="#2466C9" />
        <polygon points="0,0 190,0 90,95" fill="#1F5FBF" />
        <polygon points="190,0 320,0 260,70" fill="#2F7BDD" />
        <polygon points="120,40 200,20 170,95" fill="#3B8BE8" opacity="0.7" />
        <polygon points="230,60 300,40 290,120" fill="#173A6B" opacity="0.55" />
        <polygon points="20,90 80,70 60,140" fill="#3B8BE8" opacity="0.6" />
        <polygon points="260,110 320,90 320,160" fill="#8DBBFF" opacity="0.75" />
        <polygon points="0,130 40,150 0,180" fill="#8DBBFF" opacity="0.8" />
        <polygon points="30,170 70,160 45,200" fill="#BFE0FF" />
        <polygon points="250,170 285,185 262,205" fill="#BFE0FF" />
        <polygon points="150,110 190,120 165,150" fill="#FFD166" opacity="0.7" />
      </svg>

      {/* Logo */}
      <div className="relative px-8 pt-8">
        <Logo onDark size="md" />
      </div>

      {/* Photo */}
      <div className="relative mt-7 flex justify-center">
        <div className="rounded-[44px] bg-white p-2 shadow-[0_6px_16px_rgba(23,58,107,0.25)]">
          <div className="flex size-[168px] items-center justify-center overflow-hidden rounded-[36px] border-[5px] border-[#8DBBFF] bg-[#F2B46B] text-6xl font-extrabold text-[#173A6B]">
            {photo ? <img src={photo} alt="" className="size-full object-cover" /> : initials}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="relative flex flex-1 flex-col justify-center px-9 pt-8 pb-12 text-center">
        <p className="line-clamp-2 text-[36px] leading-tight font-bold tracking-wide break-words text-[#173A6B]">{name || email}</p>
        <p className="mt-1.5 text-xl text-[#5F6B66]">{roleLabel}</p>

        <p className="mt-8 text-[30px] font-semibold">
          <span className="text-[#173A6B]">{roleLabel} ID: </span>
          <span className="text-[#2F7BDD] tabular-nums">{isStudentId(email) ? email!.trim() : idNumber(email ?? "")}</span>
        </p>

        <dl className="mx-auto mt-4 grid w-fit grid-cols-[auto_auto] gap-x-10 gap-y-2.5 text-left text-lg">
          <dt className="text-[#2F7BDD]">Join:</dt>
          <dd className="font-medium text-[#173A6B] tabular-nums">{fmt(joinDate)}</dd>
          <dt className="text-[#2F7BDD]">Expire:</dt>
          <dd className="font-medium text-[#173A6B] tabular-nums">{fmt(expireDate)}</dd>
        </dl>
      </div>

      {/* Bottom stripes */}
      <div aria-hidden className="relative">
        <div className="h-4 bg-[#B2DCC6]" />
        <div className="h-2.5 bg-[#8DBBFF]" />
        <div className="h-4 bg-[#B2DCC6]" />
      </div>
    </div>
  )
}
