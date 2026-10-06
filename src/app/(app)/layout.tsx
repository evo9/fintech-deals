import { AppHeader } from "@/components/shared/app-header";
import { NAV_ITEMS } from "@/components/shared/app-nav";
import { SuspendedBanner } from "@/components/shared/suspended-banner";
import { homePath } from "@/features/auth/home";
import { getSession } from "@/features/auth/session";

// The layout only draws the chrome. Access is enforced by requireUser() in every page and
// action: a layout does not know the URL, so it cannot build `?next=` for the login redirect.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || user.status === "REMOVED") return children;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        user={{ name: user.name, role: user.role }}
        items={NAV_ITEMS[user.role]}
        homeHref={homePath(user.role)}
      />
      {user.status === "SUSPENDED" && <SuspendedBanner reason={user.statusReason} />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
