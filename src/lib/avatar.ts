import { useSyncExternalStore } from "react"

import { kidsKey } from "@/lib/kids-storage"

// Profile photo per account, kept on this device as a small JPEG data URL.
// TODO: upload to the server once accounts live there.
const EVENT = "pragmalab:avatar"

export function getAvatar(email: string | null): string | null {
  try {
    return localStorage.getItem(kidsKey(email, "avatar"))
  } catch {
    return null
  }
}

export function setAvatar(email: string | null, dataUrl: string | null) {
  try {
    if (dataUrl) localStorage.setItem(kidsKey(email, "avatar"), dataUrl)
    else localStorage.removeItem(kidsKey(email, "avatar"))
  } catch {
    // storage full or blocked – the photo just isn't kept
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

/** The account's photo; every avatar re-renders when it changes. */
export function useAvatar(email: string | null) {
  return useSyncExternalStore(
    subscribe,
    () => getAvatar(email),
    () => null
  )
}

/** Centre-crops any image/video frame to a square JPEG (256×256). */
export function squareJpeg(source: CanvasImageSource, width: number, height: number, mirror = false) {
  const size = 256
  const side = Math.min(width, height)
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  if (mirror) {
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, size, size)
  return canvas.toDataURL("image/jpeg", 0.85)
}
