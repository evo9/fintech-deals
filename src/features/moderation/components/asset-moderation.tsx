"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeAsset, validateAsset } from "../actions";
import { ReasonDialog } from "./reason-dialog";

/** Validate / Remove from listings for a manager. The server checks role, status and the asset again. */
export function AssetModerationActions({
  id,
  status,
  validated,
}: {
  id: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED";
  validated: boolean;
}) {
  const router = useRouter();
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
    <div className="flex flex-col gap-2">
      {status === "PUBLISHED" && !validated && (
        <Button type="button" className="h-10" disabled={pending} onClick={validate}>
          Validate
        </Button>
      )}
      {status !== "REMOVED" && (
        <ReasonDialog
          trigger={<Button type="button" variant="outline" className="h-10" disabled={pending} />}
          triggerLabel="Remove from listings"
          title="Remove this asset from listings?"
          description="The asset disappears from the catalog. The seller sees the reason and cannot edit or publish it again."
          confirmLabel="Remove from listings"
          successMessage="Asset removed from listings"
          onConfirm={(reason) => removeAsset({ assetId: id, reason })}
        />
      )}
    </div>
  );
}
