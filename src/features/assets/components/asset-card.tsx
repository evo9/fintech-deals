import Link from "next/link";
import { CountryFlag } from "@/components/shared/country-flag";
import { formatAssetId, formatPrice } from "@/lib/format";
import { countryName } from "@/lib/reference";
import type { AssetCard as AssetCardData } from "../queries";

/** Shared with the skeleton so the list does not jump when it loads. */
export const ASSET_CARD_HEIGHT = "h-[220px]";

// Minimal version for the catalog list (4.2); task 4.3 replaces it with the full card from spec 7.3.
export function AssetCard({ asset }: { asset: AssetCardData }) {
  return (
    <li className={`${ASSET_CARD_HEIGHT} flex gap-4 rounded-xl border bg-surface p-4`}>
      <CountryFlag code={asset.country} className="w-[120px] self-start" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-muted tabular-nums">Asset ID {formatAssetId(asset.id)}</p>
        <Link href={`/assets/${asset.id}`} className="block truncate text-lg font-semibold hover:text-primary">
          {asset.headline}
        </Link>
        <p className="text-sm text-text-muted">{countryName(asset.country)}</p>
      </div>
      <p className="font-semibold text-primary tabular-nums">{formatPrice(asset.askingPrice)}</p>
    </li>
  );
}
