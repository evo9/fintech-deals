import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/features/auth/guards";
import { AssetForm } from "@/features/assets/components/asset-form";

export const metadata = { title: "New asset" };

export default async function NewAssetPage() {
  const user = await requireUser({ roles: ["SELLER"], allowSuspended: true, next: "/my-assets/new" });
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader title="Publish an asset" description="Save a draft any time, publish when the details are complete" />
      <AssetForm suspended={user.status === "SUSPENDED"} />
    </main>
  );
}
