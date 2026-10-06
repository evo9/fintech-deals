import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/features/auth/guards";
import { AssetForm } from "@/features/assets/components/asset-form";
import { getOwnAssetForEdit } from "@/features/assets/queries";
import { formatAssetId } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Edit asset" };

// Own assets only: someone else's id and a missing id are both a 404.
export default async function EditAssetPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser({ roles: ["SELLER"], allowSuspended: true, next: `/my-assets/${id}/edit` });
  const asset = await getOwnAssetForEdit(user, id);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title={`Edit asset ${formatAssetId(asset.id)}`} />
      <AssetForm asset={asset} suspended={user.status === "SUSPENDED"} />
    </main>
  );
}
