import { requireUser } from "@/features/auth/guards";

// Placeholder for task 3.4 onboarding: replaced by the asset form in phase 5.
export default async function NewAssetPage() {
  await requireUser({ roles: ["SELLER"], allowSuspended: true, next: "/my-assets/new" });
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-12">
      <h1 className="text-3xl font-semibold">New asset</h1>
    </main>
  );
}
