"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { pageItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { useListState } from "./list-state";

const BUTTON =
  "inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40";

/** Numbers with ellipsis and arrows. Fixed height; renders nothing for a single page. */
export function Pagination({ page, pages }: { page: number; pages: number }) {
  const { update } = useListState();
  if (pages <= 1) return null;

  const go = (n: number) => update({ page: n <= 1 ? null : String(n) });

  return (
    <nav aria-label="Pagination" className="mt-8 flex h-10 items-center justify-center gap-1">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className={cn(BUTTON, "hover:bg-primary-soft")}
      >
        <ChevronLeftIcon aria-hidden className="size-4" />
      </button>

      {pageItems(page, pages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="inline-flex size-10 items-center justify-center text-text-muted">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => go(item)}
            className={cn(BUTTON, item === page ? "bg-primary text-primary-foreground" : "hover:bg-primary-soft")}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pages}
        onClick={() => go(page + 1)}
        className={cn(BUTTON, "hover:bg-primary-soft")}
      >
        <ChevronRightIcon aria-hidden className="size-4" />
      </button>
    </nav>
  );
}
