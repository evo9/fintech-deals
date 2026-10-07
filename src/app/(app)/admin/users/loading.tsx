import { PageHeader } from "@/components/shared/page-header";
import { UsersSkeleton } from "@/features/moderation/components/users-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Participants" description="Buyers and sellers on the platform" className="pb-4" />
      <UsersSkeleton />
    </main>
  );
}
