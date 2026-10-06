import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListBody, ListStateProvider } from "@/components/shared/list-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { AssetCard } from "@/features/assets/components/asset-card";
import { AssetFilters } from "@/features/assets/components/asset-filters";
import { listCatalogAssets } from "@/features/assets/queries";
import { assetListParams } from "@/features/assets/schema";
import { requireUser } from "@/features/auth/guards";
import { PAGE_SIZE, totalPages, withPage } from "@/lib/pagination";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AssetsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const user = await requireUser({ roles: ["BUYER"], allowSuspended: true, next: "/assets" });
  const params = assetListParams.parse(raw);
  const { items, total, counts } = await listCatalogAssets(user, params);

  const pages = totalPages(total, PAGE_SIZE.cards);
  if (params.page > pages) redirect(`/assets?${withPage(raw, pages)}`.replace(/\?$/, ""));

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Assets" description="Licensed fintech companies and licenses for sale" />
      <ListStateProvider>
        <AssetFilters params={params} total={total} counts={counts} />
        <ListBody className="mt-4">
          {items.length ? (
            <ul className="flex flex-col gap-4">
              {items.map((asset) => (
                <AssetCard key={asset.id} asset={asset} viewerSuspended={user.status === "SUSPENDED"} />
              ))}
            </ul>
          ) : (
            <EmptyState title="No assets match these filters." description="Try a wider search or remove some filters.">
              <Link href="/assets" className={buttonVariants({ variant: "secondary" })}>
                Clear filters
              </Link>
            </EmptyState>
          )}
        </ListBody>
        <Pagination page={params.page} pages={pages} />
      </ListStateProvider>
    </main>
  );
}
