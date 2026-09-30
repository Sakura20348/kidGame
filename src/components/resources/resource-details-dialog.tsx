import { toast } from "sonner"

import type { Resource } from "@/data/resources"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth, useLibrary, useProjects } from "@/lib/contexts"

type Props = {
  resource: Resource | null
  onClose: () => void
  onStart: (r: Resource) => void
}

export function ResourceDetailsDialog({ resource: r, onClose, onStart }: Props) {
  const { deleteLesson } = useProjects()
  const { saved, toggleSave } = useLibrary()
  const teacher = useAuth().role !== "student" // teachers plan with lessons, students start them

  return (
    <Dialog open={r !== null} onOpenChange={(open) => !open && onClose()}>
      {r && (
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-[28px] bg-card p-6 sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="pr-8 font-serif text-[26px] leading-tight font-normal text-foreground">
              {r.title}
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-[1.6] text-muted-foreground">
              {r.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Level {r.level} · {r.ageGroup} · {r.topic}
            </p>
            <p className="text-sm text-muted-foreground">
              Source: {r.source} · {r.speaker} · {r.tasks} tasks
            </p>
          </div>
          <DialogFooter className="bg-transparent">
            {r.custom && teacher && (
              <Button
                variant="destructive"
                className="rounded-[12px] font-semibold sm:mr-auto"
                onClick={() => {
                  deleteLesson(r)
                  onClose()
                  toast(`Project “${r.title}” deleted`, { description: "You can restore it from Deleted lessons for 5 days." })
                }}
              >
                Delete project
              </Button>
            )}
            <DialogClose render={<Button variant="ghost" className="rounded-[12px] font-semibold text-link" />}>
              Close
            </DialogClose>
            {teacher ? (
              <Button className="rounded-[12px] font-semibold" onClick={() => toggleSave(r)}>
                {saved.has(r.id) ? "In my projects ✓" : "Add to my projects"}
              </Button>
            ) : (
              <Button className="rounded-[12px] font-semibold" onClick={() => onStart(r)}>
                Start lesson
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
