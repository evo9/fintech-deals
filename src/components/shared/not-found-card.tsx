import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

/** The 404 body: the same card inside the app (with the header) and outside it (without). */
export function NotFoundCard() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-16">
      <div className="mx-auto max-w-xl">
        <EmptyState
          icon={<FileQuestionIcon className="size-5" />}
          title="Page not found"
          description="This page doesn't exist or you don't have access to it."
        >
          <Link href="/" className={buttonVariants()}>
            Go to home
          </Link>
        </EmptyState>
      </div>
    </main>
  );
}
