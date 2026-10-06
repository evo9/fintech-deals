import Link from "next/link";
import { redirect } from "next/navigation";
import { FileTextIcon, PlusIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListBody, ListStateProvider } from "@/components/shared/list-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { MyAssetRowCard } from "@/features/assets/components/my-asset-row";
import { MyAssetsTabs } from "@/features/assets/components/my-assets-tabs";
import { listOwnAssets } from "@/features/assets/queries";
import { myAssetsParams } from "@/features/assets/schema";
import { requireUser } from "@/features/auth/guards";
import { PAGE_SIZE, totalPages, withPage } from "@/lib/pagination";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "My assets" };

export default async function MyAssetsPage({ searchParams }: Props) {
  const raw = await searchParams;
  const user = await requireUser({ roles: ["SELLER"], allowSuspended: true, next: "/my-assets" });
  const params = myAssetsParams.parse(raw);
  const { items, total, counts } = await listOwnAssets(user, params);

  const pages = totalPages(total, PAGE_SIZE.rows);
  if (params.page > pages) redirect(`/my-assets?${withPage(raw, pages)}`.replace(/\?$/, ""));

  const suspended = user.status === "SUSPENDED";
  const publish = suspended ? (
    <span title="Your account is suspended">
      <Button disabled>
        <PlusIcon aria-hidden />
        Publish an asset
      </Button>
    </span>
  ) : (
    <Link href="/my-assets/new" className={buttonVariants()}>
      <PlusIcon aria-hidden />
      Publish an asset
    </Link>
  );

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="My assets" description="Your listings and their status" actions={publish} />
      {counts.ALL === 0 ? (
        <EmptyState
          icon={<FileTextIcon className="size-5" />}
          title="You haven't listed any assets yet."
          description="Publish your first asset to make it visible to buyers."
        >
          {suspended ? (
            <Button disabled>Publish your first asset</Button>
          ) : (
            <Link href="/my-assets/new" className={buttonVariants()}>
              Publish your first asset
            </Link>
          )}
        </EmptyState>
      ) : (
        <ListStateProvider>
          <MyAssetsTabs value={params.status} counts={counts} />
          <ListBody className="mt-4">
            {items.length ? (
              <ul className="flex flex-col gap-3">
                {items.map((asset) => (
                  <MyAssetRowCard key={asset.id} asset={asset} />
                ))}
              </ul>
            ) : (
              <EmptyState title="No assets with this status.">
                <Link href="/my-assets" className={buttonVariants({ variant: "secondary" })}>
                  Show all assets
                </Link>
              </EmptyState>
            )}
          </ListBody>
          <Pagination page={params.page} pages={pages} />
        </ListStateProvider>
      )}
    </main>
  );
}
