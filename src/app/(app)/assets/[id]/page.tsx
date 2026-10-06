import type { Metadata } from "next";
import { requireUser } from "@/features/auth/guards";
import { AssetBreadcrumbs, AssetMain, AssetSidebar } from "@/features/assets/components/asset-detail";
import { getAssetForViewer } from "@/features/assets/queries";
import { getBuyerInterests } from "@/features/buyers/queries";
import { hasInterests, scoreMatch } from "@/features/matching/score";
import { formatAssetId } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser({ allowSuspended: true, next: `/assets/${id}` });
  const asset = await getAssetForViewer(user, id);
  return { title: `Asset ID ${formatAssetId(asset.id)}` };
}

// Open to every role; what each one may see is decided in the query (spec section 5).
export default async function AssetPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser({ allowSuspended: true, next: `/assets/${id}` });
  const asset = await getAssetForViewer(user, id);
  const interests = user.role === "BUYER" ? await getBuyerInterests(user.id) : null;
  const match = hasInterests(interests) ? scoreMatch(asset, interests) : null;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <AssetBreadcrumbs role={user.role} id={asset.id} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AssetMain asset={asset} showStatus={user.role === "MANAGER" || asset.sellerId === user.id} />
        <AssetSidebar asset={asset} viewer={user} match={match} />
      </div>
    </main>
  );
}
