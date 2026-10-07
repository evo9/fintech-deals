"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import type { AssetCategory, AssetType, BuyerType, LicenseType } from "@prisma/client";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChipGroup, CountryChecklist } from "@/components/shared/filter-panel";
import { useFocusFirstError } from "@/components/shared/use-focus-first-error";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  BUYER_TYPE_LABELS,
  LICENSE_TYPE_LABELS,
  toOptions,
} from "@/lib/reference";
import { saveProfile } from "../actions";
import type { BuyerCard as BuyerCardData, OwnProfile } from "../queries";
import { buyerProfileSchema, formDataToProfile } from "../schema";
import { BuyerCard } from "./buyer-card";

type FieldErrors = Record<string, string[] | undefined>;
type Values = {
  companyName: string;
  buyerType: BuyerType | "";
  headline: string;
  about: string;
  countries: string[];
  licenseTypes: LicenseType[];
  categories: AssetCategory[];
  assetTypes: AssetType[];
  budgetMin: string;
  budgetMax: string;
};

const NONE = "none";
const BUYER_TYPE_ITEMS = [{ value: NONE, label: "Not specified" }, ...toOptions(BUYER_TYPE_LABELS)];
const digits = (s: string) => s.replace(/\D/g, "").slice(0, 10);

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** Label, control and an error line with reserved height. */
function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint && <span className="text-xs text-text-muted tabular-nums">{hint}</span>}
      </div>
      {children}
      <p id={`${id}-error`} aria-live="polite" className="min-h-5 text-sm text-danger-text">
        {error}
      </p>
    </div>
  );
}

export function ProfileForm({ own, suspended, visible }: { own: OwnProfile; suspended: boolean; visible: boolean }) {
  const [state, formAction, pending] = useActionState(saveProfile, null);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [values, setValues] = useState<Values>(() => ({
    companyName: own.companyName ?? "",
    buyerType: own.profile.buyerType ?? "",
    headline: own.profile.headline ?? "",
    about: own.profile.about ?? "",
    countries: own.profile.countries,
    licenseTypes: own.profile.licenseTypes,
    categories: own.profile.categories,
    assetTypes: own.profile.assetTypes,
    budgetMin: own.profile.budgetMin?.toString() ?? "",
    budgetMax: own.profile.budgetMax?.toString() ?? "",
  }));

  const errors = clientErrors ?? (state && !state.ok ? state.fieldErrors : undefined);
  useFocusFirstError(errors);
  // fields touched since the last failed submit: their old message goes away
  const [cleared, setCleared] = useState<string[]>([]);
  const [seenErrors, setSeenErrors] = useState(errors);
  if (errors !== seenErrors) {
    setSeenErrors(errors);
    setCleared([]);
  }
  const err = (key: string) => (cleared.includes(key) ? undefined : errors?.[key]?.[0]);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setCleared((c) => [...new Set([...c, key, ...(key === "budgetMin" ? ["budgetMax"] : [])])]);
  };

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Profile saved");
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state]);

  const preview: BuyerCardData = {
    id: "preview",
    name: own.name,
    companyName: values.companyName.trim() || null,
    country: own.country,
    buyerProfile: {
      buyerType: values.buyerType || null,
      headline: values.headline.trim() || null,
      countries: values.countries,
      licenseTypes: values.licenseTypes,
      categories: values.categories,
      assetTypes: values.assetTypes,
      budgetMin: /^\d+$/.test(values.budgetMin) ? Number(values.budgetMin) : null,
      budgetMax: /^\d+$/.test(values.budgetMax) ? Number(values.budgetMax) : null,
    },
    match: null,
  };

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(e) => {
        const result = buyerProfileSchema.safeParse(formDataToProfile(new FormData(e.currentTarget)));
        if (!result.success) {
          e.preventDefault(); // show errors without a round trip
          setClientErrors(z.flattenError(result.error).fieldErrors);
        } else {
          setClientErrors(null);
        }
      }}
      className="grid items-start gap-6 lg:grid-cols-2"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <Section title="About">
          <Field id="companyName" label="Company" error={err("companyName")}>
            <Input
              id="companyName"
              name="companyName"
              value={values.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              autoComplete="organization"
              aria-invalid={err("companyName") ? true : undefined}
              aria-describedby="companyName-error"
            />
          </Field>
          <Field id="buyerType" label="Buyer type" error={err("buyerType")}>
            <input type="hidden" name="buyerType" value={values.buyerType} />
            <Select
              value={values.buyerType || NONE}
              items={BUYER_TYPE_ITEMS}
              onValueChange={(v) => set("buyerType", v === NONE ? "" : (String(v) as BuyerType))}
            >
              <SelectTrigger id="buyerType" className="w-full" aria-describedby="buyerType-error">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {BUYER_TYPE_ITEMS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="headline" label="Headline" error={err("headline")} hint={`${values.headline.length}/120`}>
            <Input
              id="headline"
              name="headline"
              value={values.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="Family office seeking regulated payment businesses in the EU"
              aria-invalid={err("headline") ? true : undefined}
              aria-describedby="headline-error"
            />
          </Field>
          <Field id="about" label="About" error={err("about")} hint={`${values.about.length}/2000`}>
            <Textarea
              id="about"
              name="about"
              value={values.about}
              onChange={(e) => set("about", e.target.value)}
              rows={5}
              placeholder="Who you are, how you invest, what you bring to a deal."
              aria-invalid={err("about") ? true : undefined}
              aria-describedby="about-error"
            />
          </Field>
        </Section>

        <Section
          title="Investment interests"
          description="Sellers find you by these. Leave a group empty to match anything."
        >
          {values.countries.map((c) => (
            <input key={c} type="hidden" name="countries" value={c} />
          ))}
          {values.licenseTypes.map((c) => (
            <input key={c} type="hidden" name="licenseTypes" value={c} />
          ))}
          {values.categories.map((c) => (
            <input key={c} type="hidden" name="categories" value={c} />
          ))}
          {values.assetTypes.map((c) => (
            <input key={c} type="hidden" name="assetTypes" value={c} />
          ))}
          <CountryChecklist value={values.countries} onChange={(v) => set("countries", v)} />
          <ChipGroup
            title="License types"
            labels={LICENSE_TYPE_LABELS}
            value={values.licenseTypes}
            onChange={(v) => set("licenseTypes", v)}
          />
          <ChipGroup
            title="Types of business"
            labels={ASSET_CATEGORY_LABELS}
            value={values.categories}
            onChange={(v) => set("categories", v)}
          />
          <ChipGroup
            title="Asset types"
            labels={ASSET_TYPE_LABELS}
            value={values.assetTypes}
            onChange={(v) => set("assetTypes", v)}
          />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field id="budgetMin" label="Budget from (EUR)" error={err("budgetMin")}>
              <Input
                id="budgetMin"
                name="budgetMin"
                inputMode="numeric"
                value={values.budgetMin}
                onChange={(e) => set("budgetMin", digits(e.target.value))}
                placeholder="500000"
                aria-invalid={err("budgetMin") ? true : undefined}
                aria-describedby="budgetMin-error"
              />
            </Field>
            <Field id="budgetMax" label="Budget to (EUR)" error={err("budgetMax")}>
              <Input
                id="budgetMax"
                name="budgetMax"
                inputMode="numeric"
                value={values.budgetMax}
                onChange={(e) => set("budgetMax", digits(e.target.value))}
                placeholder="5000000"
                aria-invalid={err("budgetMax") ? true : undefined}
                aria-describedby="budgetMax-error"
              />
            </Field>
          </div>
        </Section>

        <div className="flex flex-col gap-3 rounded-xl border bg-surface p-4 sm:p-6">
          <p aria-live="polite" className="min-h-5 text-sm text-danger-text">
            {suspended ? "Your account is suspended, so changes cannot be saved." : ""}
          </p>
          <div>
            <Button type="submit" disabled={pending || suspended}>
              Save profile
            </Button>
          </div>
        </div>
      </div>

      <aside className="min-w-0 lg:sticky lg:top-24">
        <div className="mb-4 hidden lg:block">
          <VisibilityBadge visible={visible} suspended={suspended} />
        </div>
        <h2 className="mb-1 text-lg font-semibold">Preview</h2>
        <p className="mb-3 text-sm text-text-muted">How sellers see your card in the buyers catalog.</p>
        <ul inert aria-label="Profile preview" className="pointer-events-none">
          <BuyerCard buyer={preview} viewerSuspended={false} preview />
        </ul>
      </aside>
    </form>
  );
}

/** Whether sellers can find this buyer (saved state). Shown in the page header on mobile, next to the preview on desktop. */
export function VisibilityBadge({ visible, suspended = false }: { visible: boolean; suspended?: boolean }) {
  if (visible) return <Badge variant="success">Profile visible to sellers</Badge>;
  return (
    <Badge variant="warning">
      {suspended ? "Hidden from sellers: your account is suspended" : "Hidden from sellers: add your interests"}
    </Badge>
  );
}
