import Link from "next/link";
import { redirect } from "next/navigation";
import { FileTextIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListBody, ListStateProvider } from "@/components/shared/list-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { requireUser } from "@/features/auth/guards";
import { AssetsFilters } from "@/features/moderation/components/assets-filters";
import { AssetsTable } from "@/features/moderation/components/assets-table";
import { listAdminAssets } from "@/features/moderation/queries";
import { adminAssetsParams } from "@/features/moderation/schema";
import { PAGE_SIZE, totalPages, withPage } from "@/lib/pagination";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Assets" };

export default async function AdminAssetsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const user = await requireUser({ roles: ["MANAGER"], allowSuspended: true, next: "/admin/assets" });
  const params = adminAssetsParams.parse(raw);
  const { items, total } = await listAdminAssets(user, params);

  const pages = totalPages(total, PAGE_SIZE.admin);
  if (params.page > pages) redirect(`/admin/assets?${withPage(raw, pages)}`.replace(/\?$/, ""));

  const filtered =
    params.q !== "" ||
    params.status !== undefined ||
    params.category !== undefined ||
    params.country !== undefined ||
    params.validated !== undefined;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Assets" description="All assets in every status" />
      <ListStateProvider>
        <AssetsFilters params={params} total={total} />
        <ListBody className="mt-4">
          {items.length ? (
            <AssetsTable items={items} />
          ) : (
            <EmptyState
              icon={<FileTextIcon className="size-5" />}
              title={filtered ? "No assets match these filters." : "No assets yet."}
              description={filtered ? "Try a wider search or remove some filters." : "Assets appear here once sellers create them."}
            >
              {filtered && (
                <Link href="/admin/assets" className={buttonVariants({ variant: "secondary" })}>
                  Clear filters
                </Link>
              )}
            </EmptyState>
          )}
        </ListBody>
        <Pagination page={params.page} pages={pages} />
      </ListStateProvider>
    </main>
  );
}
