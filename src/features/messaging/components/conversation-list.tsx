import Link from "next/link";
import { ListStateProvider } from "@/components/shared/list-state";
import { Pagination } from "@/components/shared/pagination";
import { RoleBadge } from "@/components/shared/role-badge";
import { formatAssetId, formatDate } from "@/lib/format";
import { USER_STATUS_LABELS } from "@/lib/reference";
import { PAGE_SIZE, totalPages } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import type { ConversationItem } from "../queries";

/** Left panel: the viewer's conversations, 10 per page. The open one is highlighted. */
export function ConversationList({
  items,
  total,
  page,
  activeId,
}: {
  items: ConversationItem[];
  total: number;
  page: number;
  activeId?: string;
}) {
  const pages = totalPages(total, PAGE_SIZE.rows);
  const suffix = page > 1 ? `?page=${page}` : "";

  return (
    <section aria-label="Conversations" className="flex h-full min-h-0 flex-col rounded-xl border bg-surface">
      <h1 className="shrink-0 border-b px-4 py-3 text-lg font-semibold">Messages</h1>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}${suffix}`}
              aria-current={c.id === activeId ? "page" : undefined}
              className={cn(
                "flex h-[84px] flex-col justify-center gap-0.5 px-4 outline-none transition-colors hover:bg-primary-soft focus-visible:bg-primary-soft",
                c.id === activeId && "bg-primary-soft",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-semibold">{c.counterpart.name}</span>
                <span className="shrink-0 text-xs text-text-muted tabular-nums">{formatDate(c.lastMessageAt)}</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-text-muted">
                <RoleBadge role={c.counterpart.role} className="h-5 shrink-0 px-2" />
                <span className="truncate">
                  {c.asset ? `Asset ID ${formatAssetId(c.asset.id)}` : "General"}
                  {c.counterpart.status !== "ACTIVE" && ` · ${USER_STATUS_LABELS[c.counterpart.status]}`}
                </span>
              </span>
              <span className="truncate text-sm text-foreground/80">
                {c.lastMessage ? `${c.lastMessage.fromMe ? "You: " : ""}${c.lastMessage.body}` : "No messages yet"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="shrink-0">
        <ListStateProvider>
          <Pagination page={page} pages={pages} />
        </ListStateProvider>
      </div>
    </section>
  );
}
