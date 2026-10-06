"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { removeAsset, validateAsset } from "../actions";
import { ReasonDialog } from "./reason-dialog";

/**
 * Row menu of `/admin/assets`: View, Validate, Remove from listings. Hiding actions is a convenience:
 * the server checks role, asset status and the reason again.
 */
export function AssetRowActions({
  id,
  status,
  validated,
}: {
  id: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED";
  validated: boolean;
}) {
  const router = useRouter();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function validate() {
    startTransition(async () => {
      const res = await validateAsset(id);
      if (res.ok) {
        toast.success("Asset validated");
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
            <Button variant="ghost" size="icon" aria-label={`Actions for asset #${id}`} disabled={pending}>
              <MoreHorizontalIcon aria-hidden />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem render={<Link href={`/assets/${id}`} />}>View</DropdownMenuItem>
          {status === "PUBLISHED" && !validated && <DropdownMenuItem onClick={validate}>Validate</DropdownMenuItem>}
          {status !== "REMOVED" && (
            <DropdownMenuItem variant="destructive" onClick={() => setRemoveOpen(true)}>
              Remove from listings
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReasonDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        destructive
        title="Remove this asset from listings?"
        description="The asset disappears from the catalog. The seller sees the reason and cannot edit or publish it again."
        confirmLabel="Remove from listings"
        successMessage="Asset removed from listings"
        onConfirm={(reason) => removeAsset({ assetId: id, reason })}
      />
    </>
  );
}
