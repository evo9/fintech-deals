import Link from "next/link";
import { EyeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CountryFlag } from "@/components/shared/country-flag";
import { MatchBadge } from "@/features/matching/components/match-badge";
import { formatBudget } from "@/lib/format";
import { ASSET_CATEGORY_LABELS, BUYER_TYPE_LABELS, LICENSE_TYPE_LABELS, countryName } from "@/lib/reference";
import { cn } from "@/lib/utils";
import type { BuyerCard as BuyerCardData } from "../queries";
import { BUYER_BUDGET, BUYER_CARD, BUYER_FOOTER, BUYER_HEAD, BUYER_HEADLINE, BUYER_TAGS } from "./buyer-card-layout";

const MAX_FLAGS = 6;

/** Buyer card for sellers (spec 7.6). "Contact buyer" is wired with the messaging task (6.2). */
export function BuyerCard({ buyer, viewerSuspended }: { buyer: BuyerCardData; viewerSuspended: boolean }) {
  const profile = buyer.buyerProfile;
  const budget = formatBudget(profile?.budgetMin, profile?.budgetMax);
  const countries = profile?.countries ?? [];

  return (
    <li className={BUYER_CARD}>
      <div className={BUYER_HEAD}>
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="truncate text-base font-semibold">{buyer.name}</h2>
          {buyer.companyName && <span className="truncate text-sm text-text-muted">{buyer.companyName}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {profile?.buyerType && <Badge variant="outline">{BUYER_TYPE_LABELS[profile.buyerType]}</Badge>}
          <MatchBadge match={buyer.match} />
        </div>
      </div>

      <p className={cn(BUYER_HEADLINE, "truncate text-sm leading-6 text-foreground/80")} title={profile?.headline ?? undefined}>
        {profile?.headline}
      </p>

      <div className={BUYER_TAGS}>
        {countries.slice(0, MAX_FLAGS).map((code) => (
          <span key={code} title={countryName(code)} className="shrink-0">
            <CountryFlag code={code} className="w-6" />
          </span>
        ))}
        {countries.length > MAX_FLAGS && (
          <span className="shrink-0 text-sm text-text-muted tabular-nums">+{countries.length - MAX_FLAGS}</span>
        )}
        {profile?.licenseTypes.map((t) => (
          <Badge key={t} variant="secondary" className="shrink-0">
            {LICENSE_TYPE_LABELS[t]}
          </Badge>
        ))}
        {profile?.categories.map((c) => (
          <Badge key={c} variant="outline" className="shrink-0">
            {ASSET_CATEGORY_LABELS[c]}
          </Badge>
        ))}
      </div>

      <p className={cn(BUYER_BUDGET, "text-sm text-text-muted")}>
        Budget: <span className="font-semibold text-foreground tabular-nums">{budget ?? "not specified"}</span>
      </p>

      <div className={BUYER_FOOTER}>
        <Link
          href={`/buyers/${buyer.id}`}
          aria-label={`View profile of ${buyer.name}`}
          className={cn(buttonVariants({ variant: "outline" }), "h-10 flex-1 border-primary px-5 text-primary sm:flex-none")}
        >
          <EyeIcon aria-hidden />
          View profile
        </Link>
        {/* Not wired yet: the contact flow arrives with task 6.2 */}
        <span title={viewerSuspended ? "Your account is suspended" : undefined} className="flex flex-1 sm:flex-none">
          <Button type="button" disabled={viewerSuspended} className="h-10 flex-1 px-5 sm:flex-none">
            Contact buyer
          </Button>
        </span>
      </div>
    </li>
  );
}
