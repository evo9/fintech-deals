import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { USER_STATUS_LABELS } from "@/lib/reference";
import type { DemoAccount } from "../queries";

export const DEMO_PASSWORD = "demo1234";

const GROUPS: { role: Role; title: string }[] = [
  { role: "BUYER", title: "Buyer" },
  { role: "SELLER", title: "Seller" },
  { role: "MANAGER", title: "Platform manager" },
];

export function DemoAccounts({
  accounts,
  selectedEmail,
  onPick,
}: {
  accounts: DemoAccount[];
  selectedEmail: string;
  onPick: (account: DemoAccount) => void;
}) {
  return (
    <section aria-labelledby="demo-accounts-title" className="rounded-xl border bg-surface p-8">
      <h2 id="demo-accounts-title" className="text-lg font-semibold">
        Demo accounts
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Demo environment. All demo accounts use the password{" "}
        <span className="font-semibold text-text">{DEMO_PASSWORD}</span>.
      </p>

      <div className="mt-6 space-y-6">
        {GROUPS.map(({ role, title }) => {
          const items = accounts.filter((a) => a.role === role);
          if (!items.length) return null;
          return (
            <div key={role}>
              <h3 className="text-sm font-semibold text-text-muted">{title}</h3>
              <ul className="mt-2 space-y-2">
                {items.map((account) => (
                  <li key={account.email}>
                    <button
                      type="button"
                      onClick={() => onPick(account)}
                      aria-pressed={selectedEmail === account.email}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border bg-surface px-4 py-2.5 text-left transition-colors outline-none hover:border-primary hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary-soft"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold">{account.name}</span>
                        <span className="block truncate text-sm text-text-muted">
                          {account.companyName ?? account.email}
                        </span>
                      </span>
                      {account.status !== "ACTIVE" && (
                        <Badge variant="warning" className="shrink-0">
                          {USER_STATUS_LABELS[account.status]}
                        </Badge>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
