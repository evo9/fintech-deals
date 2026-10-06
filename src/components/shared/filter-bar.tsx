"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListState } from "./list-state";

/** Search box: updates the URL 300 ms after the last keystroke, no submit button. */
export function SearchInput({
  initialQ,
  placeholder,
  label = "Search",
}: {
  initialQ: string;
  placeholder: string;
  label?: string;
}) {
  const { update } = useListState();
  const [q, setQ] = useState(initialQ);
  // last value pushed to the URL: lets us tell "the server caught up" from "the URL was cleared elsewhere"
  const sent = useRef(initialQ);

  useEffect(() => {
    if (initialQ !== sent.current) {
      sent.current = initialQ;
      setQ(initialQ);
    }
  }, [initialQ]);

  useEffect(() => {
    const value = q.trim();
    if (value === sent.current) return;
    const t = setTimeout(() => {
      sent.current = value;
      update({ q: value || null });
    }, 300);
    return () => clearTimeout(t);
  }, [q, update]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" />
      <Input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pl-10"
      />
    </div>
  );
}

/**
 * Base of every list header: search + filter controls (children) on one row, then the
 * result count and "Clear filters". The count line has a fixed height so nothing jumps.
 */
export function FilterBar({
  total,
  singular,
  plural,
  filterKeys,
  hasActiveFilters,
  search,
  children,
}: {
  total: number;
  singular: string;
  plural: string;
  /** URL keys reset by "Clear filters" (include `q` when a search box is used). */
  filterKeys: string[];
  hasActiveFilters: boolean;
  search?: { initialQ: string; placeholder: string };
  children?: ReactNode;
}) {
  const { update } = useListState();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {search && <SearchInput initialQ={search.initialQ} placeholder={search.placeholder} />}
        {children}
      </div>
      <div className="mt-4 flex h-9 items-center gap-3">
        <p aria-live="polite" className="text-sm text-text-muted tabular-nums">
          {total} {total === 1 ? singular : plural}
        </p>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update(Object.fromEntries(filterKeys.map((k) => [k, null])))}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
