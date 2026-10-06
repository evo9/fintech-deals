"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { republishAsset, withdrawAsset } from "../actions";

/** Edit / Withdraw / Republish of the owner. The server checks ownership and status again. */
export function OwnerActions({
  id,
  status,
  suspended,
}: {
  id: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  suspended: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function run(action: (id: number) => ReturnType<typeof withdrawAsset>, done: string) {
    startTransition(async () => {
      const res = await action(id);
      setConfirmOpen(false);
      if (res.ok) {
        toast.success(done);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {suspended ? (
        <span title="Your account is suspended" className="flex">
          <Button type="button" variant="outline" disabled className="h-10 flex-1">
            Edit
          </Button>
        </span>
      ) : (
        <Link
          href={`/my-assets/${id}/edit`}
          className={cn(buttonVariants({ variant: "outline" }), "h-10 border-primary text-primary")}
        >
          Edit
        </Link>
      )}

      {status === "PUBLISHED" && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger
            render={<Button type="button" variant="outline" className="h-10" disabled={pending || suspended} />}
          >
            Withdraw
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw this asset?</DialogTitle>
              <DialogDescription>
                Buyers will no longer see it in the catalog. You can republish it at any time.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>Cancel</DialogClose>
              <Button type="button" disabled={pending} onClick={() => run(withdrawAsset, "Asset withdrawn")}>
                Withdraw
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {status === "ARCHIVED" && (
        <Button
          type="button"
          className="h-10"
          disabled={pending || suspended}
          onClick={() => run(republishAsset, "Asset republished")}
        >
          Republish
        </Button>
      )}
    </div>
  );
}
