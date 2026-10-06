import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/guards";
import { homePath } from "@/features/auth/home";

// No session -> /login, REMOVED -> /account-removed (both inside requireUser).
export default async function RootPage() {
  const user = await requireUser({ allowSuspended: true });
  redirect(homePath(user.role));
}
