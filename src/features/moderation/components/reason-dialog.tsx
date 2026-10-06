"use client";

import { useId, useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/action";
import { REASON_MAX } from "../schema";

/** Moderation dialog with a required reason. The server validates the reason again. */
export function ReasonDialog({
  trigger,
  triggerLabel,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  destructive,
  title,
  description,
  confirmLabel,
  successMessage,
  onConfirm,
}: {
  /** Button that opens the dialog. Omit it and pass `open` / `onOpenChange` to open from a menu item. */
  trigger?: ReactElement;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Confirm button in the danger color (Remove). */
  destructive?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  onConfirm: (reason: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = setControlledOpen ?? setInnerOpen;
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (!next) {
      setReason("");
      setError(null);
    }
  }

  function submit() {
    if (!reason.trim()) {
      setError("Enter a reason");
      return;
    }
    startTransition(async () => {
      const res = await onConfirm(reason);
      if (res.ok) {
        toast.success(successMessage);
        setOpen(false);
        setReason("");
        setError(null);
        router.refresh();
      } else {
        const fieldError = res.fieldErrors?.reason?.[0];
        if (fieldError) setError(fieldError);
        else toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger}>{triggerLabel}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId}>Reason</Label>
          <Textarea
            id={fieldId}
            value={reason}
            maxLength={REASON_MAX}
            disabled={pending}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
          />
          <p id={errorId} role={error ? "alert" : undefined} className="min-h-5 text-sm text-danger">
            {error}
          </p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>Cancel</DialogClose>
          <Button type="button" variant={destructive ? "destructive" : "default"} disabled={pending} onClick={submit}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
