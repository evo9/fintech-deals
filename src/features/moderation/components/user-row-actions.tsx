"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { removeUser, restoreUser, suspendUser } from "../actions";
import { ReasonDialog } from "./reason-dialog";

type Dialog = "suspend" | "remove" | null;

/**
 * Row menu of `/admin/users`: Suspend / Restore / Remove. Managers and removed users have no actions.
 * Hiding them is a convenience: the server checks role, target and status again.
 */
export function UserRowActions({
  id,
  name,
  role,
  status,
}: {
  id: string;
  name: string;
  role: "BUYER" | "SELLER" | "MANAGER";
  status: "ACTIVE" | "SUSPENDED" | "REMOVED";
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pending, startTransition] = useTransition();

  if (role === "MANAGER" || status === "REMOVED") return null;

  function restore() {
    startTransition(async () => {
      const res = await restoreUser({ userId: id });
      if (res.ok) {
        toast.success("User restored");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`} disabled={pending}>
              <MoreHorizontalIcon aria-hidden />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-40">
          {status === "ACTIVE" && <DropdownMenuItem onClick={() => setDialog("suspend")}>Suspend</DropdownMenuItem>}
          {status === "SUSPENDED" && <DropdownMenuItem onClick={restore}>Restore</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("remove")}>
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReasonDialog
        open={dialog === "suspend"}
        onOpenChange={(open) => setDialog(open ? "suspend" : null)}
        title={`Suspend ${name}?`}
        description="They can still log in and see a banner with the reason, but cannot change or send anything. Their assets and profile are hidden from the catalogs until you restore them."
        confirmLabel="Suspend"
        successMessage="User suspended"
        onConfirm={(reason) => suspendUser({ userId: id, reason })}
      />
      <ReasonDialog
        open={dialog === "remove"}
        onOpenChange={(open) => setDialog(open ? "remove" : null)}
        destructive
        title={`Remove ${name}?`}
        description="They can no longer log in and their content is hidden. This cannot be undone in the interface."
        confirmLabel="Remove"
        successMessage="User removed"
        onConfirm={(reason) => removeUser({ userId: id, reason })}
      />
    </>
  );
}
