import { RoleBadge } from "@/components/shared/role-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { AdminUserRow } from "../queries";
import { UserRowActions } from "./user-row-actions";

export const USER_ROW_HEIGHT = "h-14";

export function UsersTable({ items }: { items: AdminUserRow[] }) {
  return (
    <div className="rounded-xl border bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Assets</TableHead>
            <TableHead className="w-14 px-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((u) => (
            <TableRow key={u.id} className={USER_ROW_HEIGHT}>
              <TableCell className="max-w-48 truncate px-4 font-medium" title={u.name}>
                {u.name}
              </TableCell>
              <TableCell className="max-w-56 truncate" title={u.email}>
                {u.email}
              </TableCell>
              <TableCell className="max-w-48 truncate text-text-muted" title={u.companyName ?? undefined}>
                {u.companyName ?? "-"}
              </TableCell>
              <TableCell>
                <RoleBadge role={u.role} />
              </TableCell>
              <TableCell>
                <StatusBadge status={u.status} />
              </TableCell>
              <TableCell className="text-text-muted tabular-nums">{formatDate(u.createdAt)}</TableCell>
              <TableCell className="text-right tabular-nums">{u.role === "SELLER" ? u._count.assets : "-"}</TableCell>
              <TableCell className="px-4 text-right">
                <UserRowActions id={u.id} name={u.name} role={u.role} status={u.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
