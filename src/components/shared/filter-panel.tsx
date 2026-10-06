"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { COUNTRIES, toOptions } from "@/lib/reference";
import { cn } from "@/lib/utils";
import { CountryFlag } from "./country-flag";

const EU_CODES = COUNTRIES.filter((c) => c.eu).map((c) => c.code);

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * The "Filters" button of every list: a popover on desktop, a sheet on mobile. `children` renders the
 * form (it is mounted only while the panel is open) and gets a way to close the panel.
 */
export function FilterPanel({
  activeCount,
  description,
  children,
}: {
  activeCount: number;
  description: string;
  children: (panel: { done: () => void; mobile: boolean; className: string }) => ReactNode;
}) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const label = (
    <>
      <SlidersHorizontalIcon aria-hidden />
      Filters
      {activeCount > 0 && (
        <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">
          {activeCount}
        </span>
      )}
    </>
  );

  return (
    <>
      <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
        <PopoverTrigger render={<Button variant="outline" className="hidden md:inline-flex" />}>{label}</PopoverTrigger>
        <PopoverContent align="end" className="w-[26rem] gap-0 rounded-xl p-0">
          {children({
            done: () => setDesktopOpen(false),
            mobile: false,
            className: "max-h-[min(36rem,var(--available-height))]",
          })}
        </PopoverContent>
      </Popover>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger render={<Button variant="outline" className="shrink-0 md:hidden" />}>{label}</SheetTrigger>
        <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-sm">
          <SheetHeader className="border-b">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription className="sr-only">{description}</SheetDescription>
          </SheetHeader>
          {children({ done: () => setMobileOpen(false), mobile: true, className: "min-h-0 flex-1" })}
        </SheetContent>
      </Sheet>
    </>
  );
}

export function FilterFooter({ children }: { children: ReactNode }) {
  return <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t bg-popover p-3">{children}</SheetFooter>;
}

export function FilterGroup({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <div className="mb-2 flex h-7 items-center justify-between">
        <legend className="float-left text-sm font-semibold">{title}</legend>
        {action}
      </div>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export function ChipGroup<T extends string>({
  title,
  labels,
  value,
  onChange,
}: {
  title: string;
  labels: Record<T, string>;
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <FilterGroup title={title}>
      <div className="flex flex-wrap gap-2">
        {toOptions(labels).map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(toggle(value, o.value))}
              className={cn(
                "h-8 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                on ? "border-primary bg-primary-soft font-medium text-primary" : "bg-surface hover:bg-primary-soft",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </FilterGroup>
  );
}

/** Countries with flags and the "All EU" shortcut. */
export function CountryChecklist({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const allEu = EU_CODES.every((c) => value.includes(c));
  return (
    <FilterGroup
      title="Country"
      action={
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-pressed={allEu}
          onClick={() => onChange(allEu ? value.filter((c) => !EU_CODES.includes(c)) : [...new Set([...value, ...EU_CODES])])}
        >
          {allEu ? "Clear EU" : "All EU"}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {COUNTRIES.map((c) => (
          <Label key={c.code} className="flex min-h-9 cursor-pointer items-center gap-2 font-normal">
            <Checkbox checked={value.includes(c.code)} onCheckedChange={() => onChange(toggle(value, c.code))} />
            <CountryFlag code={c.code} className="w-5" />
            <span className="truncate">{c.name}</span>
          </Label>
        ))}
      </div>
    </FilterGroup>
  );
}
