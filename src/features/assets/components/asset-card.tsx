import Link from "next/link";
import { BadgeCheckIcon, EyeIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CountryFlag } from "@/components/shared/country-flag";
import { FieldTile } from "@/components/shared/field-tile";
import { formatAssetId, formatMonthYear, formatPrice } from "@/lib/format";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  BUSINESS_STATUS_LABELS,
  LICENSE_TYPE_LABELS,
  countryName,
} from "@/lib/reference";
import { cn } from "@/lib/utils";
import { MatchBadge } from "@/features/matching/components/match-badge";
import type { AssetCard as AssetCardData } from "../queries";
import {
  CARD,
  CARD_BODY,
  CARD_BUTTONS,
  CARD_CHIPS,
  CARD_DESCRIPTION,
  CARD_FLAG_COLUMN,
  CARD_FOOTER,
  CARD_HEADER,
  CARD_HEADLINE,
  CARD_TILES,
} from "./asset-card-layout";
import { IncludedTags } from "./included-tags";

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex h-7 max-w-[16rem] shrink-0 items-center gap-1 rounded-full border px-3 text-sm">
      <span className="text-text-muted">{label}:</span>
      <span title={value} className="truncate font-medium">
        {value}
      </span>
    </span>
  );
}

/** Catalog card (spec 7.3). */
export function AssetCard({ asset, viewerSuspended }: { asset: AssetCardData; viewerSuspended: boolean }) {
  const id = formatAssetId(asset.id);

  return (
    <li className={cn(CARD, "transition-colors hover:border-primary/40")}>
      <div className={CARD_FLAG_COLUMN}>
        <CountryFlag code={asset.country} className="w-[120px]" />
      </div>

      <div className={CARD_BODY}>
        <div className={CARD_HEADER}>
          <div className="flex min-w-0 items-center gap-2">
            <CountryFlag code={asset.country} className="w-9 sm:hidden" />
            <p className="truncate font-semibold tabular-nums">Asset ID {id}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {asset.validatedAt && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-success-text">
                <BadgeCheckIcon aria-hidden className="size-4" />
                <span className="sr-only min-[480px]:not-sr-only">Validated</span>
              </span>
            )}
            <MatchBadge match={asset.match} />
          </div>
        </div>

        <h2 className={cn(CARD_HEADLINE, "truncate text-lg leading-7 font-semibold")} title={asset.headline}>
          {asset.headline}
        </h2>

        <div className={CARD_TILES}>
          <FieldTile label="Country" value={countryName(asset.country)} />
          <FieldTile label="Type of license" value={LICENSE_TYPE_LABELS[asset.licenseType]} />
          <FieldTile label="Type of business" value={ASSET_CATEGORY_LABELS[asset.category]} />
          <FieldTile
            label="Business status"
            value={BUSINESS_STATUS_LABELS[asset.businessStatus]}
            valueClassName={asset.businessStatus === "ACTIVE" ? "text-success-text" : undefined}
          />
          <FieldTile
            label="Asking price"
            value={formatPrice(asset.askingPrice)}
            highlight
            className="col-span-2 lg:col-span-1"
          />
        </div>

        <div className={CARD_CHIPS}>
          <Chip label="Asset type" value={ASSET_TYPE_LABELS[asset.assetType]} />
          {asset.employees != null && <Chip label="Employees" value={String(asset.employees)} />}
          {asset.yearOfIssue != null && <Chip label="Year" value={String(asset.yearOfIssue)} />}
          <Chip label="Regulator" value={asset.regulator} />
        </div>

        <IncludedTags tags={asset.included} />

        <p className={cn(CARD_DESCRIPTION, "line-clamp-2 text-sm leading-5 text-foreground/80")}>{asset.description}</p>

        <div className={CARD_FOOTER}>
          <p className="min-h-5 text-sm text-text-muted">
            {asset.publishedAt ? `Published ${formatMonthYear(asset.publishedAt)}` : ""}
          </p>
          <div className={CARD_BUTTONS}>
            <Link
              href={`/assets/${asset.id}`}
              aria-label={`View asset ${id}`}
              className={cn(buttonVariants({ variant: "outline" }), "h-10 flex-1 border-primary px-5 text-primary sm:flex-none")}
            >
              <EyeIcon aria-hidden />
              View asset
            </Link>
            {/* Not wired yet: the contact flow arrives with task 6.2 */}
            <span
              title={viewerSuspended ? "Your account is suspended" : undefined}
              className="flex flex-1 sm:flex-none"
            >
              <Button type="button" disabled={viewerSuspended} className="h-10 flex-1 px-5 sm:flex-none">
                Contact seller
              </Button>
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
