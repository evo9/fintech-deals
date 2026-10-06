---
name: paginated-list
description: Pattern for any list screen in this project - URL state (q, filters, sort, page) parsed with zod, server query with total, page clamping, debounced search, transitions without skeletons, loading.tsx, pagination component. Use when building catalogs, my assets, buyers, conversations, admin tables, moderation log.
---

# Paginated list pattern (spec section 7, "Общее для всех списков")

## 1. Page sizes - `src/lib/pagination.ts`

```ts
export const PAGE_SIZE = {
  cards: 8,   // asset and buyer cards
  rows: 10,   // my assets, conversations
  admin: 20,  // manager tables, moderation log
} as const;

export const MESSAGES_PAGE = 30;

export function toSkipTake(page: number, size: number) {
  return { skip: (page - 1) * size, take: size };
}

export function totalPages(total: number, size: number) {
  return Math.max(1, Math.ceil(total / size));
}
```

## 2. URL params schema - `features/<feature>/schema.ts`

Invalid values fall back to defaults instead of throwing. Multi-select values are comma-separated (`?country=MT,LT`).

```ts
import { z } from 'zod';
import { AssetCategory } from '@prisma/client';

const csv = z.string().transform((s) => s.split(',').filter(Boolean));

export const assetListParams = z.object({
  q: z.string().trim().max(100).catch(''),
  category: z.enum(AssetCategory).optional().catch(undefined),
  country: csv.catch([]),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'best_match']).catch('newest'),
  page: z.coerce.number().int().min(1).catch(1),
});
export type AssetListParams = z.infer<typeof assetListParams>;
```

## 3. Query - `features/<feature>/queries.ts`

```ts
export async function listAssets(viewer: SessionUser, p: AssetListParams) {
  const where = { AND: [visibleAssetsWhere(viewer), buildAssetFilters(p)] };
  const [items, total] = await db.$transaction([
    db.asset.findMany({ where, orderBy: assetOrderBy(p.sort), ...toSkipTake(p.page, PAGE_SIZE.cards), select: assetCardSelect }),
    db.asset.count({ where }),
  ]);
  return { items, total };
}
```

## 4. Page - thin, server component

```tsx
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AssetsPage({ searchParams }: Props) {
  const user = await requireUser({ roles: ['BUYER'], allowSuspended: true });
  const params = assetListParams.parse(await searchParams);
  const { items, total } = await listAssets(user, params);

  const pages = totalPages(total, PAGE_SIZE.cards);
  if (params.page > pages) redirect(`/assets?${withPage(await searchParams, pages)}`); // ?page=999 -> last page

  return (
    <ListStateProvider>
      <AssetFilters params={params} total={total} />
      <ListBody>
        {items.length ? items.map((a) => <AssetCard key={a.id} asset={a} />) : <EmptyState ... />}
      </ListBody>
      <Pagination page={params.page} pages={pages} />
    </ListStateProvider>
  );
}
```

## 5. Client URL state - `src/components/shared/list-state.tsx`

Filter, tab, sort and page changes keep the old list at reduced opacity with a thin progress bar. No skeletons after the first load. Changing anything except `page` resets `page`.

```tsx
'use client';

import { createContext, useCallback, useContext, useTransition, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type Patch = Record<string, string | null>;
type ListState = { pending: boolean; update: (patch: Patch) => void };

const ListStateContext = createContext<ListState | null>(null);

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
      if (!('page' in patch)) next.delete('page');
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  return <ListStateContext.Provider value={{ pending, update }}>{children}</ListStateContext.Provider>;
}

export function useListState() {
  const ctx = useContext(ListStateContext);
  if (!ctx) throw new Error('useListState must be used inside ListStateProvider');
  return ctx;
}

export function ListBody({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useListState();
  return (
    <div aria-busy={pending} className={cn('relative transition-opacity motion-reduce:transition-none', pending && 'opacity-60', className)}>
      <div className={cn('absolute inset-x-0 -top-2 h-0.5 overflow-hidden', !pending && 'invisible')}>
        <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-primary motion-reduce:animate-none" />
      </div>
      {children}
    </div>
  );
}
```

Define the keyframes once in `globals.css`: `@keyframes progress { from { transform: translateX(-100%) } to { transform: translateX(300%) } }`.

Debounced search (300 ms, no button):

```tsx
const { update } = useListState();
const [q, setQ] = useState(initialQ);
useEffect(() => {
  if (q === initialQ) return;
  const t = setTimeout(() => update({ q: q.trim() || null }), 300);
  return () => clearTimeout(t);
}, [q]); // eslint-disable-line react-hooks/exhaustive-deps
```

## 6. Pagination component - `src/components/shared/pagination.tsx`

- Numbers with ellipsis: `1 2 3 ... 48`, current +-1, always first and last; prev/next arrows.
- Calls `update({ page: String(n) })` (page 1 -> `null`).
- Wrapper has a fixed height; render nothing when `pages <= 1`.
- `aria-label="Pagination"`, current page `aria-current="page"`.

## 7. `loading.tsx`

Skeletons with exactly the card size and inner tiles of the real card (same paddings and heights), count = page size, soft pulse. Shown only on first entry to the route.

## Checklist

- [ ] All state in URL, reload/back keeps it.
- [ ] `?page=999` redirects to last page; `?sort=garbage` falls back to default.
- [ ] Count line ("23 assets") and "Clear filters" when anything is set.
- [ ] Empty state with an action.
- [ ] Tab counters `tabular-nums` + fixed `min-w`.
