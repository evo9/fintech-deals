import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { isProfileFilled } from "@/features/access/visibility";
import { requireUser } from "@/features/auth/guards";
import { ProfileForm } from "@/features/buyers/components/profile-form";
import { getOwnProfile } from "@/features/buyers/queries";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await requireUser({ roles: ["BUYER"], allowSuspended: true, next: "/profile" });
  const own = await getOwnProfile(user);
  const visible = user.status === "ACTIVE" && isProfileFilled(own.profile);

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <PageHeader
        title="My profile"
        description="Tell sellers what you are looking for"
        actions={
          visible ? (
            <Badge variant="success">Profile visible to sellers</Badge>
          ) : (
            <Badge variant="warning">Hidden from sellers: add your interests</Badge>
          )
        }
      />
      <ProfileForm own={own} suspended={user.status === "SUSPENDED"} />
    </main>
  );
}
