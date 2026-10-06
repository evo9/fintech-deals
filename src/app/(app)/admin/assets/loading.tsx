import { PageHeader } from "@/components/shared/page-header";
import { AssetsSkeleton } from "@/features/moderation/components/assets-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Assets" description="All assets in every status" />
      <AssetsSkeleton />
    </main>
  );
}
