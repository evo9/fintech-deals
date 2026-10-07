import { PageHeader } from "@/components/shared/page-header";
import { BuyerListSkeleton } from "@/features/buyers/components/buyer-list-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Buyers" description="Buyers who have described what they are looking for" className="pb-4" />
      <BuyerListSkeleton />
    </main>
  );
}
