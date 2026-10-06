"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFocusFirstError } from "@/components/shared/use-focus-first-error";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  BUSINESS_STATUS_LABELS,
  COUNTRIES,
  LICENSE_TYPE_LABELS,
  defaultRegulator,
  toOptions,
} from "@/lib/reference";
import { cn } from "@/lib/utils";
import { createAsset, deleteDraftAsset, updateAsset, type SavedAsset } from "../actions";
import type { AssetForEdit } from "../queries";
import { DESCRIPTION_MAX, HEADLINE_MAX, MAX_INCLUDED, assetSchema, formDataToAsset, type AssetIntent } from "../schema";
import { AssetCard } from "./asset-card";

type FieldErrors = Record<string, string[] | undefined>;

type Values = {
  headline: string;
  category: string;
  licenseType: string;
  assetType: string;
  businessStatus: string;
  country: string;
  regulator: string;
  yearOfIssue: string;
  employees: string;
  priceOnRequest: boolean;
  askingPrice: string;
  included: string[];
  description: string;
};

const EMPTY: Values = {
  headline: "",
  category: "",
  licenseType: "",
  assetType: "",
  businessStatus: "",
  country: "",
  regulator: "",
  yearOfIssue: "",
  employees: "",
  priceOnRequest: false,
  askingPrice: "",
  included: [],
  description: "",
};

function valuesOf(asset: AssetForEdit | undefined): Values {
  if (!asset) return EMPTY;
  return {
    headline: asset.headline,
    category: asset.category,
    licenseType: asset.licenseType,
    assetType: asset.assetType,
    businessStatus: asset.businessStatus,
    country: asset.country,
    regulator: asset.regulator,
    yearOfIssue: asset.yearOfIssue?.toString() ?? "",
    employees: asset.employees?.toString() ?? "",
    priceOnRequest: asset.askingPrice === null,
    askingPrice: asset.askingPrice?.toString() ?? "",
    included: asset.included,
    description: asset.description,
  };
}

const COUNTRY_ITEMS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const digits = (s: string, max: number) => s.replace(/\D/g, "").slice(0, max);

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      <div className="mt-4 grid gap-x-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Label, control and an error line with reserved height, so a message does not move the fields below. */
function Field({
  id,
  label,
  error,
  hint,
  wide,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2 pb-1", wide && "sm:col-span-2")}>
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

function EnumSelect({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  invalid: boolean;
}) {
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value || null} items={options} onValueChange={(v) => onChange(String(v ?? ""))}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-error`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export function AssetForm({ asset, suspended }: { asset?: AssetForEdit; suspended: boolean }) {
  const router = useRouter();
  const editing = asset !== undefined;
  const isDraft = !editing || asset.status === "DRAFT";
  const readOnly = editing && asset.status === "REMOVED";

  const [state, formAction, pending] = useActionState(editing ? updateAsset : createAsset, null);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [values, setValues] = useState<Values>(() => valuesOf(asset));
  const [baseline, setBaseline] = useState(() => JSON.stringify(valuesOf(asset)));
  const [tagDraft, setTagDraft] = useState("");
  const [tagError, setTagError] = useState("");
  const lastIntent = useRef<AssetIntent>("draft");
  // what was sent with the last submit; becomes the "saved" baseline when the action succeeds
  const [submitted, setSubmitted] = useState(baseline);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setBaseline(submitted); // nothing is unsaved any more
  }

  const errors = clientErrors ?? (state && !state.ok ? state.fieldErrors : undefined);
  // fields the user has touched since the last failed submit: their old message goes away
  const [cleared, setCleared] = useState<string[]>([]);
  const [seenErrors, setSeenErrors] = useState(errors);
  if (errors !== seenErrors) {
    setSeenErrors(errors);
    setCleared([]);
  }
  const clear = (...keys: string[]) => setCleared((c) => [...new Set([...c, ...keys])]);
  const dirty = JSON.stringify(values) !== baseline;

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    clear(key, ...(key === "priceOnRequest" ? ["askingPrice"] : []));
  };
  const err = (key: string) => (cleared.includes(key) ? undefined : errors?.[key]?.[0]);

  useFocusFirstError(errors);

  // Browser warning when leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Result of the action: feedback and navigation
  useEffect(() => {
    if (!state) return;
    if (!state.ok) {
      if (!state.fieldErrors) toast.error(state.error); // field errors get their own toast above
      return;
    }
    const saved: SavedAsset = state.data;
    if (lastIntent.current === "publish") {
      toast.success("Asset published");
      router.push(`/assets/${saved.id}`);
    } else if (lastIntent.current === "save") {
      toast.success("Changes saved");
      router.push(`/assets/${saved.id}`);
    } else {
      toast.success("Draft saved");
      if (editing) router.refresh();
      else router.replace(`/my-assets/${saved.id}/edit`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function changeCountry(code: string) {
    clear("country", "regulator");
    setValues((v) => {
      // the regulator follows the country until the seller types their own
      const followsCountry = v.regulator === "" || v.regulator === defaultRegulator(v.country);
      return { ...v, country: code, regulator: followsCountry ? defaultRegulator(code) : v.regulator };
    });
  }

  function addTag() {
    const tag = tagDraft.trim();
    if (!tag) return;
    if (tag.length > 60) return setTagError("Each tag can have up to 60 characters");
    if (values.included.some((t) => t.toLowerCase() === tag.toLowerCase())) return setTagError("This tag is already added");
    if (values.included.length >= MAX_INCLUDED) return setTagError(`Add up to ${MAX_INCLUDED} items`);
    set("included", [...values.included, tag]);
    setTagDraft("");
    setTagError("");
  }

  const previewReady = values.category && values.licenseType && values.assetType && values.businessStatus && values.country;
  const preview = previewReady
    ? {
        id: asset?.id ?? 0,
        sellerId: "",
        headline: values.headline.trim() || "Your headline",
        category: values.category as AssetForEdit["category"],
        licenseType: values.licenseType as AssetForEdit["licenseType"],
        assetType: values.assetType as AssetForEdit["assetType"],
        businessStatus: values.businessStatus as AssetForEdit["businessStatus"],
        country: values.country,
        regulator: values.regulator.trim() || defaultRegulator(values.country),
        yearOfIssue: /^\d{4}$/.test(values.yearOfIssue) ? Number(values.yearOfIssue) : null,
        employees: /^\d+$/.test(values.employees) ? Number(values.employees) : null,
        askingPrice: values.priceOnRequest || !/^\d+$/.test(values.askingPrice) ? null : Number(values.askingPrice),
        included: values.included,
        description: values.description.trim() || "Your description will appear here.",
        publishedAt: new Date(),
        validatedAt: null,
        match: null,
      }
    : null;

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const intent = (submitter?.value ?? "draft") as AssetIntent;
        lastIntent.current = intent;
        setSubmitted(JSON.stringify(values));
        const result = assetSchema(intent === "draft" ? "draft" : "publish").safeParse(
          formDataToAsset(new FormData(e.currentTarget, submitter)),
        );
        if (!result.success) {
          e.preventDefault(); // show errors without a round trip
          setClientErrors(z.flattenError(result.error).fieldErrors);
        } else {
          setClientErrors(null);
        }
      }}
      className="grid items-start gap-6 lg:grid-cols-2"
    >
      {editing && <input type="hidden" name="id" value={asset.id} />}

      <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-6">
        {readOnly && (
          <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm break-words text-danger-text">
            This asset was removed from listings{asset.removedReason ? `: ${asset.removedReason}` : "."} It can no longer be
            edited or published.
          </p>
        )}

        <Section title="Basics">
          <Field id="headline" label="Headline" error={err("headline")} hint={`${values.headline.length}/${HEADLINE_MAX}`} wide>
            <Input
              id="headline"
              name="headline"
              value={values.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="Dual-licensed Maltese EMI and CASP"
              aria-invalid={err("headline") ? true : undefined}
              aria-describedby="headline-error"
            />
          </Field>
          <Field id="category" label="Type of business" error={err("category")}>
            <EnumSelect
              id="category"
              name="category"
              value={values.category}
              onChange={(v) => set("category", v)}
              options={toOptions(ASSET_CATEGORY_LABELS)}
              placeholder="Choose a type"
              invalid={!!err("category")}
            />
          </Field>
          <Field id="licenseType" label="License type" error={err("licenseType")}>
            <EnumSelect
              id="licenseType"
              name="licenseType"
              value={values.licenseType}
              onChange={(v) => set("licenseType", v)}
              options={toOptions(LICENSE_TYPE_LABELS)}
              placeholder="Choose a license"
              invalid={!!err("licenseType")}
            />
          </Field>
          <Field id="assetType" label="Asset type" error={err("assetType")}>
            <EnumSelect
              id="assetType"
              name="assetType"
              value={values.assetType}
              onChange={(v) => set("assetType", v)}
              options={toOptions(ASSET_TYPE_LABELS)}
              placeholder="Choose an asset type"
              invalid={!!err("assetType")}
            />
          </Field>
          <Field id="businessStatus" label="Business status" error={err("businessStatus")}>
            <EnumSelect
              id="businessStatus"
              name="businessStatus"
              value={values.businessStatus}
              onChange={(v) => set("businessStatus", v)}
              options={toOptions(BUSINESS_STATUS_LABELS)}
              placeholder="Choose a status"
              invalid={!!err("businessStatus")}
            />
          </Field>
        </Section>

        <Section title="Jurisdiction">
          <Field id="country" label="Country" error={err("country")}>
            <EnumSelect
              id="country"
              name="country"
              value={values.country}
              onChange={changeCountry}
              options={COUNTRY_ITEMS}
              placeholder="Choose a country"
              invalid={!!err("country")}
            />
          </Field>
          <Field id="regulator" label="Regulator" error={err("regulator")}>
            <Input
              id="regulator"
              name="regulator"
              value={values.regulator}
              onChange={(e) => set("regulator", e.target.value)}
              placeholder="Filled in from the country"
              aria-invalid={err("regulator") ? true : undefined}
              aria-describedby="regulator-error"
            />
          </Field>
        </Section>

        <Section title="Details" description="Optional, but buyers look at them.">
          <Field id="yearOfIssue" label="Year of issue" error={err("yearOfIssue")}>
            <Input
              id="yearOfIssue"
              name="yearOfIssue"
              inputMode="numeric"
              value={values.yearOfIssue}
              onChange={(e) => set("yearOfIssue", digits(e.target.value, 4))}
              placeholder="2019"
              aria-invalid={err("yearOfIssue") ? true : undefined}
              aria-describedby="yearOfIssue-error"
            />
          </Field>
          <Field id="employees" label="Employees" error={err("employees")}>
            <Input
              id="employees"
              name="employees"
              inputMode="numeric"
              value={values.employees}
              onChange={(e) => set("employees", digits(e.target.value, 6))}
              placeholder="12"
              aria-invalid={err("employees") ? true : undefined}
              aria-describedby="employees-error"
            />
          </Field>
        </Section>

        <Section title="Price">
          <Field id="askingPrice" label="Asking price (EUR)" error={err("askingPrice")}>
            <Input
              id="askingPrice"
              name="askingPrice"
              inputMode="numeric"
              value={values.priceOnRequest ? "" : values.askingPrice}
              onChange={(e) => set("askingPrice", digits(e.target.value, 10))}
              disabled={values.priceOnRequest}
              placeholder="5400000"
              aria-invalid={err("askingPrice") ? true : undefined}
              aria-describedby="askingPrice-error"
            />
          </Field>
          <div className="flex items-start sm:pt-8">
            <Label className="flex min-h-10 cursor-pointer items-center gap-2 font-normal">
              <Checkbox
                checked={values.priceOnRequest}
                onCheckedChange={(v) => set("priceOnRequest", v === true)}
              />
              Price on request
            </Label>
            <input type="hidden" name="priceOnRequest" value={values.priceOnRequest ? "1" : "0"} />
          </div>
        </Section>

        <Section title="What's included" description={`Press Enter to add an item. Up to ${MAX_INCLUDED}.`}>
          <Field
            id="included"
            label="Included items"
            error={tagError || err("included")}
            hint={`${values.included.length}/${MAX_INCLUDED}`}
            wide
          >
            <Input
              id="included"
              value={tagDraft}
              onChange={(e) => {
                setTagDraft(e.target.value);
                setTagError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Enter adds a tag, it does not submit the form
                  addTag();
                }
              }}
              placeholder="Mobile app"
              aria-invalid={tagError || err("included") ? true : undefined}
              aria-describedby="included-error"
            />
            {values.included.map((tag) => (
              <input key={tag} type="hidden" name="included" value={tag} />
            ))}
            <ul className="flex min-h-8 flex-wrap gap-2">
              {values.included.map((tag) => (
                <li key={tag} className="inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-muted/60 pr-1 pl-3 text-sm">
                  <span className="truncate">{tag}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => set("included", values.included.filter((t) => t !== tag))}
                    className="inline-flex size-6 items-center justify-center rounded-full outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <XIcon aria-hidden className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </Field>
        </Section>

        <Section title="Description">
          <Field id="description" label="Description" error={err("description")} hint={`${values.description.length}/${DESCRIPTION_MAX}`} wide>
            <Textarea
              id="description"
              name="description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              rows={7}
              placeholder="License history, operations, team, what a buyer takes over. At least 50 characters to publish."
              aria-invalid={err("description") ? true : undefined}
              aria-describedby="description-error"
            />
          </Field>
        </Section>

        {!readOnly && (
          <div className="flex flex-col gap-3 rounded-xl border bg-surface p-4 sm:p-6">
            <p aria-live="polite" className="min-h-5 text-sm text-danger-text">
              {suspended ? "Your account is suspended, so changes cannot be saved." : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {isDraft ? (
                <>
                  <Button type="submit" name="intent" value="publish" disabled={pending || suspended}>
                    Publish asset
                  </Button>
                  <Button type="submit" name="intent" value="draft" variant="outline" disabled={pending || suspended}>
                    Save draft
                  </Button>
                </>
              ) : (
                <Button type="submit" name="intent" value="save" disabled={pending || suspended}>
                  Save changes
                </Button>
              )}
              {editing && asset.status === "DRAFT" && <DeleteDraft id={asset.id} disabled={pending || suspended} />}
            </div>
          </div>
        )}
      </fieldset>

      <aside className="min-w-0 lg:sticky lg:top-24">
        <h2 className="mb-3 text-lg font-semibold">Preview</h2>
        {preview ? (
          // inert: the preview shows the card as buyers see it, its buttons must not react
          <ul inert aria-label="Card preview" className="pointer-events-none">
            <AssetCard asset={preview} viewerSuspended={false} />
          </ul>
        ) : (
          <div className="flex h-[338px] items-center justify-center rounded-xl border border-dashed bg-surface px-6 text-center text-sm text-text-muted">
            Choose the type of business, license, asset type, status and country to see the card.
          </div>
        )}
      </aside>
    </form>
  );
}

function DeleteDraft({ id, disabled }: { id: number; disabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="ghost" className="text-danger-text" disabled={disabled} />}>
        Delete draft
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this draft?</DialogTitle>
          <DialogDescription>The draft will be deleted for good. Published assets cannot be deleted.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>Cancel</DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteDraftAsset(id);
                if (res.ok) {
                  toast.success("Draft deleted");
                  router.push("/my-assets");
                } else {
                  toast.error(res.error);
                  setOpen(false);
                }
              })
            }
          >
            Delete draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
