import Link from "next/link";
import { BadgeCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CountryFlag } from "@/components/shared/country-flag";
import { FieldTile } from "@/components/shared/field-tile";
import { RoleBadge } from "@/components/shared/role-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatAssetId, formatBudget, formatDate, formatDateTime, formatPrice } from "@/lib/format";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  BUYER_TYPE_LABELS,
  LICENSE_TYPE_LABELS,
  countryName,
} from "@/lib/reference";
import { cn } from "@/lib/utils";
import type { AdminUserDetail } from "../queries";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-muted">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** Read-only view of one participant for a manager: account data, status reason, interests or assets. */
export function UserDetail({ user }: { user: AdminUserDetail }) {
  const p = user.buyerProfile;
  const budget = p ? formatBudget(p.budgetMin, p.budgetMax) : null;
  const hasInterests =
    !!p && (p.countries.length > 0 || p.licenseTypes.length > 0 || p.categories.length > 0 || p.assetTypes.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <article className="min-w-0 rounded-xl border bg-surface p-4 sm:p-6">
        <header className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold break-words">{user.name}</h1>
          <RoleBadge role={user.role} />
          <StatusBadge status={user.status} />
        </header>

        {user.status !== "ACTIVE" && (
          <div
            className={cn(
              "mt-4 rounded-lg border px-4 py-3 text-sm",
              user.status === "REMOVED" ? "border-danger/40 bg-danger/5" : "border-warning/40 bg-warning/5",
            )}
          >
            <p className={cn("font-semibold", user.status === "REMOVED" ? "text-danger-text" : "text-warning-text")}>
              {user.status === "REMOVED" ? "Removed" : "Suspended"}
              {user.statusChangedAt ? ` on ${formatDate(user.statusChangedAt)}` : ""}
            </p>
            <p className="mt-1 break-words text-foreground/85">{user.statusReason ?? "No reason recorded."}</p>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <FieldTile label="Email" value={user.email} />
          <FieldTile label="Company" value={user.companyName ?? "Not specified"} />
          <FieldTile label="Country" value={user.country ? countryName(user.country) : "Not specified"} />
          <FieldTile label="Registered" value={formatDateTime(user.createdAt)} />
          {user.role === "SELLER" && <FieldTile label="Assets" value={String(user._count.assets)} />}
          {p?.buyerType && <FieldTile label="Buyer type" value={BUYER_TYPE_LABELS[p.buyerType]} />}
        </div>
      </article>

      {user.role === "BUYER" && (
        <section aria-labelledby="buyer-profile" className="rounded-xl border bg-surface p-4 sm:p-6">
          <h2 id="buyer-profile" className="text-lg font-semibold">
            Buyer profile
          </h2>
          {!p || (!p.headline && !p.about && !hasInterests && !budget) ? (
            <p className="mt-2 text-sm text-text-muted">This buyer has not filled in their profile yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-5">
              {p.headline && <p className="text-base font-medium break-words">{p.headline}</p>}
              {p.about && <p className="leading-7 break-words whitespace-pre-line text-foreground/85">{p.about}</p>}
              <p className="text-sm text-text-muted">
                Budget: <span className="font-semibold text-foreground tabular-nums">{budget ?? "not specified"}</span>
              </p>
              {p.countries.length > 0 && (
                <Group title="Countries">
                  {p.countries.map((code) => (
                    <span key={code} className="inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm">
                      <CountryFlag code={code} className="w-5" />
                      {countryName(code)}
                    </span>
                  ))}
                </Group>
              )}
              {p.licenseTypes.length > 0 && (
                <Group title="License types">
                  {p.licenseTypes.map((t) => (
                    <Badge key={t} variant="secondary">
                      {LICENSE_TYPE_LABELS[t]}
                    </Badge>
                  ))}
                </Group>
              )}
              {p.categories.length > 0 && (
                <Group title="Types of business">
                  {p.categories.map((c) => (
                    <Badge key={c} variant="outline">
                      {ASSET_CATEGORY_LABELS[c]}
                    </Badge>
                  ))}
                </Group>
              )}
              {p.assetTypes.length > 0 && (
                <Group title="Asset types">
                  {p.assetTypes.map((t) => (
                    <Badge key={t} variant="outline">
                      {ASSET_TYPE_LABELS[t]}
                    </Badge>
                  ))}
                </Group>
              )}
            </div>
          )}
        </section>
      )}

      {user.role === "SELLER" && (
        <section aria-labelledby="seller-assets" className="rounded-xl border bg-surface p-4 sm:p-6">
          <h2 id="seller-assets" className="text-lg font-semibold">
            Assets
          </h2>
          {user.assets.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">This seller has not created any assets yet.</p>
          ) : (
            <>
              <ul className="mt-3 flex flex-col divide-y">
                {user.assets.map((a) => (
                  <li key={a.id} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <span className="w-16 shrink-0 text-sm text-text-muted tabular-nums">{formatAssetId(a.id)}</span>
                    <Link
                      href={`/assets/${a.id}`}
                      title={a.headline}
                      className="min-w-0 flex-1 truncate font-semibold hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {a.headline}
                    </Link>
                    {a.validatedAt && (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-success-text">
                        <BadgeCheckIcon aria-hidden className="size-4" />
                        Validated
                      </span>
                    )}
                    <StatusBadge status={a.status} />
                    <span className="w-20 shrink-0 text-right text-sm tabular-nums">{formatPrice(a.askingPrice)}</span>
                  </li>
                ))}
              </ul>
              {user._count.assets > user.assets.length && (
                <p className="mt-3 text-sm text-text-muted">
                  Showing the latest {user.assets.length} of {user._count.assets} assets.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
