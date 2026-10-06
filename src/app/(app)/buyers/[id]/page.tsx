import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { requireUser } from "@/features/auth/guards";
import { BuyerMain, BuyerSidebar } from "@/features/buyers/components/buyer-detail";
import { getBuyerForSeller } from "@/features/buyers/queries";
import { conversationsWithBuyers, ownPublishedAssetOptions } from "@/features/messaging/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser({ roles: ["SELLER"], allowSuspended: true, next: `/buyers/${id}` });
  const buyer = await getBuyerForSeller(user, id);
  return { title: buyer.name };
}

// Sellers only, and only buyers from the catalog; everything else is a 404 (spec section 5).
export default async function BuyerPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser({ roles: ["SELLER"], allowSuspended: true, next: `/buyers/${id}` });
  const buyer = await getBuyerForSeller(user, id);
  const [conversations, assets] = await Promise.all([
    conversationsWithBuyers(user.id, [buyer.id]),
    ownPublishedAssetOptions(user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <Breadcrumbs items={[{ label: "Buyers", href: "/buyers" }, { label: buyer.name }]} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <BuyerMain buyer={buyer} />
        <BuyerSidebar
          buyer={buyer}
          viewerSuspended={user.status === "SUSPENDED"}
          assets={assets}
          existing={conversations.get(buyer.id) ?? []}
        />
      </div>
    </main>
  );
}
