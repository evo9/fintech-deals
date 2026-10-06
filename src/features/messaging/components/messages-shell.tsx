import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Two panels on desktop (list left, conversation right); on a narrow screen one at a time:
 * the list at /messages, the conversation at /messages/[id].
 */
export function MessagesShell({ list, thread, hasThread }: { list: ReactNode; thread: ReactNode; hasThread: boolean }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6">
      <div className="grid h-[calc(100dvh-9.5rem)] min-h-[480px] grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className={cn("min-h-0 min-w-0", hasThread && "hidden lg:block")}>{list}</div>
        <div className={cn("min-h-0 min-w-0", !hasThread && "hidden lg:block")}>{thread}</div>
      </div>
    </main>
  );
}
