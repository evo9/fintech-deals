import Link from "next/link";
import { redirect } from "next/navigation";
import { UsersIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListBody, ListStateProvider } from "@/components/shared/list-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { conversationsWithBuyers } from "@/features/messaging/queries";
import { requireUser } from "@/features/auth/guards";
import { BuyerCard } from "@/features/buyers/components/buyer-card";
import { BuyerFilters } from "@/features/buyers/components/buyer-filters";
import { listCatalogBuyers } from "@/features/buyers/queries";
import { buyerListParams } from "@/features/buyers/schema";
import { PAGE_SIZE, totalPages, withPage } from "@/lib/pagination";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Buyers" };

export default async function BuyersPage({ searchParams }: Props) {
  const raw = await searchParams;
  const user = await requireUser({ roles: ["SELLER"], allowSuspended: true, next: "/buyers" });
  const params = buyerListParams.parse(raw);
  const { items, total, myAssets, matchAsset } = await listCatalogBuyers(user, params);

  const conversations = await conversationsWithBuyers(user.id, items.map((b) => b.id));

  const pages = totalPages(total, PAGE_SIZE.cards);
  if (params.page > pages) redirect(`/buyers?${withPage(raw, pages)}`.replace(/\?$/, ""));

  const filtered =
    params.q !== "" ||
    matchAsset !== undefined ||
    params.type.length + params.country.length + params.licenseType.length + params.category.length > 0 ||
    params.budgetMin !== undefined ||
    params.budgetMax !== undefined;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Buyers" description="Buyers who have described what they are looking for" />
      <ListStateProvider>
        <BuyerFilters params={params} total={total} myAssets={myAssets} matchAsset={matchAsset} />
        <ListBody className="mt-4">
          {items.length ? (
            <ul className="flex flex-col gap-4">
              {items.map((buyer) => (
                <BuyerCard
                  key={buyer.id}
                  buyer={buyer}
                  viewerSuspended={user.status === "SUSPENDED"}
                  contact={{ assets: myAssets, existing: conversations.get(buyer.id) ?? [] }}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<UsersIcon className="size-5" />}
              title={filtered ? "No buyers match these filters." : "No buyers to show yet."}
              description={
                filtered
                  ? "Try a wider search or remove some filters."
                  : "Buyers appear here once they describe their interests in their profile."
              }
            >
              <Link href={filtered ? "/buyers" : "/my-assets"} className={buttonVariants({ variant: "secondary" })}>
                {filtered ? "Clear filters" : "Go to my assets"}
              </Link>
            </EmptyState>
          )}
        </ListBody>
        <Pagination page={params.page} pages={pages} />
      </ListStateProvider>
    </main>
  );
}
