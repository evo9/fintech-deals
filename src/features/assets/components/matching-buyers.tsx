import Link from "next/link";
import { UsersIcon } from "lucide-react";
import { CountryFlag } from "@/components/shared/country-flag";
import type { MatchingBuyer } from "@/features/buyers/queries";
import { MatchBadge } from "@/features/matching/components/match-badge";
import { countryName } from "@/lib/reference";

/** Top buyers whose interests fit this asset (SHOULD, spec 6). Shown to the owner only. */
export function MatchingBuyers({ buyers }: { buyers: MatchingBuyer[] }) {
  return (
    <section aria-labelledby="matching-buyers" className="mt-6 rounded-xl border bg-surface p-4 sm:p-6">
      <h2 id="matching-buyers" className="text-lg font-semibold">
        Matching buyers
      </h2>
      {buyers.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
          <UsersIcon aria-hidden className="size-4" />
          No buyers match this asset yet.
          <Link href="/buyers" className="font-semibold text-primary hover:underline">
            Browse buyers
          </Link>
        </p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y">
          {buyers.map((b) => (
            <li key={b.id} className="flex min-h-14 items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/buyers/${b.id}`}
                  className="block truncate font-semibold hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {b.name}
                </Link>
                <p className="flex items-center gap-2 truncate text-sm text-text-muted">
                  {b.country && <CountryFlag code={b.country} className="w-4" />}
                  {[b.companyName, b.country ? countryName(b.country) : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <MatchBadge match={b.match} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
