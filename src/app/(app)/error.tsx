"use client";

import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

// Inside the app layout, so the header stays. Expected failures are shown by the actions themselves;
// this is only for unexpected render errors.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-16">
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={<AlertTriangleIcon className="size-5" />}
          title="Something went wrong"
          description="The page could not be loaded. Try again, and if it keeps failing, reload the page."
        >
          <Button onClick={reset}>Try again</Button>
        </EmptyState>
      </div>
    </main>
  );
}
