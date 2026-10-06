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
