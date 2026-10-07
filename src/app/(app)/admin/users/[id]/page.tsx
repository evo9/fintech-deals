import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { requireUser } from "@/features/auth/guards";
import { UserDetail } from "@/features/moderation/components/user-detail";
import { getAdminUser } from "@/features/moderation/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const viewer = await requireUser({ roles: ["MANAGER"], allowSuspended: true, next: `/admin/users/${id}` });
  const user = await getAdminUser(viewer, id);
  return { title: user.name };
}

// Managers only, any participant in any status; everything else is a 404 (spec section 5).
export default async function AdminUserPage({ params }: Props) {
  const { id } = await params;
  const viewer = await requireUser({ roles: ["MANAGER"], allowSuspended: true, next: `/admin/users/${id}` });
  const user = await getAdminUser(viewer, id);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <Breadcrumbs items={[{ label: "Participants", href: "/admin/users" }, { label: user.name }]} />
      <UserDetail user={user} />
    </main>
  );
}
