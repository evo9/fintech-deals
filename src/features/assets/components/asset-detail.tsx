import Link from "next/link";
import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/shared/country-flag";
import { FieldTile } from "@/components/shared/field-tile";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { canManageOwnAsset } from "@/features/access/visibility";
import type { SessionUser } from "@/features/auth/session";
import { formatAssetId, formatDate, formatPrice } from "@/lib/format";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  BUSINESS_STATUS_LABELS,
  LICENSE_TYPE_LABELS,
  countryName,
} from "@/lib/reference";
import { MatchCriteria } from "@/features/matching/components/match-criteria";
import { isShown, isStrongMatch, type MatchResult } from "@/features/matching/score";
import type { AssetDetail } from "../queries";
import { OwnerActions } from "./owner-actions";

const NOT_SPECIFIED = "Not specified";

const CRUMB_ROOT: Record<SessionUser["role"], { href: string; label: string }> = {
  BUYER: { href: "/assets", label: "Assets" },
  SELLER: { href: "/my-assets", label: "My assets" },
  MANAGER: { href: "/admin/assets", label: "Assets" },
};

export function AssetBreadcrumbs({ role, id }: { role: SessionUser["role"]; id: number }) {
  const root = CRUMB_ROOT[role];
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-text-muted">
      <Link href={root.href} className="rounded-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
        {root.label}
      </Link>
      <ChevronRightIcon aria-hidden className="size-4" />
      <span aria-current="page" className="font-medium text-foreground tabular-nums">
        Asset ID {formatAssetId(id)}
      </span>
    </nav>
  );
}

/** Left column: header, all fields, full description and every Included item. */
export function AssetMain({ asset, showStatus }: { asset: AssetDetail; showStatus: boolean }) {
  return (
    <article className="min-w-0 rounded-xl border bg-surface p-4 sm:p-6">
      <header className="flex gap-4 sm:gap-5">
        <CountryFlag code={asset.country} className="w-20 sm:w-[120px]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-text-muted tabular-nums">Asset ID {formatAssetId(asset.id)}</p>
          <h1 className="text-2xl font-semibold break-words">{asset.headline}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{ASSET_CATEGORY_LABELS[asset.category]}</Badge>
            {asset.validatedAt && (
              <Badge variant="success">
                <BadgeCheckIcon aria-hidden />
                Validated
              </Badge>
            )}
            {showStatus && <StatusBadge status={asset.status} />}
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-3">
        <FieldTile label="Country" value={countryName(asset.country)} />
        <FieldTile label="Type of license" value={LICENSE_TYPE_LABELS[asset.licenseType]} />
        <FieldTile label="Type of business" value={ASSET_CATEGORY_LABELS[asset.category]} />
        <FieldTile
          label="Business status"
          value={BUSINESS_STATUS_LABELS[asset.businessStatus]}
          valueClassName={asset.businessStatus === "ACTIVE" ? "text-success-text" : undefined}
        />
        <FieldTile label="Asset type" value={ASSET_TYPE_LABELS[asset.assetType]} />
        <FieldTile label="Regulator" value={asset.regulator} />
        <FieldTile label="Employees" value={asset.employees?.toString() ?? NOT_SPECIFIED} />
        <FieldTile label="Year of issue" value={asset.yearOfIssue?.toString() ?? NOT_SPECIFIED} />
        <FieldTile label="Published" value={asset.publishedAt ? formatDate(asset.publishedAt) : NOT_SPECIFIED} />
      </div>

      <section aria-labelledby="asset-description" className="mt-8">
        <h2 id="asset-description" className="text-lg font-semibold">
          Description
        </h2>
        <p className="mt-2 leading-7 break-words whitespace-pre-line text-foreground/85">{asset.description}</p>
      </section>

      {asset.included.length > 0 && (
        <section aria-labelledby="asset-included" className="mt-8">
          <h2 id="asset-included" className="text-lg font-semibold">
            Included
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {asset.included.map((item) => (
              <li key={item} className="rounded-full bg-muted/60 px-3 py-1 text-sm break-words">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

/** Right column (sticky on desktop): price, seller and the actions of the viewer's role. */
export function AssetSidebar({
  asset,
  viewer,
  match,
}: {
  asset: AssetDetail;
  viewer: SessionUser;
  match: MatchResult | null;
}) {
  const isOwner = canManageOwnAsset(viewer, asset);
  const sellerName = asset.seller.companyName?.trim() || asset.seller.name;

  return (
    <aside className="flex flex-col gap-4 rounded-xl border bg-surface p-4 sm:p-6 lg:sticky lg:top-24">
      <div className="rounded-lg border border-primary/50 bg-primary-soft px-4 py-3">
        <p className="text-[13px] leading-5 text-text-muted">Asking price</p>
        <p className="text-3xl leading-9 font-semibold text-primary tabular-nums">{formatPrice(asset.askingPrice)}</p>
      </div>

      <div>
        <p className="text-[13px] leading-5 text-text-muted">Seller</p>
        <p className="font-semibold break-words">{sellerName}</p>
        {asset.seller.country && (
          <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
            <CountryFlag code={asset.seller.country} className="w-5" />
            {countryName(asset.seller.country)}
          </p>
        )}
      </div>

      {viewer.role === "BUYER" && isShown(match) && <MatchBlock match={match} />}
      {viewer.role === "BUYER" && <BuyerActions suspended={viewer.status === "SUSPENDED"} />}
      {viewer.role === "SELLER" && asset.sellerId === viewer.id && <OwnerActionsBlock asset={asset} canManage={isOwner} suspended={viewer.status === "SUSPENDED"} />}
      {viewer.role === "MANAGER" && <ManagerActions asset={asset} />}
    </aside>
  );
}

/** How the asset fits the buyer's interests; hidden when they have set none. */
function MatchBlock({ match }: { match: MatchResult }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-4 text-sm">
      <p className="font-semibold">
        {isStrongMatch(match) ? "Strong match" : `Matches ${match.matched} of ${match.considered} of your criteria`}
      </p>
      <MatchCriteria match={match} />
    </div>
  );
}

function BuyerActions({ suspended }: { suspended: boolean }) {
  return (
    // Not wired yet: the contact dialog arrives with task 6.2
    <span title={suspended ? "Your account is suspended" : undefined} className="flex">
      <Button type="button" size="lg" disabled={suspended} className="h-11 flex-1">
        Contact seller
      </Button>
    </span>
  );
}

function StatusBlock({ asset }: { asset: AssetDetail }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] leading-5 text-text-muted">Status</p>
        <StatusBadge status={asset.status} />
      </div>
      {asset.status === "REMOVED" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm break-words text-danger-text">
          Removed from listings{asset.removedReason ? `: ${asset.removedReason}` : "."}
        </p>
      )}
    </div>
  );
}

function OwnerActionsBlock({ asset, canManage, suspended }: { asset: AssetDetail; canManage: boolean; suspended: boolean }) {
  return (
    <>
      <StatusBlock asset={asset} />
      {canManage && asset.status !== "REMOVED" && (
        <OwnerActions id={asset.id} status={asset.status} suspended={suspended} />
      )}
    </>
  );
}

// The manager buttons are placeholders with their final layout: wired in 7.1.
function ManagerActions({ asset }: { asset: AssetDetail }) {
  return (
    <>
      <StatusBlock asset={asset} />
      <div className="flex flex-col gap-2">
        {asset.status === "PUBLISHED" && !asset.validatedAt && (
          <Button type="button" disabled className="h-10">
            Validate
          </Button>
        )}
        {asset.status !== "REMOVED" && (
          <Button type="button" variant="outline" disabled className="h-10">
            Remove from listings
          </Button>
        )}
      </div>
    </>
  );
}
