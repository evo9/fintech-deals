import { BadgeCheckIcon } from "lucide-react";
import { CountryFlag } from "@/components/shared/country-flag";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAssetId, formatDate, formatPrice } from "@/lib/format";
import { ASSET_CATEGORY_LABELS, countryName } from "@/lib/reference";
import type { AdminAssetRow } from "../queries";
import { AssetRowActions } from "./asset-row-actions";

export const ASSET_ROW_HEIGHT = "h-14";

export function AssetsTable({ items }: { items: AdminAssetRow[] }) {
  return (
    <div className="rounded-xl border bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">ID</TableHead>
            <TableHead>Headline</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Validated</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-14 px-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => (
            <TableRow key={a.id} className={ASSET_ROW_HEIGHT}>
              <TableCell className="px-4 tabular-nums">{formatAssetId(a.id)}</TableCell>
              <TableCell className="max-w-64 truncate font-medium" title={a.headline}>
                {a.headline}
              </TableCell>
              <TableCell className="max-w-48 truncate" title={a.seller.companyName ?? a.seller.name}>
                {a.seller.companyName ?? a.seller.name}
              </TableCell>
              <TableCell>{ASSET_CATEGORY_LABELS[a.category]}</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <CountryFlag code={a.country} className="w-5" />
                  {countryName(a.country)}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPrice(a.askingPrice)}</TableCell>
              <TableCell>
                <StatusBadge status={a.status} />
              </TableCell>
              <TableCell>
                {a.validatedAt ? (
                  <span className="inline-flex items-center gap-1 text-success-text">
                    <BadgeCheckIcon aria-hidden className="size-4" />
                    Validated
                  </span>
                ) : (
                  <span className="text-text-muted">-</span>
                )}
              </TableCell>
              <TableCell className="text-text-muted tabular-nums">{formatDate(a.createdAt)}</TableCell>
              <TableCell className="px-4 text-right">
                <AssetRowActions id={a.id} status={a.status} validated={!!a.validatedAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
