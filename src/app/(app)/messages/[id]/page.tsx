import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/guards";
import { participantPausedReason } from "@/features/access/visibility";
import { ConversationList } from "@/features/messaging/components/conversation-list";
import { MessageThread } from "@/features/messaging/components/message-thread";
import { MessagesShell } from "@/features/messaging/components/messages-shell";
import { getConversationForViewer, listConversations } from "@/features/messaging/queries";
import { PAGE_SIZE, parsePage, totalPages, withPage } from "@/lib/pagination";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = { title: "Messages" };

// Participants only; someone else's conversation and a missing one are both a 404 (spec section 5).
export default async function ConversationPage({ params, searchParams }: Props) {
  const [{ id }, raw] = await Promise.all([params, searchParams]);
  const user = await requireUser({ roles: ["BUYER", "SELLER"], allowSuspended: true, next: `/messages/${id}` });
  const page = parsePage(raw.page);

  const [conversation, list] = await Promise.all([getConversationForViewer(user, id), listConversations(user, page)]);

  const pages = totalPages(list.total, PAGE_SIZE.rows);
  if (page > pages) redirect(`/messages/${id}?${withPage(raw, pages)}`.replace(/\?$/, ""));

  const pausedReason =
    user.status === "SUSPENDED"
      ? "Your account is suspended. Messaging is paused."
      : participantPausedReason(conversation.counterpart.status);

  return (
    <MessagesShell
      hasThread
      list={<ConversationList items={list.items} total={list.total} page={page} activeId={conversation.id} />}
      thread={
        <MessageThread
          key={conversation.id}
          conversationId={conversation.id}
          viewerId={user.id}
          counterpart={conversation.counterpart}
          asset={conversation.asset}
          initialMessages={conversation.messages}
          initialHasMore={conversation.hasMore}
          pausedReason={pausedReason}
          backHref={page > 1 ? `/messages?page=${page}` : "/messages"}
        />
      }
    />
  );
}
