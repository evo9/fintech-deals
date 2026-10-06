import { PageHeader } from "@/components/shared/page-header";
import { AssetListSkeleton } from "@/features/assets/components/asset-list-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Assets" description="Licensed fintech companies and licenses for sale" />
      <AssetListSkeleton />
    </main>
  );
}
