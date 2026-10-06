"use client";

import { createContext, useCallback, useContext, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Patch = Record<string, string | null>;
type ListState = { pending: boolean; update: (patch: Patch) => void };

const ListStateContext = createContext<ListState | null>(null);

/**
 * URL is the single source of truth for search, filters, sort and page. Changing anything
 * except `page` resets `page`. The old list stays on screen (see ListBody), no skeletons.
 */
export function ListStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (patch: Patch) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  return <ListStateContext.Provider value={{ pending, update }}>{children}</ListStateContext.Provider>;
}

export function useListState() {
  const ctx = useContext(ListStateContext);
  if (!ctx) throw new Error("useListState must be used inside ListStateProvider");
  return ctx;
}

/** Wraps the list: reduced opacity and a thin progress bar while the next state loads. */
export function ListBody({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useListState();
  return (
    <div
      aria-busy={pending}
      className={cn("relative transition-opacity motion-reduce:transition-none", pending && "opacity-60", className)}
    >
      <div className={cn("absolute inset-x-0 -top-2 h-0.5 overflow-hidden", !pending && "invisible")}>
        <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-primary motion-reduce:animate-none" />
      </div>
      {children}
    </div>
  );
}
