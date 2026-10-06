import type { AssetStatus, UserStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ASSET_STATUS_LABELS, USER_STATUS_LABELS } from "@/lib/reference";

type Status = UserStatus | AssetStatus;

const LABEL: Record<Status, string> = { ...USER_STATUS_LABELS, ...ASSET_STATUS_LABELS };

const VARIANT: Record<Status, "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  ACTIVE: "success",
  PUBLISHED: "success",
  SUSPENDED: "warning",
  REMOVED: "destructive",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

/** Status of a user (Active, Suspended, Removed) or an asset (Draft, Published, Archived, Removed). */
export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <Badge variant={VARIANT[status]} className={className}>
      {LABEL[status]}
    </Badge>
  );
}
