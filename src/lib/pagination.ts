export const PAGE_SIZE = {
  cards: 8, // asset and buyer cards
  rows: 10, // my assets, conversations
  admin: 20, // manager tables, moderation log
} as const;

export const MESSAGES_PAGE = 30;

export function toSkipTake(page: number, size: number) {
  return { skip: (page - 1) * size, take: size };
}

export function totalPages(total: number, size: number) {
  return Math.max(1, Math.ceil(total / size));
}

export type PageItem = number | "gap";

/**
 * Page numbers for the pager: up to 7 slots, so its width does not change while paging.
 * 1 2 3 4 5 ... 48 | 1 ... 22 23 24 ... 48 | 1 ... 44 45 46 47 48
 */
export function pageItems(current: number, pages: number): PageItem[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "gap", pages];
  if (current >= pages - 3) return [1, "gap", pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, "gap", current - 1, current, current + 1, "gap", pages];
}

type RawParams = Record<string, string | string[] | undefined>;

/** Query string of the current URL with `page` replaced: used to redirect `?page=999` to the last page. */
export function withPage(params: RawParams, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) next.append(key, v);
  }
  if (page > 1) next.set("page", String(page));
  return next.toString();
}
