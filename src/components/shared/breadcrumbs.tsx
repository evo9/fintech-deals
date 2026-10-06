import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

/** Parent links and the current page (last item, no link). */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex min-w-0 items-center gap-1 text-sm text-text-muted">
      {items.map((item, i) => (
        <span key={item.label} className="flex min-w-0 items-center gap-1">
          {i > 0 && <ChevronRightIcon aria-hidden className="size-4 shrink-0" />}
          {item.href ? (
            <Link href={item.href} className="rounded-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="truncate font-medium text-foreground">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
