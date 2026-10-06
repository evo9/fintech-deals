import { PageHeader } from "@/components/shared/page-header";
import { MyAssetsSkeleton } from "@/features/assets/components/my-assets-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="My assets" description="Your listings and their status" />
      <MyAssetsSkeleton />
    </main>
  );
}
