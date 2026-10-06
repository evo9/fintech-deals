"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "../actions";
import type { DemoAccount } from "../queries";
import { formDataToLogin, loginSchema } from "../schema";
import { DEMO_PASSWORD, DemoAccounts } from "./demo-accounts";
import { APP_NAME } from "@/lib/brand";

type FieldErrors = Record<string, string[] | undefined>;

export function LoginForm({
  accounts,
  next,
  removed,
}: {
  accounts: DemoAccount[];
  next?: string;
  removed: boolean;
}) {
  const [state, formAction, pending] = useActionState(login, null);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fieldErrors = clientErrors ?? (state && !state.ok ? state.fieldErrors : undefined);
  const formError = !clientErrors && state && !state.ok && !state.fieldErrors ? state.error : null;
  const notice = formError ?? (removed ? "This account has been removed from the platform." : null);

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <section className="rounded-xl border bg-surface p-8">
        <h1 className="text-3xl font-semibold">Log in</h1>

        <form
          action={formAction}
          noValidate
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            const result = loginSchema.safeParse(formDataToLogin(new FormData(e.currentTarget)));
            if (!result.success) {
              e.preventDefault(); // show errors without a round trip
              setClientErrors(z.flattenError(result.error).fieldErrors);
            } else {
              setClientErrors(null); // server errors take over from here
            }
          }}
        >
          {next && <input type="hidden" name="next" value={next} />}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={fieldErrors?.email ? true : undefined}
              aria-describedby="email-error"
            />
            <p id="email-error" className="min-h-5 text-sm text-danger-text">
              {fieldErrors?.email?.[0]}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={fieldErrors?.password ? true : undefined}
              aria-describedby="password-error"
            />
            <p id="password-error" className="min-h-5 text-sm text-danger-text">
              {fieldErrors?.password?.[0]}
            </p>
          </div>

          <p role="alert" className="min-h-10 text-sm text-danger-text sm:min-h-5">
            {notice}
          </p>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-text-muted">
          New to {APP_NAME}?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </section>

      <DemoAccounts
        accounts={accounts}
        selectedEmail={email}
        onPick={(account) => {
          setEmail(account.email);
          setPassword(DEMO_PASSWORD);
          setClientErrors(null);
        }}
      />
    </div>
  );
}
