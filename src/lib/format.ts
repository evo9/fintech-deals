const PRICE_ON_REQUEST = "On request";

/** 5400000 -> "5.4M", 1250000 -> "1.25M", 95000 -> "95K", 950 -> "950". */
function compact(value: number): string {
  if (value >= 1_000_000) return `${trim(value / 1_000_000, 2)}M`;
  if (value >= 1_000) {
    const k = trim(value / 1_000, 1);
    // 999,960 rounds to "1000K": show it as 1M instead
    return k === "1000" ? "1M" : `${k}K`;
  }
  return String(value);
}

function trim(n: number, digits: number): string {
  return String(Number(n.toFixed(digits)));
}

/** Asking price in whole euros; null means "On request". */
export function formatPrice(eur: number | null | undefined): string {
  return eur == null ? PRICE_ON_REQUEST : `€${compact(eur)}`;
}

/** Buyer budget: "€500K - €2M", "from €500K", "up to €2M"; null when neither bound is set. */
export function formatBudget(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min != null && max != null) return `${formatPrice(min)} - ${formatPrice(max)}`;
  if (min != null) return `from ${formatPrice(min)}`;
  if (max != null) return `up to ${formatPrice(max)}`;
  return null;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

// UTC on purpose: server and browser render the same string, so no hydration mismatch.

/** "6 Oct 2026" */
export function formatDate(date: Date | string): string {
  return dateFormat.format(new Date(date));
}

/** "6 Oct 2026, 14:05" (UTC) */
export function formatDateTime(date: Date | string): string {
  return dateTimeFormat.format(new Date(date));
}

/** "#751" - asset id as shown in the UI. */
export function formatAssetId(id: number): string {
  return `#${id}`;
}
