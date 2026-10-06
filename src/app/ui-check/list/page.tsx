import { redirect } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { ListBody, ListStateProvider } from "@/components/shared/list-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { RoleBadge } from "@/components/shared/role-badge";
import { PAGE_SIZE, toSkipTake, totalPages, withPage } from "@/lib/pagination";
import { z } from "zod";

// Temporary page for task 3.6 (removed together with /ui-check): 384 fake rows = 48 pages.
const ITEMS = Array.from({ length: 384 }, (_, i) => `Test item ${i + 1}`);

const params = z.object({
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ListCheckPage({ searchParams }: Props) {
  const raw = await searchParams;
  const { q, page } = params.parse({ q: raw.q, page: raw.page });

  const filtered = ITEMS.filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  const pages = totalPages(filtered.length, PAGE_SIZE.cards);
  if (page > pages) redirect(`/ui-check/list?${withPage(raw, pages)}`);

  const { skip, take } = toSkipTake(page, PAGE_SIZE.cards);
  const items = filtered.slice(skip, skip + take);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="List check" description="Temporary page for the shared list components" actions={<Button>Action</Button>} />
      <ListStateProvider>
        <FilterBar
          total={filtered.length}
          singular="item"
          plural="items"
          filterKeys={["q"]}
          hasActiveFilters={q !== ""}
          search={{ initialQ: q, placeholder: "Search items" }}
        />
        <ListBody className="mt-4">
          {items.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((name, i) => (
                <li key={name} className="flex h-24 items-center justify-between rounded-xl border bg-surface p-4">
                  <span className="font-semibold tabular-nums">{name}</span>
                  {i % 3 === 0 ? <StatusBadge status="PUBLISHED" /> : i % 3 === 1 ? <StatusBadge status="SUSPENDED" /> : <RoleBadge role="SELLER" />}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No items match this search" description="Try a different word or clear the search.">
              <Link href="/ui-check/list" className={buttonVariants({ variant: "secondary" })}>
                Clear search
              </Link>
            </EmptyState>
          )}
        </ListBody>
        <Pagination page={page} pages={pages} />
      </ListStateProvider>
    </main>
  );
}
