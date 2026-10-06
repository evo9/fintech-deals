import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { homePath } from "@/features/auth/home";
import { safeNextPath } from "@/features/auth/guards";
import { listDemoAccounts } from "@/features/auth/queries";
import { getSession } from "@/features/auth/session";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Log in - FintechDeeals" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  // A logged-in user has nothing to do here; REMOVED users stay to see the reason.
  const user = await getSession();
  if (user && user.status !== "REMOVED") redirect(homePath(user.role));

  const accounts = await listDemoAccounts();

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-12 md:py-16">
      <p className="mb-8 text-2xl font-semibold">FintechDeeals</p>
      <LoginForm
        accounts={accounts}
        next={safeNextPath(first(params.next)) ?? undefined}
        removed={first(params.reason) === "removed"}
      />
    </main>
  );
}
