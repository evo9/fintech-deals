import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/reference";

const VARIANT = { BUYER: "buyer", SELLER: "seller", MANAGER: "manager" } as const;

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <Badge variant={VARIANT[role]} className={className}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}
