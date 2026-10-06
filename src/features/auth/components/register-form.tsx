"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFocusFirstError } from "@/components/shared/use-focus-first-error";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/reference";
import { cn } from "@/lib/utils";
import { register } from "../actions";
import { formDataToRegister, registerSchema } from "../schema";

type FieldErrors = Record<string, string[] | undefined>;
type RegisterRole = "BUYER" | "SELLER";

const ROLE_OPTIONS: { value: RegisterRole; label: string }[] = [
  { value: "BUYER", label: "Buyer" },
  { value: "SELLER", label: "Seller" },
];

const COUNTRY_ITEMS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  return (
    <p id={id} className="min-h-5 text-sm text-danger-text">
      {messages?.[0]}
    </p>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, null);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);

  const [role, setRole] = useState<RegisterRole>("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");

  const errors = clientErrors ?? (state && !state.ok ? state.fieldErrors : undefined);
  useFocusFirstError(errors);
  const formError = !clientErrors && state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <section className="rounded-xl border bg-surface p-8">
      <h1 className="text-3xl font-semibold">Create an account</h1>

      <form
        action={formAction}
        noValidate
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          const result = registerSchema.safeParse(formDataToRegister(new FormData(e.currentTarget)));
          if (!result.success) {
            e.preventDefault(); // show errors without a round trip
            setClientErrors(z.flattenError(result.error).fieldErrors);
          } else {
            setClientErrors(null); // server errors take over from here
          }
        }}
      >
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">I am a</legend>
          <div className="inline-flex rounded-full bg-muted p-[3px]">
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "relative inline-flex h-9 min-w-24 cursor-pointer items-center justify-center rounded-full border border-transparent px-4 text-sm font-medium text-foreground/75 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring",
                  role === option.value && "border-border bg-surface text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors?.name ? true : undefined}
            aria-describedby="name-error"
          />
          <FieldError id="name-error" messages={errors?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors?.email ? true : undefined}
            aria-describedby="email-error"
          />
          <FieldError id="email-error" messages={errors?.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={errors?.password ? true : undefined}
            aria-describedby="password-hint password-error"
          />
          <p id="password-hint" className="text-sm text-text-muted">
            At least 8 characters.
          </p>
          <FieldError id="password-error" messages={errors?.password} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company (optional)</Label>
            <Input
              id="companyName"
              name="companyName"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              aria-invalid={errors?.companyName ? true : undefined}
              aria-describedby="companyName-error"
            />
            <FieldError id="companyName-error" messages={errors?.companyName} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country (optional)</Label>
            <Select
              items={COUNTRY_ITEMS}
              value={country}
              onValueChange={(value) => setCountry(value ?? "")}
            >
              <SelectTrigger id="country" className="w-full" aria-describedby="country-error">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_ITEMS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="country" value={country} />
            <FieldError id="country-error" messages={errors?.country} />
          </div>
        </div>

        <p role="alert" className="min-h-5 text-sm text-danger-text">
          {formError}
        </p>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
