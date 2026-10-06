import { requireUser } from "@/features/auth/guards";

// Placeholder for task 3.4 onboarding: replaced by the buyer profile in phase 6.
export default async function ProfilePage() {
  await requireUser({ roles: ["BUYER"], allowSuspended: true, next: "/profile" });
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-12">
      <h1 className="text-3xl font-semibold">My profile</h1>
    </main>
  );
}
