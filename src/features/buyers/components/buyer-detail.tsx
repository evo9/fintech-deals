import { Badge } from "@/components/ui/badge";
import { CountryFlag } from "@/components/shared/country-flag";
import { ContactBuyer } from "@/features/messaging/components/contact-actions";
import { ContactDialog } from "@/features/messaging/components/contact-dialog";
import type { PairConversation } from "@/features/messaging/queries";
import { formatBudget, formatDate } from "@/lib/format";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  BUYER_TYPE_LABELS,
  LICENSE_TYPE_LABELS,
  countryName,
} from "@/lib/reference";
import type { BuyerProfileView } from "../queries";

function Interest({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-muted">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** Full buyer profile (spec 7.6): who they are and what they are looking for. */
export function BuyerMain({ buyer }: { buyer: BuyerProfileView }) {
  const p = buyer.buyerProfile;

  return (
    <article className="min-w-0 rounded-xl border bg-surface p-4 sm:p-6">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold break-words">{buyer.name}</h1>
          {p?.buyerType && <Badge variant="outline">{BUYER_TYPE_LABELS[p.buyerType]}</Badge>}
        </div>
        {(buyer.companyName || buyer.country) && (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-text-muted">
            {buyer.companyName}
            {buyer.country && (
              <span className="inline-flex items-center gap-2">
                <CountryFlag code={buyer.country} className="w-5" />
                {countryName(buyer.country)}
              </span>
            )}
          </p>
        )}
        {p?.headline && <p className="mt-3 text-lg font-medium break-words">{p.headline}</p>}
      </header>

      {p?.about && (
        <section aria-labelledby="buyer-about" className="mt-8">
          <h2 id="buyer-about" className="text-lg font-semibold">
            About
          </h2>
          <p className="mt-2 leading-7 break-words whitespace-pre-line text-foreground/85">{p.about}</p>
        </section>
      )}

      <section aria-labelledby="buyer-interests" className="mt-8">
        <h2 id="buyer-interests" className="text-lg font-semibold">
          Investment interests
        </h2>
        <div className="mt-4 flex flex-col gap-5">
          {p && p.countries.length > 0 && (
            <Interest title="Countries">
              {p.countries.map((code) => (
                <span key={code} className="inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm">
                  <CountryFlag code={code} className="w-5" />
                  {countryName(code)}
                </span>
              ))}
            </Interest>
          )}
          {p && p.licenseTypes.length > 0 && (
            <Interest title="License types">
              {p.licenseTypes.map((t) => (
                <Badge key={t} variant="secondary">
                  {LICENSE_TYPE_LABELS[t]}
                </Badge>
              ))}
            </Interest>
          )}
          {p && p.categories.length > 0 && (
            <Interest title="Types of business">
              {p.categories.map((c) => (
                <Badge key={c} variant="outline">
                  {ASSET_CATEGORY_LABELS[c]}
                </Badge>
              ))}
            </Interest>
          )}
          {p && p.assetTypes.length > 0 && (
            <Interest title="Asset types">
              {p.assetTypes.map((t) => (
                <Badge key={t} variant="outline">
                  {ASSET_TYPE_LABELS[t]}
                </Badge>
              ))}
            </Interest>
          )}
        </div>
      </section>
    </article>
  );
}

export function BuyerSidebar({
  buyer,
  viewerSuspended,
  assets,
  existing,
}: {
  buyer: BuyerProfileView;
  viewerSuspended: boolean;
  assets: { id: number; headline: string }[];
  existing: PairConversation[];
}) {
  const p = buyer.buyerProfile;
  const budget = formatBudget(p?.budgetMin, p?.budgetMax);

  return (
    <aside className="flex flex-col gap-4 rounded-xl border bg-surface p-4 sm:p-6 lg:sticky lg:top-24">
      <div className="rounded-lg border border-primary/50 bg-primary-soft px-4 py-3">
        <p className="text-[13px] leading-5 text-text-muted">Budget</p>
        <p className="text-2xl leading-8 font-semibold text-primary tabular-nums">{budget ?? "Not specified"}</p>
      </div>
      {p && <p className="text-sm text-text-muted">Profile updated {formatDate(p.updatedAt)}</p>}
      <ContactBuyer
        buyer={{ id: buyer.id, name: buyer.name }}
        assets={assets}
        existing={existing}
        suspended={viewerSuspended}
        className="flex"
        buttonClassName="flex-1"
        size="lg"
      />
      {existing.length > 0 && !viewerSuspended && assets.length > 0 && (
        <ContactDialog
          kind="buyer"
          buyer={{ id: buyer.id, name: buyer.name }}
          assets={assets}
          existing={existing}
          label="New message about another asset"
          variant="outline"
          className="h-10 w-full"
        />
      )}
    </aside>
  );
}
