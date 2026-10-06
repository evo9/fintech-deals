import Link from "next/link";
import { redirect } from "next/navigation";
import { UsersIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { ListBody, ListStateProvider } from "@/components/shared/list-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { requireUser } from "@/features/auth/guards";
import { listAdminUsers } from "@/features/moderation/queries";
import { adminUsersParams } from "@/features/moderation/schema";
import { UsersTable } from "@/features/moderation/components/users-table";
import { UsersTabs } from "@/features/moderation/components/users-tabs";
import { PAGE_SIZE, totalPages, withPage } from "@/lib/pagination";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Participants" };

export default async function AdminUsersPage({ searchParams }: Props) {
  const raw = await searchParams;
  const user = await requireUser({ roles: ["MANAGER"], allowSuspended: true, next: "/admin/users" });
  const params = adminUsersParams.parse(raw);
  const { items, total, counts } = await listAdminUsers(user, params);

  const pages = totalPages(total, PAGE_SIZE.admin);
  if (params.page > pages) redirect(`/admin/users?${withPage(raw, pages)}`.replace(/\?$/, ""));

  const filtered = params.q !== "" || params.tab !== "ALL";

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Participants" description="Buyers and sellers on the platform" />
      <ListStateProvider>
        <UsersTabs value={params.tab} counts={counts} />
        <div className="mt-4">
          <FilterBar
            total={total}
            singular="participant"
            plural="participants"
            filterKeys={["q", "tab"]}
            hasActiveFilters={filtered}
            search={{ initialQ: params.q, placeholder: "Search by name, email or company" }}
          />
        </div>
        <ListBody className="mt-4">
          {items.length ? (
            <UsersTable items={items} />
          ) : (
            <EmptyState
              icon={<UsersIcon className="size-5" />}
              title={filtered ? "No participants match this search." : "No participants yet."}
              description="Try another tab or a different search."
            >
              <Link href="/admin/users" className={buttonVariants({ variant: "secondary" })}>
                Show all participants
              </Link>
            </EmptyState>
          )}
        </ListBody>
        <Pagination page={params.page} pages={pages} />
      </ListStateProvider>
    </main>
  );
}
