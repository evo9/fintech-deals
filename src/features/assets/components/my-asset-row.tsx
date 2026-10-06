import Link from "next/link";
import { EyeIcon, PencilIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatAssetId, formatDate, formatPrice } from "@/lib/format";
import { ASSET_CATEGORY_LABELS } from "@/lib/reference";
import { cn } from "@/lib/utils";
import type { MyAssetRow } from "../queries";
import { ROW, ROW_ACTIONS, ROW_MAIN, ROW_META, ROW_TOP } from "./my-asset-row-layout";

/** Row of the seller's list. Withdraw / Republish / Delete live on the asset page (task 5.3). */
export function MyAssetRowCard({ asset }: { asset: MyAssetRow }) {
  const conversations = asset._count.conversations;
  const id = formatAssetId(asset.id);

  return (
    <li className={ROW}>
      <div className={ROW_MAIN}>
        <div className={ROW_TOP}>
          <span className="shrink-0 text-sm text-text-muted tabular-nums">{id}</span>
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold" title={asset.headline}>
            {asset.headline}
          </h2>
          <StatusBadge status={asset.status} className="shrink-0" />
        </div>
        <p className={ROW_META}>
          <span>{ASSET_CATEGORY_LABELS[asset.category]}</span>
          <span className="font-semibold text-primary tabular-nums">{formatPrice(asset.askingPrice)}</span>
          <span>Updated {formatDate(asset.updatedAt)}</span>
          <span className="tabular-nums">
            {conversations} {conversations === 1 ? "conversation" : "conversations"}
          </span>
        </p>
      </div>
      <div className={ROW_ACTIONS}>
        <Link
          href={`/assets/${asset.id}`}
          aria-label={`View asset ${id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 px-4 text-sm")}
        >
          <EyeIcon aria-hidden />
          View
        </Link>
        {asset.status !== "REMOVED" && (
          <Link
            href={`/my-assets/${asset.id}/edit`}
            aria-label={`Edit asset ${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 px-4 text-sm")}
          >
            <PencilIcon aria-hidden />
            Edit
          </Link>
        )}
      </div>
    </li>
  );
}
