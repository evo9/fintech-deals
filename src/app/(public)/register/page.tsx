import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/components/register-form";
import { homePath } from "@/features/auth/home";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = { title: "Create an account - FintechDeeals" };

export default async function RegisterPage() {
  const user = await getSession();
  if (user && user.status !== "REMOVED") redirect(homePath(user.role));

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 md:py-16">
      <p className="mb-8 text-2xl font-semibold">FintechDeeals</p>
      <RegisterForm />
    </main>
  );
}
