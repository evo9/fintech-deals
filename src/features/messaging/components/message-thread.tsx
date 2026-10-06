"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeftIcon, RefreshCwIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/shared/role-badge";
import { Textarea } from "@/components/ui/textarea";
import { formatAssetId, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { loadEarlierMessages, sendMessage } from "../actions";
import type { ThreadMessage } from "../queries";
import { MESSAGE_MAX } from "../schema";

type Bubble = ThreadMessage & { status?: "sending" | "failed"; error?: string };

type Props = {
  conversationId: string;
  viewerId: string;
  counterpart: { name: string; companyName: string | null; role: "BUYER" | "SELLER" | "MANAGER" };
  asset: { id: number; headline: string; linkable: boolean } | null;
  initialMessages: ThreadMessage[];
  initialHasMore: boolean;
  /** Why the input is off (the other side or the viewer is suspended / removed); null = can write. */
  pausedReason: string | null;
  backHref: string;
};

const dayOf = (iso: string) => iso.slice(0, 10); // UTC day, same on server and browser

export function MessageThread({
  conversationId,
  viewerId,
  counterpart,
  asset,
  initialMessages,
  initialHasMore,
  pausedReason,
  backHref,
}: Props) {
  const [messages, setMessages] = useState<Bubble[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [earlierError, setEarlierError] = useState("");
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const tempCounter = useRef(0);
  // what to do with the scroll position after the next render
  const scrollIntent = useRef<{ kind: "bottom" } | { kind: "keep"; height: number }>({ kind: "bottom" });

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const intent = scrollIntent.current;
    if (intent.kind === "bottom") el.scrollTop = el.scrollHeight;
    else el.scrollTop = el.scrollHeight - intent.height; // earlier messages were added above: stay where we were
  }, [messages]);

  async function deliver(tempId: string, body: string) {
    // a dropped connection throws instead of returning a result: treat it as a failed send too
    const res = await sendMessage(conversationId, body).catch(
      () => ({ ok: false as const, error: "No connection" }),
    );
    scrollIntent.current = { kind: "bottom" };
    setMessages((list) =>
      list.map((m) =>
        m.id !== tempId ? m : res.ok ? res.data : { ...m, status: "failed", error: res.error },
      ),
    );
  }

  function send() {
    const body = draft.trim();
    if (!body || body.length > MESSAGE_MAX || pausedReason) return;
    const tempId = `tmp-${++tempCounter.current}`;
    scrollIntent.current = { kind: "bottom" };
    setMessages((list) => [
      ...list,
      { id: tempId, senderId: viewerId, body, createdAt: new Date().toISOString(), status: "sending" },
    ]);
    setDraft("");
    void deliver(tempId, body);
  }

  function retry(m: Bubble) {
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, status: "sending", error: undefined } : x)));
    void deliver(m.id, m.body);
  }

  async function loadEarlier() {
    const first = messages.find((m) => !m.status);
    if (!first || loadingEarlier) return;
    setLoadingEarlier(true);
    setEarlierError("");
    const res = await loadEarlierMessages(conversationId, first.createdAt).catch(
      () => ({ ok: false as const, error: "No connection" }),
    );
    setLoadingEarlier(false);
    if (!res.ok) return setEarlierError(res.error);
    scrollIntent.current = { kind: "keep", height: scroller.current?.scrollHeight ?? 0 };
    setMessages((list) => [...res.data.messages, ...list]);
    setHasMore(res.data.hasMore);
  }

  return (
    <section aria-label="Conversation" className="flex h-full min-h-0 flex-col rounded-xl border bg-surface">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Link
          href={backHref}
          aria-label="Back to conversations"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full outline-none hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
        >
          <ArrowLeftIcon aria-hidden className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="truncate font-semibold">{counterpart.name}</span>
            <RoleBadge role={counterpart.role} className="h-5 shrink-0 px-2" />
          </p>
          <p className="truncate text-sm text-text-muted">
            {counterpart.companyName && `${counterpart.companyName} · `}
            {asset ? (
              asset.linkable ? (
                <Link href={`/assets/${asset.id}`} className="font-medium text-primary hover:underline">
                  Asset ID {formatAssetId(asset.id)}
                </Link>
              ) : (
                `Asset ID ${formatAssetId(asset.id)}`
              )
            ) : (
              "General"
            )}
            {asset && ` · ${asset.headline}`}
          </p>
        </div>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {hasMore && (
          <div className="mb-4 flex flex-col items-center gap-1">
            <Button type="button" variant="outline" size="sm" disabled={loadingEarlier} onClick={loadEarlier}>
              {loadingEarlier ? "Loading..." : "Load earlier messages"}
            </Button>
            <p aria-live="polite" className="min-h-4 text-xs text-danger-text">
              {earlierError}
            </p>
          </div>
        )}
        <ol className="flex flex-col gap-1.5">
          {messages.map((m, i) => {
            const mine = m.senderId === viewerId;
            const newDay = i === 0 || dayOf(messages[i - 1].createdAt) !== dayOf(m.createdAt);
            return (
              <li key={m.id} className="flex flex-col">
                {newDay && (
                  <p className="my-3 text-center text-xs font-medium text-text-muted">{formatDate(m.createdAt)}</p>
                )}
                <div className={cn("flex flex-col gap-0.5", mine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 break-words whitespace-pre-wrap sm:max-w-[75%]",
                      mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
                      m.status === "sending" && "opacity-70",
                      m.status === "failed" && "ring-2 ring-danger/60",
                    )}
                  >
                    {m.body}
                  </div>
                  <p className="flex items-center gap-2 px-1 text-xs text-text-muted tabular-nums">
                    {m.status === "failed" ? (
                      <>
                        <span className="text-danger-text">Not sent{m.error ? `: ${m.error}` : ""}</span>
                        <button
                          type="button"
                          onClick={() => retry(m)}
                          className="inline-flex items-center gap-1 font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <RefreshCwIcon aria-hidden className="size-3" />
                          Retry
                        </button>
                      </>
                    ) : m.status === "sending" ? (
                      "Sending..."
                    ) : (
                      formatTime(m.createdAt)
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <footer className="shrink-0 border-t p-3">
        {pausedReason ? (
          <p role="status" className="rounded-lg bg-warning/10 px-4 py-3 text-sm font-medium text-warning-text">
            {pausedReason}
          </p>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Textarea
              aria-label="Message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault(); // Enter sends, Shift+Enter adds a line
                  send();
                }
              }}
              rows={1}
              maxLength={MESSAGE_MAX}
              placeholder="Write a message"
              className="max-h-40 min-h-10 flex-1 resize-none rounded-2xl py-2"
            />
            <Button type="submit" size="icon" aria-label="Send message" disabled={!draft.trim()}>
              <SendIcon aria-hidden />
            </Button>
          </form>
        )}
      </footer>
    </section>
  );
}
