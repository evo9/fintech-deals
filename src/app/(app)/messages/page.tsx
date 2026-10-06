import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquareIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/features/auth/guards";
import { ConversationList } from "@/features/messaging/components/conversation-list";
import { MessagesShell } from "@/features/messaging/components/messages-shell";
import { listConversations } from "@/features/messaging/queries";
import { PAGE_SIZE, parsePage, totalPages, withPage } from "@/lib/pagination";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: Props) {
  const raw = await searchParams;
  const user = await requireUser({ roles: ["BUYER", "SELLER"], allowSuspended: true, next: "/messages" });
  const page = parsePage(raw.page);
  const { items, total } = await listConversations(user, page);

  const pages = totalPages(total, PAGE_SIZE.rows);
  if (page > pages) redirect(`/messages?${withPage(raw, pages)}`.replace(/\?$/, ""));

  if (total === 0) {
    return (
      <main className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <PageHeader title="Messages" />
        <EmptyState icon={<MessageSquareIcon className="size-5" />} title="No conversations yet.">
          <Link href={user.role === "BUYER" ? "/assets" : "/buyers"} className={buttonVariants()}>
            {user.role === "BUYER" ? "Browse assets" : "Browse buyers"}
          </Link>
        </EmptyState>
      </main>
    );
  }

  return (
    <MessagesShell
      hasThread={false}
      list={<ConversationList items={items} total={total} page={page} />}
      thread={
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-surface px-6 text-center text-text-muted">
          Select a conversation to read it.
        </div>
      }
    />
  );
}
