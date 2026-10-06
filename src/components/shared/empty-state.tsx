import type { ReactNode } from "react";

/** Every list has one, and it offers an action (children): a button or a link. */
export function EmptyState({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-surface px-6 py-12 text-center">
      {icon && (
        <div aria-hidden className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <div className="mt-1 max-w-md text-text-muted">{description}</div>}
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
